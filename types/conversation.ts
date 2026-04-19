import type { RTMClient } from 'agora-rtm';

export interface AgoraTokenData {
  token: string;
  uid: string;
  channel: string;
  agentId?: string;
}

export interface ClientStartRequest {
  requester_id: string;
  channel_name: string;
}

export interface StopConversationRequest {
  agent_id: string;
}

export interface AgentResponse {
  agent_id: string;
  create_ts: number;
  state: string;
}

export interface AgoraRenewalTokens {
  rtcToken: string;
  rtmToken: string;
}

export interface ConversationComponentProps {
  agoraData: AgoraTokenData;
  rtmClient: RTMClient;
  onTokenWillExpire: (uid: string) => Promise<AgoraRenewalTokens>;
  // Full teardown + return to landing. Called when the user confirms by tapping "Start new call"
  // from the in-call ended state, or when the component wants to unmount.
  onEndConversation: () => void;
  // Optional: stop the agent server-side and log out RTM, but keep the conversation UI mounted.
  // If provided, the Aria end-call button uses this so the ended state is dwelled-in.
  // If not provided, the end-call button falls back to onEndConversation (immediate unmount).
  onStopAgent?: () => Promise<void> | void;
}
