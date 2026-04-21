'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { setParameter } from 'agora-rtc-sdk-ng/esm';
import {
  useRTCClient,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  useClientEvent,
  useJoin,
  usePublish,
  RemoteUser,
} from 'agora-rtc-react';
import { DEFAULT_AGENT_UID } from '@/features/conversation/lib/agora-config';
import {
  getMessageList,
  normalizeTranscript,
} from '@/features/conversation/lib/transcript';
import { mapAgentVisualizerState } from '@/features/conversation/lib/visualizer-state';
import type { ConversationComponentProps } from '@/features/conversation/types';
import { useStrictModeReady } from '@/features/conversation/hooks/useStrictModeReady';
import { useAgoraVoiceAI } from '@/features/conversation/hooks/useAgoraVoiceAI';
import { useTokenRefresh } from '@/features/conversation/hooks/useTokenRefresh';
import {
  Ambient,
  BrandMark,
  ConnectionIndicator,
  Icons,
  LatencyIndicator,
  Transcript,
  useIsMobile,
  type TranscriptEntry,
} from '@/components/convo-ui';
import { ConversationVoice } from './ConversationVoice';
import { Controls } from './Controls';
import { ADA_AGENT_NAME, mapToViewState, type ViewState } from '@/features/conversation/lib/view-state';

export default function ConversationShell({
  agoraData,
  rtmClient,
  onTokenWillExpire,
  onEndConversation,
}: ConversationComponentProps) {
  const client = useRTCClient();
  const remoteUsers = useRemoteUsers();
  const [isEnabled, setIsEnabled] = useState(true);
  // Voice + language selectors are UI-only in V1 — shown in the dock but not yet wired to /api/invite-agent.
  const [voice, setVoice] = useState('ada');
  // Transcript panel: visible by default on desktop so first-time users see the live turns,
  // but hidden by default on phones (matching Tailwind `md` = 768px) — at that viewport it
  // becomes a full bottom sheet and opening it by default would eat the whole screen before
  // the user has seen the persona. Only the initial value depends on viewport; after mount,
  // the user's manual toggles win (resizing across the breakpoint mid-call doesn't override).
  const isMobile = useIsMobile();
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(!isMobile);

  // Tracks granular RTC connection state for the status dot.
  // Agora states: DISCONNECTED | CONNECTING | CONNECTED | DISCONNECTING | RECONNECTING
  const [connectionState, setConnectionState] = useState<string>('CONNECTING');
  const agentUID =
    process.env.NEXT_PUBLIC_AGENT_UID ?? String(DEFAULT_AGENT_UID);

  const isReady = useStrictModeReady();

  const { isConnected: joinSuccess } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: agoraData.channel,
      token: agoraData.token,
      uid: parseInt(agoraData.uid, 10) || 0,
    },
    isReady,
  );

  // Create mic track only after the StrictMode fake-unmount cycle completes. Passing `true`
  // before that creates two tracks — StrictMode cleanup closes the first, then the second
  // takes over, causing a ~3s audio gap. Do NOT gate on `isEnabled`; that ties track lifetime
  // to mute state. Mute uses track.setEnabled() only.
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isReady);

  // ENABLE_AUDIO_PTS is a module-level SDK parameter (not on the client instance).
  // It must be set before publishing audio for transcript timing to be accurate.
  useEffect(() => {
    if (!client) return;
    try {
      setParameter('ENABLE_AUDIO_PTS', true);
    } catch (error) {
      console.warn('Could not set ENABLE_AUDIO_PTS:', error);
    }
  }, [client]);

  const { rawTranscript, agentState, e2eLatencyMs } = useAgoraVoiceAI({
    client,
    rtmClient,
    channel: agoraData.channel,
    enabled: isReady && joinSuccess,
  });

  // Call duration timer — starts ticking on mount. ConversationShell remounts
  // on reconnect (see parent's `showConversation` gating), so the timer
  // naturally resets per session without a manual key reset.
  const [callSecs, setCallSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCallSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const callMinutes = String(Math.floor(callSecs / 60)).padStart(2, '0');
  const callSeconds = String(callSecs % 60).padStart(2, '0');

  // The toolkit uses uid="0" for local user speech — remap to actual RTC UID
  // so ConvoTextStream renders user messages on the correct side.
  // Also normalize punctuation spacing for display when upstream text arrives compacted.
  const transcript = useMemo(() => {
    return normalizeTranscript(rawTranscript, String(client.uid));
  }, [rawTranscript, client.uid]);

  // Completed (END + INTERRUPTED) messages shown as history. INTERRUPTED must be included —
  // if the agent's first turn is cut off, messageList stays empty and ConvoTextStream never auto-opens.
  const messageList = useMemo(() => getMessageList(transcript), [transcript]);

  // Live caption source — the most recent transcript entry, regardless of
  // status. In practice the Agora toolkit only surfaces turns to us once
  // they complete (status=END) rather than during streaming, so filtering
  // on IN_PROGRESS always produced an empty result. Using "latest turn"
  // gives us "what was most recently said" which matches what the user
  // wants to see in the hero caption: their utterance once captured, and
  // Ada's full response once it arrives.
  //
  // For agent turns the metadata carries per-word timestamps that drive
  // the karaoke-style active-word highlight in ConversationVoice. User
  // turns come from ASR and have `words: null` — fine, the caption falls
  // back to plain text rendering.
  const currentInProgressMessage = useMemo(() => {
    const last = transcript[transcript.length - 1];
    if (!last || typeof last.text !== 'string' || !last.text.trim()) {
      return null;
    }
    const metadataWords = (
      last.metadata as
        | { words?: Array<{ word: string; start_ms: number; duration_ms: number }> | null }
        | undefined
    )?.words;
    const words = Array.isArray(metadataWords) ? metadataWords : null;
    return {
      turn_id: last.turn_id,
      uid: Number(last.uid) || 0,
      text: last.text,
      status: last.status,
      words,
    };
  }, [transcript]);

  // Publish local mic once the track exists; usePublish waits for RTC connection.
  usePublish([localMicrophoneTrack]);

  // Agent presence is a pure derivation from remoteUsers (which useRemoteUsers already keeps
  // in sync with user-joined/user-left under the hood). No separate state or event handlers
  // needed — the useMemo gives the same result with less ceremony.
  const isAgentConnected = useMemo(
    () => remoteUsers.some((user) => user.uid.toString() === agentUID),
    [remoteUsers, agentUID],
  );

  useClientEvent(client, 'connection-state-change', (curState) => {
    setConnectionState(curState);
  });

  const visualizerState = useMemo(
    () =>
      mapAgentVisualizerState(agentState, isAgentConnected, connectionState),
    [agentState, isAgentConnected, connectionState],
  );

  // Collapse RTC transport + agent state + local flags into the 8-state view enum.
  // `agentState` is passed through (not just its derived visualizerState) so we can
  // distinguish "agent in channel but hasn't spoken yet" from "agent is genuinely idle".
  const viewState: ViewState = useMemo(
    () => mapToViewState(visualizerState, agentState, !isEnabled),
    [visualizerState, agentState, isEnabled],
  );

  // Raw MediaStreamTracks for the waveform's real-time FFT tap. Memoized on the upstream
  // Agora track reference so useAudioFFT doesn't rebuild its AnalyserNode on every render
  // (getMediaStreamTrack() can return a fresh object each call).
  const agentRemoteUser = useMemo(
    () => remoteUsers.find((user) => user.uid.toString() === agentUID),
    [remoteUsers, agentUID],
  );
  const agentMediaTrack = useMemo(
    () => agentRemoteUser?.audioTrack?.getMediaStreamTrack() ?? null,
    [agentRemoteUser?.audioTrack],
  );
  const userMediaTrack = useMemo(
    () => localMicrophoneTrack?.getMediaStreamTrack() ?? null,
    [localMicrophoneTrack],
  );

  // Transcript data shape conversion: IMessageListItem (uid-based) → Aria's speaker-label shape.
  // turn_id is scoped per speaker — both user and agent use turn_id 3 for the same exchange,
  // so the key must combine uid + turn_id to stay unique within the list.
  const transcriptEntries: TranscriptEntry[] = useMemo(() => {
    return messageList.map((item) => ({
      key: `${item.uid}-${item.turn_id}`,
      speaker: item.uid.toString() === agentUID ? 'agent' : 'user',
      text: item.text,
    }));
  }, [messageList, agentUID]);

  const activeTranscript = useMemo(() => {
    if (!currentInProgressMessage) {
      return { text: '', speaker: 'agent' as const, words: null };
    }
    return {
      text: currentInProgressMessage.text,
      speaker:
        currentInProgressMessage.uid.toString() === agentUID
          ? ('agent' as const)
          : ('user' as const),
      words: currentInProgressMessage.words,
    };
  }, [currentInProgressMessage, agentUID]);

  // Mute via track.setEnabled() only — usePublish owns publish state. Unpublishing here would
  // fight usePublish and break the MicButtonWithVisualizer Web Audio graph.
  const handleMicToggle = useCallback(async () => {
    const next = !isEnabled;
    const track = localMicrophoneTrack;
    if (!track) {
      setIsEnabled(next);
      return;
    }
    try {
      await track.setEnabled(next);
      setIsEnabled(next);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, [isEnabled, localMicrophoneTrack]);

  useTokenRefresh({ client, rtmClient, onTokenWillExpire });

  // End-call flow: tear down immediately and return to the landing screen. `onEndConversation`
  // is async on the parent side (stop-agent API + RTM logout) but we don't await it — the
  // parent flips `showConversation` to false when teardown finishes, unmounting this tree.
  const handleEnd = useCallback(() => {
    onEndConversation();
  }, [onEndConversation]);

  // Keep the grid at 2 tracks always on desktop so the 2nd track can animate 20rem ↔ 0
  // smoothly. Below `md` the aside is removed from the grid entirely (rendered as a fixed
  // bottom sheet instead), so the stage always gets the full viewport width.
  const stageGridClass = isTranscriptVisible
    ? 'grid-cols-[1fr_20rem] gap-6 max-lg:gap-4 max-md:grid-cols-[1fr] max-md:grid-rows-[1fr] max-md:gap-0'
    : 'grid-cols-[1fr_0px] gap-0 max-md:grid-cols-[1fr] max-md:grid-rows-[1fr]';
  // Collapse Agora's DISCONNECTED | CONNECTING | CONNECTED | DISCONNECTING | RECONNECTING
  // into the ConnectionState enum. DISCONNECTING tracks back to 'connecting' since the
  // user's intent there is still "we're mid-flow" rather than a hard error.
  const connectionStatus =
    connectionState === 'CONNECTED'
      ? 'connected'
      : connectionState === 'RECONNECTING'
        ? 'reconnecting'
        : connectionState === 'DISCONNECTED'
          ? 'error'
          : 'connecting';

  // Transcript card body — shared between the desktop side panel and the mobile bottom sheet
  // so the Transcript component, header, and close affordance stay in one place.
  const transcriptCardBody = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between border-b border-border px-1 pb-3.5">
        <div className="font-display text-xl italic tracking-[-0.01em]">
          Transcript
        </div>
        <div className="flex items-center gap-2.5">
          <div className="font-mono text-xs text-muted-foreground">
            Live · {transcriptEntries.length} turn
            {transcriptEntries.length === 1 ? '' : 's'}
          </div>
          <button
            type="button"
            className="flex size-6 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-muted-foreground transition-colors duration-150 hover:bg-black/5 hover:text-foreground [&>svg]:size-3.5"
            onClick={() => setIsTranscriptVisible(false)}
            aria-label="Hide transcript"
            title="Hide transcript"
          >
            {Icons.close}
          </button>
        </div>
      </div>
      <Transcript
        entries={transcriptEntries}
        activeText=""
        activeSpeaker="agent"
        agentName={ADA_AGENT_NAME}
      />
    </div>
  );

  return (
    <motion.div
      className="relative grid h-screen w-screen grid-rows-[auto_1fr_auto] overflow-hidden"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <Ambient state={viewState} />

      <header className="relative z-20 flex shrink-0 items-center justify-between gap-4 px-6 py-3.5 max-lg:px-4 max-lg:py-3">
        <BrandMark agentName={ADA_AGENT_NAME} />
        {/* Compact status strip — absorbed what used to live in the Persona
            card (call timer) plus net-quality signal (latency) plus the
            existing transport state. Small mono font, muted, dense so it
            reads as instrument-row infrastructure rather than UI chrome. */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span className="tabular-nums" aria-label="Call duration">
            {callMinutes}:{callSeconds}
          </span>
          {e2eLatencyMs !== null && (
            <>
              <span className="text-border max-sm:hidden">·</span>
              <span className="max-sm:hidden">
                <LatencyIndicator ms={e2eLatencyMs} />
              </span>
            </>
          )}
          <span className="text-border">·</span>
          <ConnectionIndicator status={connectionStatus} secondary={false} />
          <span className="text-border">·</span>
          <a
            href="https://github.com/hai-ai-studio/agora-agent-nextjs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-muted-foreground transition-colors duration-150 hover:text-foreground"
            aria-label="View source on GitHub"
            title="View source on GitHub"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.98 10.98 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.41-5.26 5.69.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
            </svg>
          </a>
        </div>
      </header>

      <main
        className={`relative z-10 grid min-h-0 items-stretch px-6 transition-[grid-template-columns,grid-template-rows,gap] duration-300 ease-voice-out max-lg:px-4 ${stageGridClass}`}
      >
        {/* Persona card retired: the orb now conveys state (via color +
            motion), the header strip carries timer / latency / connection,
            and the caption under the orb handles the live speech. Section
            layout centers the orb on desktop and top-aligns on mobile. */}
        <section className="flex min-h-0 flex-col items-center justify-center gap-[clamp(16px,3vh,32px)] overflow-auto px-0 py-2 pb-4 max-md:justify-start max-md:gap-4 max-md:pt-6">
          <ConversationVoice
            state={viewState}
            agentTrack={agentMediaTrack}
            userTrack={userMediaTrack}
            activeSpeech={activeTranscript}
          />

          {/* Hidden RemoteUser mounts keep agent audio subscribed — critical, don't remove. */}
          {remoteUsers.map((user) => (
            <div key={user.uid} style={{ display: 'none' }}>
              <RemoteUser user={user} />
            </div>
          ))}
        </section>

        {/* Desktop side panel (≥md). Hidden entirely on phones — the mobile bottom sheet
            below takes over there. On desktop the track width animates between 20rem and 0;
            the card fades in sync so the transition reads as one motion. */}
        <aside
          aria-hidden={!isTranscriptVisible}
          className={`flex min-h-0 flex-col overflow-hidden transition-opacity duration-300 ease-voice-out max-md:hidden ${
            isTranscriptVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="my-1 mb-3 flex h-full min-h-0 w-80 flex-col rounded-2xl border border-border bg-surface/55 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02),_0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-surface/55">
            {transcriptCardBody}
          </div>
        </aside>
      </main>

      {/* Mobile bottom sheet (<md). A fixed-position overlay with a tappable backdrop and
          a sheet that slides up from the bottom. Rendered only on phones so desktop behavior
          is untouched. The same card body as the desktop aside keeps the header + Transcript
          component consistent across form factors. */}
      <AnimatePresence>
        {isTranscriptVisible && (
          <motion.div
            key="mobile-transcript-sheet"
            className="fixed inset-0 z-30 flex items-end bg-black/40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => {
              // Backdrop-tap closes; taps inside the sheet bubble up but we stop them there.
              if (e.target === e.currentTarget) setIsTranscriptVisible(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Conversation transcript"
          >
            <motion.div
              className="flex h-[75vh] max-h-[35rem] w-full flex-col rounded-t-3xl border border-border bg-surface/95 p-4 pb-6 shadow-[0_-12px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-surface/95"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Grab handle — pure affordance, no drag-to-dismiss. Users close via backdrop
                  tap, the X in the header, or the transcript toggle in the dock. */}
              <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden="true" />
              {transcriptCardBody}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer
        className={`relative z-20 flex shrink-0 justify-center pb-4 pt-3 transition-[padding] duration-300 ease-voice-out max-lg:pb-3.5 max-lg:pt-2 ${
          isTranscriptVisible
            ? 'pl-6 pr-96 max-md:pr-6'
            : 'px-6'
        }`}
      >
        <Controls
          muted={!isEnabled}
          voice={voice}
          onVoiceChange={setVoice}
          onToggleMute={handleMicToggle}
          onEnd={handleEnd}
          localMicrophoneTrack={localMicrophoneTrack}
          transcriptVisible={isTranscriptVisible}
          onToggleTranscript={() => setIsTranscriptVisible((v) => !v)}
        />
      </footer>
    </motion.div>
  );
}
