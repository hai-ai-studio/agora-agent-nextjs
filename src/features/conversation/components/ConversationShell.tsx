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
  getCurrentInProgressMessage,
  getMessageList,
  normalizeTranscript,
} from '@/features/conversation/lib/transcript';
import { mapAgentVisualizerState } from '@/features/conversation/lib/visualizer-state';
import type { ConversationComponentProps } from '@/features/conversation/types';
import { useStrictModeReady } from '@/features/conversation/hooks/useStrictModeReady';
import { useAgoraVoiceAI } from '@/features/conversation/hooks/useAgoraVoiceAI';
import { useTokenRefresh } from '@/features/conversation/hooks/useTokenRefresh';
import { Ambient } from './Ambient';
import { Persona } from './Persona';
import { Waveform } from './Waveform';
import { Transcript, type TranscriptEntry } from './Transcript';
import { Controls } from './Controls';
import { ADA_AGENT_NAME, ARIA_HINT, mapToAriaState, type AriaState } from './aria-state';

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
  // Transcript panel: visible by default on desktop so first-time users see the live turns, but
  // hidden by default on phones (matching Tailwind `md` = 768px) — at that viewport it becomes
  // a full bottom sheet and opening it by default would eat the whole screen before the user
  // has seen the persona. Safe to read `window` in the initializer: this component is
  // dynamic-imported with ssr:false.
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(max-width: 767px)').matches;
  });

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

  const { rawTranscript, agentState } = useAgoraVoiceAI({
    client,
    rtmClient,
    channel: agoraData.channel,
    enabled: isReady && joinSuccess,
  });

  // The toolkit uses uid="0" for local user speech — remap to actual RTC UID
  // so ConvoTextStream renders user messages on the correct side.
  // Also normalize punctuation spacing for display when upstream text arrives compacted.
  const transcript = useMemo(() => {
    return normalizeTranscript(rawTranscript, String(client.uid));
  }, [rawTranscript, client.uid]);

  // Completed (END + INTERRUPTED) messages shown as history. INTERRUPTED must be included —
  // if the agent's first turn is cut off, messageList stays empty and ConvoTextStream never auto-opens.
  const messageList = useMemo(() => getMessageList(transcript), [transcript]);

  // ConvoTextStream renders the live partial turn separately from the history list.
  const currentInProgressMessage = useMemo(
    () => getCurrentInProgressMessage(transcript),
    [transcript],
  );

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

  // Collapse RTC transport + agent state + local flags into Aria's state enum. `agentState`
  // is passed through (not just its derived visualizerState) so we can distinguish "agent in
  // channel but hasn't spoken yet" from "agent is genuinely idle".
  const ariaState: AriaState = useMemo(
    () => mapToAriaState(visualizerState, agentState, !isEnabled),
    [visualizerState, agentState, isEnabled],
  );

  // Raw MediaStreamTracks for the Aria waveform's real-time FFT tap. Memoized on the upstream
  // Agora track reference so useAudioFFT doesn't rebuild its AnalyserNode on every render
  // (getMediaStreamTrack() can return a fresh object each call).
  const agentRemoteUser = remoteUsers.find(
    (user) => user.uid.toString() === agentUID,
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
      return { text: '', speaker: 'agent' as const };
    }
    return {
      text: currentInProgressMessage.text,
      speaker:
        currentInProgressMessage.uid.toString() === agentUID
          ? ('agent' as const)
          : ('user' as const),
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
  const connectedLabel = connectionState === 'CONNECTED' ? 'Connected' : 'Connecting';

  // Transcript card body — shared between the desktop side panel and the mobile bottom sheet
  // so the Transcript component, header, and close affordance stay in one place.
  const transcriptCardBody = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between border-b border-line px-1 pb-3.5">
        <div className="font-serif text-xl italic tracking-[-0.01em]">
          Transcript
        </div>
        <div className="flex items-center gap-2.5">
          <div className="font-mono text-xs text-ink-3">
            Live · {transcriptEntries.length} turn
            {transcriptEntries.length === 1 ? '' : 's'}
          </div>
          <button
            type="button"
            className="flex size-6 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-ink-3 transition-colors duration-150 hover:bg-black/5 hover:text-ink"
            onClick={() => setIsTranscriptVisible(false)}
            aria-label="Hide transcript"
            title="Hide transcript"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <Transcript
        entries={transcriptEntries}
        activeText={activeTranscript.text}
        activeSpeaker={activeTranscript.speaker}
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
      <Ambient state={ariaState} />

      <header className="relative z-20 flex shrink-0 items-center justify-between px-6 py-3.5 max-lg:px-4 max-lg:py-3">
        <div className="flex items-center gap-2.5 text-ink">
          <div className="flex size-8 items-center justify-center rounded-full bg-ink text-white">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="7" opacity="0.5" />
              <circle cx="12" cy="12" r="11" opacity="0.2" />
            </svg>
          </div>
          <span className="font-serif text-2xl italic tracking-[-0.01em] max-[360px]:text-lg">
            {ADA_AGENT_NAME}
            <span className="text-ink-4"> · </span>
            <span className="text-ink-3">Agora</span>
          </span>
        </div>

        <div className="flex gap-5 font-mono text-xs tracking-[-0.01em] text-ink-3">
          <span className="inline-flex items-center gap-2">
            <motion.span
              className="size-2 rounded-full bg-[#16a34a] shadow-[0_0_0_3px_rgba(22,163,74,0.15)]"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {connectedLabel}
          </span>
          <span className="inline-flex items-center gap-2 text-ink-4 max-md:hidden">
            End-to-end encrypted
          </span>
        </div>
      </header>

      <main
        className={`relative z-10 grid min-h-0 items-stretch px-6 transition-[grid-template-columns,grid-template-rows,gap] duration-300 ease-aria-out max-lg:px-4 ${stageGridClass}`}
      >
        <section className="flex min-h-0 flex-col items-center justify-center gap-[clamp(16px,3vh,32px)] overflow-auto px-0 py-2 pb-4">
          <Persona state={ariaState} hint={ARIA_HINT[ariaState]} />

          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-line bg-white/40 px-6 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.02),_0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 max-lg:px-5 max-lg:py-3 max-sm:rounded-2xl max-sm:px-4 max-sm:py-2.5 2xl:max-w-4xl">
            <div className="flex items-center gap-4">
              <div className="w-11 shrink-0 font-serif text-base italic text-ink-3">
                {ADA_AGENT_NAME}
              </div>
              <Waveform
                state={ariaState}
                variant="agent"
                height={140}
                audioTrack={agentMediaTrack}
              />
            </div>
            <div className="my-2 h-px bg-line max-sm:my-1" />
            <div className="flex items-center gap-4">
              <div className="w-11 shrink-0 font-serif text-base italic text-ink-3">
                You
              </div>
              <Waveform
                state={ariaState}
                variant="user"
                height={140}
                audioTrack={userMediaTrack}
              />
            </div>
          </div>

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
          className={`flex min-h-0 flex-col overflow-hidden transition-opacity duration-300 ease-aria-out max-md:hidden ${
            isTranscriptVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="my-1 mb-3 flex h-full min-h-0 w-80 flex-col rounded-2xl border border-line bg-white/55 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02),_0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/55">
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
              className="flex h-[75vh] max-h-[35rem] w-full flex-col rounded-t-3xl border border-line bg-white/95 p-4 pb-6 shadow-[0_-12px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/95"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Grab handle — pure affordance, no drag-to-dismiss. Users close via backdrop
                  tap, the X in the header, or the transcript toggle in the dock. */}
              <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-line-2" aria-hidden="true" />
              {transcriptCardBody}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer
        className={`relative z-20 flex shrink-0 justify-center pb-4 pt-3 transition-[padding] duration-300 ease-aria-out max-lg:pb-3.5 max-lg:pt-2 ${
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
