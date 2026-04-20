// Signature
export { VoiceOrb } from './VoiceOrb';
export type { VoiceOrbState, VoiceOrbProps } from './VoiceOrb';

// Ambient
export { Ambient } from './Ambient';
export type { AmbientProps, AmbientState } from './Ambient';

// Persona — agent identity card with rings, hint, pill + timer
export { Persona } from './Persona';
export type { PersonaProps, PersonaState } from './Persona';

// Waveforms
export { BarsWave } from './BarsWave';
export type { BarsWaveProps } from './BarsWave';
export { LinearWave } from './LinearWave';
export type { LinearWaveProps } from './LinearWave';
export { CircleWave } from './CircleWave';
export type { CircleWaveProps } from './CircleWave';

// Status
export { StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps, StatusState } from './StatusIndicator';
export { LatencyIndicator } from './LatencyIndicator';
export type { LatencyIndicatorProps } from './LatencyIndicator';
export { ConnectionStatus } from './ConnectionStatus';
export type { ConnectionStatusProps, ConnectionState } from './ConnectionStatus';
export { ErrorToast } from './ErrorToast';
export type { ErrorToastProps } from './ErrorToast';

// Identity
export { BrandMark } from './BrandMark';
export type { BrandMarkProps } from './BrandMark';

// Controls
export { Icons } from './icons';
export type { IconName } from './icons';
export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonVariant } from './IconButton';
export { CallControls } from './CallControls';
export type { CallControlsProps } from './CallControls';
export { BigCallButton } from './BigCallButton';
export type { BigCallButtonProps, BigCallButtonState } from './BigCallButton';

// Transcript
export { TranscriptBubble } from './TranscriptBubble';
export type { TranscriptBubbleProps, TranscriptRole } from './TranscriptBubble';
export { LiveSubtitle } from './LiveSubtitle';
export type { LiveSubtitleProps } from './LiveSubtitle';
export { Transcript } from './Transcript';
export type {
  TranscriptProps,
  TranscriptEntry,
  TranscriptSpeaker,
} from './Transcript';

// Pickers
export { VoiceCard } from './VoiceCard';
export type { VoiceCardProps } from './VoiceCard';
export { VoicePicker, VOICES } from './VoicePicker';
export type { VoicePickerProps } from './VoicePicker';
export { LanguagePicker, LANGS } from './LanguagePicker';
export type { LanguagePickerProps } from './LanguagePicker';
export { VoiceSelector, DEFAULT_VOICES, DEFAULT_LANGS } from './VoiceSelector';
export type {
  VoiceSelectorProps,
  VoiceSelectorVoice,
  VoiceSelectorLang,
} from './VoiceSelector';
export { BargeInIndicator } from './BargeInIndicator';
export type { BargeInIndicatorProps } from './BargeInIndicator';

// Sessions / Agent / Tools
export { SessionList, SESSIONS } from './SessionList';
export type { SessionListProps, SessionRowProps } from './SessionList';
export { AgentConfigCard } from './AgentConfigCard';
export { ToolCallCard } from './ToolCallCard';
export type { ToolCallCardProps, ToolCallStatus } from './ToolCallCard';

// Permission / Playback
export { MicPermissionCard } from './MicPermissionCard';
export type {
  MicPermissionCardProps,
  MicPermissionState,
} from './MicPermissionCard';
export { AudioPlayer } from './AudioPlayer';
export type { AudioPlayerProps } from './AudioPlayer';

// Hooks
export { useTypewriter } from './hooks/useTypewriter';
