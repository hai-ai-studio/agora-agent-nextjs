import type { AgentState } from 'agora-agent-client-toolkit';
import type { AgentVisualizerState } from 'agora-agent-uikit';

// Maps the combined (agentState + RTC connection + agent presence) signal to the
// AgentVisualizer's display states. RTC transport problems take priority over
// agent-level state to avoid showing "listening" or "talking" during a reconnect.
export function mapAgentVisualizerState(
  agentState: AgentState | null,
  isAgentConnected: boolean,
  connectionState: string,
): AgentVisualizerState {
  if (
    connectionState === 'DISCONNECTED' ||
    connectionState === 'DISCONNECTING'
  ) {
    return 'disconnected';
  }

  if (
    connectionState === 'CONNECTING' ||
    connectionState === 'RECONNECTING'
  ) {
    return 'joining';
  }

  if (!isAgentConnected) {
    return 'not-joined';
  }

  switch (agentState) {
    case 'listening':
      return 'listening';
    case 'thinking':
      return 'analyzing';
    case 'speaking':
      return 'talking';
    case 'idle':
    case 'silent':
    default:
      return 'ambient';
  }
}
