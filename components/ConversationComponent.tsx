'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { setParameter } from 'agora-rtc-sdk-ng/esm';
import {
  useRTCClient,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  useClientEvent,
  useJoin,
  usePublish,
  RemoteUser,
  UID,
} from 'agora-rtc-react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  AgentState,
  MessageSalStatus,
  TranscriptHelperMode,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from 'agora-agent-client-toolkit';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import {
  getCurrentInProgressMessage,
  getMessageList,
  mapAgentVisualizerState,
  normalizeTimestampMs,
  normalizeTranscript,
} from '@/lib/conversation';
import type { ConversationComponentProps } from '@/types/conversation';

// Shape of an issue captured from the AgoraVoiceAI + raw RTM error streams. The renderable
// panel was retired in the Aria redesign, but the recording path is kept so future surfaces
// (dev overlay, Sentry integration, etc.) can consume the log.
type ConnectionIssue = {
  id: string;
  source: 'rtm' | 'agent' | 'rtm-signaling';
  agentUserId: string;
  code: string | number;
  message: string;
  timestamp: number;
};
import { Ambient } from './aria/Ambient';
import { Persona } from './aria/Persona';
import { Waveform } from './aria/Waveform';
import { Transcript, type TranscriptEntry } from './aria/Transcript';
import { Controls } from './aria/Controls';
import { ARIA_AGENT_NAME, ARIA_HINT, mapToAriaState, type AriaState } from './aria/types';

// Cap the displayed issues list to avoid overwhelming the UI during a cascade of errors.
const MAX_CONNECTION_ISSUES = 6;

const ARIA_STATE_SEQUENCE: AriaState[] = ['idle', 'listening', 'thinking', 'speaking'];

// Payload shape for signaling-level errors forwarded by the agent over RTM.
// The `module` field identifies which backend subsystem (LLM / ASR / TTS) raised the error.
type RtmMessageErrorPayload = {
  object: 'message.error';
  module?: string;
  code?: number;
  message?: string;
  send_ts?: number;
};

// Payload shape for SAL (Session Abstraction Layer) registration status messages.
// VP_REGISTER_FAIL and VP_REGISTER_DUPLICATE indicate RTM channel subscription problems.
type RtmSalStatusPayload = {
  object: 'message.sal_status';
  status?: string;
  timestamp?: number;
};

// Type guard for RTM signaling-level error payloads (object: 'message.error').
function isRtmMessageErrorPayload(
  value: unknown,
): value is RtmMessageErrorPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { object?: unknown }).object === 'message.error'
  );
}

// Type guard for RTM SAL status payloads (object: 'message.sal_status').
function isRtmSalStatusPayload(value: unknown): value is RtmSalStatusPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { object?: unknown }).object === 'message.sal_status'
  );
}

export default function ConversationComponent({
  agoraData,
  rtmClient,
  onTokenWillExpire,
  onEndConversation,
  onStopAgent,
}: ConversationComponentProps) {
  const client = useRTCClient();
  const remoteUsers = useRemoteUsers();
  const [isEnabled, setIsEnabled] = useState(true);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  // Dev-only: override the derived Aria state to walk through visuals without a real call.
  const [ariaStateOverride, setAriaStateOverride] = useState<AriaState | null>(null);
  // Voice + language selectors are UI-only in V1 — shown in the dock but not yet wired to /api/invite-agent.
  const [voice, setVoice] = useState('aria');

  // Tracks granular RTC connection state for the status dot.
  // Agora states: DISCONNECTED | CONNECTING | CONNECTED | DISCONNECTING | RECONNECTING
  const [connectionState, setConnectionState] = useState<string>('CONNECTING');
  const agentUID =
    process.env.NEXT_PUBLIC_AGENT_UID ?? String(DEFAULT_AGENT_UID);
  const [joinedUID, setJoinedUID] = useState<UID>(0);

  // Transcript + agent state — managed with AgoraVoiceAI (see effect below).
  const [rawTranscript, setRawTranscript] = useState<
    TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
  >([]);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  // Issue list is write-only for now (see Aria redesign plan). The state setter stays so the
  // RTM + agent error subscriptions keep their recording path intact; the rendered panel is retired.
  const [, setConnectionIssues] = useState<ConnectionIssue[]>([]);
  const addConnectionIssue = useCallback((issue: ConnectionIssue) => {
    setConnectionIssues((prev) => {
      const isDuplicate = prev.some(
        (x) =>
          x.agentUserId === issue.agentUserId &&
          x.code === issue.code &&
          x.message === issue.message &&
          Math.abs(x.timestamp - issue.timestamp) < 1500,
      );
      if (isDuplicate) return prev;
      return [issue, ...prev].slice(0, MAX_CONNECTION_ISSUES);
    });
  }, []);

  // connectionIssues is still populated (see RTM-error effect below) so future surface
  // areas can consume it, but the in-UI details panel is retired under the Aria design.

  // StrictMode guard: delay `useJoin`'s ready flag until after the fake-unmount
  // cycle completes. React StrictMode fires cleanup synchronously before any
  // setTimeout callback, so the first (fake) mount's timeout is always cancelled.
  // Only the real second mount's timeout fires, meaning useJoin joins exactly once.
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
      setIsReady(false);
    };
  }, []);

  const { isConnected: joinSuccess } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: agoraData.channel,
      token: agoraData.token,
      uid: parseInt(agoraData.uid, 10) || 0,
    },
    isReady,
  );

  // Create mic track only after the StrictMode fake-unmount cycle completes (isReady).
  // Passing `true` here creates two tracks in StrictMode — the first publishes, then
  // StrictMode cleanup closes it and the second takes over, causing a ~3s audio gap.
  // isReady uses the same setTimeout(fn,0) pattern as useJoin: StrictMode cleanup fires
  // synchronously before the timeout, so only the real second mount's timer fires.
  // Do NOT pass `isEnabled` — that ties track lifetime to mute state and breaks the Web Audio
  // graph inside MicButtonWithVisualizer. Mute uses track.setEnabled() only.
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

  // Track the auto-assigned RTC UID for token renewal and agent invite.
  useEffect(() => {
    if (joinSuccess && client) {
      const uid = client.uid;
      if (uid !== null && uid !== undefined) {
        setJoinedUID(uid);
      }
    }
  }, [joinSuccess, client]);

  // Initialize AgoraVoiceAI once the channel is joined.
  //
  // Gating on `isReady && joinSuccess` is critical for StrictMode safety:
  //   - `isReady` ensures we are past the initial fake-unmount cycle, so this
  //     effect only runs on the real mount (not the discarded fake one).
  //   - Once `isReady` is true, React does NOT double-invoke this effect for
  //     subsequent state changes (`joinSuccess` becoming true). That means
  //     AgoraVoiceAI.init() is called exactly once.
  useEffect(() => {
    if (!isReady || !joinSuccess) return;

    let cancelled = false;

    (async () => {
      try {
        const ai = await AgoraVoiceAI.init({
          rtcEngine: client,
          rtmConfig: { rtmEngine: rtmClient },
          renderMode: TranscriptHelperMode.TEXT,
          enableLog: true,
        });

        if (cancelled) {
          try {
            if (AgoraVoiceAI.getInstance() === ai) {
              // Tear down only the instance created by this effect run.
              ai.unsubscribe();
              ai.destroy();
            }
          } catch {}
          return;
        }

        ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (t) => {
          setRawTranscript([...t]);
        });
        // Agent state drives the visualizer, independent of RTC audio presence.
        ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (_, event) =>
          setAgentState(event.state),
        );
        ai.on(AgoraVoiceAIEvents.MESSAGE_ERROR, (agentUserId, error) => {
          addConnectionIssue({
            id: `${Date.now()}-${agentUserId}-message-error-${error.code}`,
            source: 'rtm',
            agentUserId,
            code: error.code,
            message: error.message,
            timestamp: normalizeTimestampMs(error.timestamp),
          });
        });
        // SAL status: capture raw RTM messages so message.sal_status surfaces even if higher-level events don't.
        ai.on(
          AgoraVoiceAIEvents.MESSAGE_SAL_STATUS,
          (agentUserId, salStatus) => {
            if (
              salStatus.status === MessageSalStatus.VP_REGISTER_FAIL ||
              salStatus.status === MessageSalStatus.VP_REGISTER_DUPLICATE
            ) {
              addConnectionIssue({
                id: `${Date.now()}-${agentUserId}-sal-${salStatus.status}`,
                source: 'rtm',
                agentUserId,
                code: salStatus.status,
                message: `SAL status: ${salStatus.status}`,
                timestamp: normalizeTimestampMs(salStatus.timestamp),
              });
            }
          },
        );
        // Agent error: capture raw RTM messages so message.error surfaces even if higher-level events don't.
        ai.on(AgoraVoiceAIEvents.AGENT_ERROR, (agentUserId, error) => {
          addConnectionIssue({
            id: `${Date.now()}-${agentUserId}-agent-error-${error.code}`,
            source: 'agent',
            agentUserId,
            code: error.code,
            message: `${error.type}: ${error.message}`,
            timestamp: normalizeTimestampMs(error.timestamp),
          });
        });
        // subscribeMessage binds the toolkit to both RTC stream messages and RTM payloads.
        ai.subscribeMessage(agoraData.channel);
      } catch (error) {
        if (!cancelled) {
          console.error('[AgoraVoiceAI] init failed:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        const ai = AgoraVoiceAI.getInstance();
        if (ai) {
          ai.unsubscribe();
          ai.destroy();
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, joinSuccess]);

  // Raw RTM parsing is kept as a fallback for signaling-level errors and SAL status.
  useEffect(() => {
    const handleRtmMessage = (event: {
      message: string | Uint8Array;
      publisher: string;
    }) => {
      const payloadText =
        typeof event.message === 'string'
          ? event.message
          : new TextDecoder().decode(event.message);

      let parsed: unknown;
      try {
        parsed = JSON.parse(payloadText);
      } catch {
        return;
      }

      if (isRtmMessageErrorPayload(parsed)) {
        const p = parsed;
        addConnectionIssue({
          id: `${Date.now()}-${event.publisher}-rtm-msg-error-${p.code ?? 'unknown'}`,
          source: 'rtm-signaling',
          agentUserId: event.publisher,
          code: p.code ?? 'unknown',
          message: `${p.module ?? 'unknown'}: ${p.message ?? 'Unknown signaling error'}`,
          timestamp: normalizeTimestampMs(p.send_ts ?? Date.now()),
        });
        return;
      }

      if (isRtmSalStatusPayload(parsed)) {
        const p = parsed;
        if (
          p.status === 'VP_REGISTER_FAIL' ||
          p.status === 'VP_REGISTER_DUPLICATE'
        ) {
          addConnectionIssue({
            id: `${Date.now()}-${event.publisher}-rtm-sal-${p.status}`,
            source: 'rtm-signaling',
            agentUserId: event.publisher,
            code: p.status,
            message: `SAL status: ${p.status}`,
            timestamp: normalizeTimestampMs(p.timestamp ?? Date.now()),
          });
        }
      }
    };

    rtmClient.addEventListener('message', handleRtmMessage);
    return () => {
      rtmClient.removeEventListener('message', handleRtmMessage);
    };
  }, [rtmClient, addConnectionIssue]);

  // The toolkit uses uid="0" for local user speech — remap to actual RTC UID
  // so ConvoTextStream renders user messages on the correct side.
  // Also normalize punctuation spacing for display when upstream text arrives compacted.
  const transcript = useMemo(() => {
    return normalizeTranscript(rawTranscript, String(client.uid));
  }, [rawTranscript, client.uid]);

  // Completed (END + INTERRUPTED) messages shown as history.
  // INTERRUPTED must be included — if the agent's first turn is cut off,
  // messageList stays empty and ConvoTextStream never auto-opens.
  const messageList = useMemo(() => getMessageList(transcript), [transcript]);

  const currentInProgressMessage = useMemo(() => {
    // ConvoTextStream renders the live partial turn separately from the history list.
    return getCurrentInProgressMessage(transcript);
  }, [transcript]);

  // Publish local mic once the track exists; usePublish waits for RTC connection.
  usePublish([localMicrophoneTrack]);

  useClientEvent(client, 'user-joined', (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(true);
  });

  useClientEvent(client, 'user-left', (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(false);
  });

  // Sync isAgentConnected with remoteUsers (covers cases where user-joined/left are missed)
  useEffect(() => {
    const isAgentInRemoteUsers = remoteUsers.some(
      (user) => user.uid.toString() === agentUID,
    );
    setIsAgentConnected(isAgentInRemoteUsers);
  }, [remoteUsers, agentUID]);

  useClientEvent(client, 'connection-state-change', (curState) => {
    setConnectionState(curState);
  });

  const visualizerState = useMemo(
    () =>
      mapAgentVisualizerState(agentState, isAgentConnected, connectionState),
    [agentState, isAgentConnected, connectionState],
  );

  // Collapse RTC transport + agent state + local flags into Aria's seven-state enum.
  // The dev cycle button wins when set; otherwise we read from the real pipeline.
  const ariaState: AriaState = useMemo(() => {
    if (ariaStateOverride) return ariaStateOverride;
    return mapToAriaState(visualizerState, !isEnabled, isEnded);
  }, [ariaStateOverride, visualizerState, isEnabled, isEnded]);

  // Raw MediaStreamTracks for the Aria waveform's real-time FFT tap. Memoized on the
  // upstream Agora track reference so useAudioFFT doesn't rebuild its AnalyserNode
  // on every render (getMediaStreamTrack() can return a fresh object each call).
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

  /**
   * Mute/unmute via track.setEnabled() only — usePublish owns publish state.
   * If we also unpublish in the toggle, usePublish and the button fight each other
   * and break the MicButtonWithVisualizer Web Audio graph.
   */
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

  const handleTokenWillExpire = useCallback(async () => {
    if (!onTokenWillExpire || !joinedUID) return;
    try {
      // RTC and RTM renew independently, but the quickstart fetches both in one request.
      const { rtcToken, rtmToken } = await onTokenWillExpire(
        joinedUID.toString(),
      );
      await client?.renewToken(rtcToken);
      await rtmClient.renewToken(rtmToken);
    } catch (error) {
      console.error('Failed to renew Agora token:', error);
    }
  }, [client, onTokenWillExpire, joinedUID, rtmClient]);

  useClientEvent(client, 'token-privilege-will-expire', handleTokenWillExpire);

  // End-call flow. Two paths:
  //   • If the parent provided `onStopAgent`, we enter the dwell-in `ended` state:
  //     the agent is stopped server-side but the conversation UI stays mounted so
  //     the user sees "Call ended" + "Start new call" (→ handleRestart → full teardown).
  //   • If `onStopAgent` is absent, fall back to a single-shot end that unmounts immediately.
  const handleEnd = useCallback(() => {
    setAriaStateOverride(null);
    setIsEnded(true);
    if (onStopAgent) {
      void onStopAgent();
    } else {
      onEndConversation();
    }
  }, [onStopAgent, onEndConversation]);

  // Dev-only: walk through the four active states without a real call to inspect visuals.
  const handleCycleState = useCallback(() => {
    setAriaStateOverride((prev) => {
      const current = prev ?? 'idle';
      const idx = ARIA_STATE_SEQUENCE.indexOf(current);
      return ARIA_STATE_SEQUENCE[(idx + 1) % ARIA_STATE_SEQUENCE.length];
    });
  }, []);

  const handleRestart = useCallback(() => {
    // "Start new call" from the ended dock → full teardown → parent returns to landing.
    // Unmount/remount handles every piece of local state, so we don't need to reset here.
    onEndConversation();
  }, [onEndConversation]);

  const shellClass = `aria-shell aria-shell-${ariaState}`;
  const connectedLabel = connectionState === 'CONNECTED' ? 'Connected' : 'Connecting';

  return (
    <div className={shellClass}>
      <Ambient state={ariaState} />

      <header className="top-bar">
        <div className="brand">
          <div className="brand-mark">
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
          <span className="brand-name">{ARIA_AGENT_NAME}</span>
        </div>

        <div className="top-meta">
          <span className="top-meta-item">
            <span className="live-dot" />
            {connectedLabel}
          </span>
          <span className="top-meta-item top-meta-quiet">
            End-to-end encrypted
          </span>
        </div>
      </header>

      <main className="stage">
        <section className="stage-center">
          <Persona state={ariaState} />

          <div className="viz">
            <div className="viz-row">
              <div className="viz-label">{ARIA_AGENT_NAME}</div>
              <Waveform
                state={ariaState}
                variant="agent"
                width={640}
                height={140}
                audioTrack={agentMediaTrack}
              />
            </div>
            <div className="viz-divider" />
            <div className="viz-row">
              <div className="viz-label">You</div>
              <Waveform
                state={ariaState}
                variant="user"
                width={640}
                height={140}
                audioTrack={userMediaTrack}
              />
            </div>
          </div>

          <div className="hint">{ARIA_HINT[ariaState]}</div>

          {/* Hidden RemoteUser mounts keep agent audio subscribed — critical, don't remove. */}
          {remoteUsers.map((user) => (
            <div key={user.uid} style={{ display: 'none' }}>
              <RemoteUser user={user} />
            </div>
          ))}
        </section>

        <aside className="side">
          <div className="side-head">
            <div className="side-title">Transcript</div>
            <div className="side-sub">
              Live · {transcriptEntries.length} turn
              {transcriptEntries.length === 1 ? '' : 's'}
            </div>
          </div>
          <Transcript
            entries={transcriptEntries}
            activeText={activeTranscript.text}
            activeSpeaker={activeTranscript.speaker}
            agentName={ARIA_AGENT_NAME}
          />
        </aside>
      </main>

      <footer className="dock">
        <Controls
          state={ariaState}
          muted={!isEnabled}
          voice={voice}
          onVoiceChange={setVoice}
          onToggleMute={handleMicToggle}
          onEnd={handleEnd}
          onRestart={handleRestart}
          onCycle={handleCycleState}
        />
      </footer>
    </div>
  );
}
