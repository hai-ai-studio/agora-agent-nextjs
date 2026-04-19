import type { AgentVisualizerState } from 'agora-agent-uikit';

// Aria's state enum. Collapses the richer agent lifecycle + local flags into seven
// visual states the Aria surfaces style around.
export type AriaState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted'
  | 'error'
  | 'ended';

// Map the AgoraAgent state + local mute/end-of-call flags to Aria's state enum.
// Priority: explicit `ended` > explicit `muted` > transport/agent issues > active states.
export function mapToAriaState(
  visualizerState: AgentVisualizerState,
  isMuted: boolean,
  isEnded: boolean,
): AriaState {
  if (isEnded) return 'ended';
  if (visualizerState === 'disconnected') return 'error';
  if (isMuted) return 'muted';
  switch (visualizerState) {
    case 'listening':
      return 'listening';
    case 'analyzing':
      return 'thinking';
    case 'talking':
      return 'speaking';
    case 'joining':
    case 'not-joined':
    case 'ambient':
    default:
      return 'idle';
  }
}

// Copy kept in one place so hint line + transcript labels + controls stay consistent.
export const ARIA_AGENT_NAME = 'Aria';

// Hint copy keyed on AriaState. Empty string = no hint (caller should render a fixed-height
// placeholder to avoid layout jumps).
export const ARIA_HINT: Record<AriaState, string> = {
  idle: 'Say something to get started.',
  listening: 'Listening… keep talking.',
  thinking: 'Thinking through that for you.',
  speaking: `${ARIA_AGENT_NAME} is responding.`,
  muted: "Mic is off. Aria can't hear you right now.",
  error: 'Network hiccup — trying to reconnect.',
  ended: 'Thanks for chatting. Press start to call again.',
};
