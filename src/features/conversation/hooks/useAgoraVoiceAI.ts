'use client';

import { useCallback, useEffect, useState } from 'react';
import type { IAgoraRTCClient } from 'agora-rtc-react';
import type { RTMClient } from 'agora-rtm';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  type AgentState,
  type AgentTranscription,
  MessageSalStatus,
  TranscriptHelperMode,
  type TranscriptHelperItem,
  type UserTranscription,
} from 'agora-agent-client-toolkit';
import { normalizeTimestampMs } from '@/features/conversation/lib/transcript';

// Maximum issues kept in the in-memory log. Prevents unbounded growth during an error cascade.
const MAX_CONNECTION_ISSUES = 6;

export type ConnectionIssue = {
  id: string;
  source: 'rtm' | 'agent' | 'rtm-signaling';
  agentUserId: string;
  code: string | number;
  message: string;
  timestamp: number;
};

// Payload shape for signaling-level errors forwarded by the agent over RTM.
type RtmMessageErrorPayload = {
  object: 'message.error';
  module?: string;
  code?: number;
  message?: string;
  send_ts?: number;
};

type RtmSalStatusPayload = {
  object: 'message.sal_status';
  status?: string;
  timestamp?: number;
};

function isRtmMessageErrorPayload(
  value: unknown,
): value is RtmMessageErrorPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { object?: unknown }).object === 'message.error'
  );
}

function isRtmSalStatusPayload(value: unknown): value is RtmSalStatusPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { object?: unknown }).object === 'message.sal_status'
  );
}

export type TranscriptItem = TranscriptHelperItem<
  Partial<UserTranscription | AgentTranscription>
>;

interface UseAgoraVoiceAIParams {
  client: IAgoraRTCClient;
  rtmClient: RTMClient;
  channel: string;
  // Gate on `useStrictModeReady() && joinSuccess`. Once `true`, React does not double-invoke
  // this effect for subsequent state changes, so `AgoraVoiceAI.init()` runs exactly once.
  enabled: boolean;
}

interface UseAgoraVoiceAIResult {
  rawTranscript: TranscriptItem[];
  agentState: AgentState | null;
  /**
   * Most recent end-to-end latency in milliseconds, emitted by the toolkit
   * when a turn finishes. `null` before any turn completes. Refreshes on
   * each subsequent turn.
   */
  e2eLatencyMs: number | null;
}

// Owns the AgoraVoiceAI toolkit lifecycle: init on `enabled`, wire up transcript + agent
// state + error streams, destroy on unmount. Also records RTM signaling errors (the panel
// was retired but the log is kept for future surfaces — dev overlay, Sentry, etc.).
export function useAgoraVoiceAI({
  client,
  rtmClient,
  channel,
  enabled,
}: UseAgoraVoiceAIParams): UseAgoraVoiceAIResult {
  const [rawTranscript, setRawTranscript] = useState<TranscriptItem[]>([]);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [e2eLatencyMs, setE2eLatencyMs] = useState<number | null>(null);
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

  useEffect(() => {
    if (!enabled) return;

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
        // Latency metrics — toolkit fires this per metric per turn. Log
        // everything we see so the name filter can be tuned to the actual
        // event vocabulary. Once confirmed, narrow the filter and drop the
        // log.
        ai.on(AgoraVoiceAIEvents.AGENT_METRICS, (_, metric) => {
          console.log('[DEBUG agent-metric]', {
            type: metric.type,
            name: metric.name,
            value: metric.value,
          });
          const n = metric.name?.toLowerCase() ?? '';
          if (
            n.includes('e2e') ||
            n.includes('end_to_end') ||
            n.includes('end-to-end') ||
            n === 'latency'
          ) {
            setE2eLatencyMs(Math.round(metric.value));
          }
        });
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
        // Bind the toolkit to both RTC stream messages and RTM payloads.
        ai.subscribeMessage(channel);
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
  }, [enabled]);

  // Raw RTM parsing as a fallback path for signaling-level errors and SAL status that the
  // toolkit's higher-level events might miss.
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

  return { rawTranscript, agentState, e2eLatencyMs };
}
