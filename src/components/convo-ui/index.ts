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
export { spreadBandsToBarValues } from './spread-bands';
export type { SpreadBandsOptions } from './spread-bands';
export { LinearWave } from './LinearWave';
export type { LinearWaveProps } from './LinearWave';
export { CircleWave } from './CircleWave';
export type { CircleWaveProps } from './CircleWave';

// Status
export { StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps, StatusState } from './StatusIndicator';
export { LatencyIndicator } from './LatencyIndicator';
export type { LatencyIndicatorProps } from './LatencyIndicator';
export { ConnectionIndicator } from './ConnectionIndicator';
export type { ConnectionIndicatorProps, ConnectionState } from './ConnectionIndicator';
export { ErrorToast } from './ErrorToast';
export type { ErrorToastProps } from './ErrorToast';

// Identity
export { BrandMark } from './BrandMark';
export type { BrandMarkProps } from './BrandMark';

// Controls
export { Icons } from './Icons';
export type { IconName } from './Icons';
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
export { VoiceGallery, VOICES } from './VoiceGallery';
export type { VoiceGalleryProps } from './VoiceGallery';
export { LanguagePicker, LANGS } from './LanguagePicker';
export type { LanguagePickerProps } from './LanguagePicker';
export { VoiceLangMenu, DEFAULT_VOICES, DEFAULT_LANGS } from './VoiceLangMenu';
export type {
  VoiceLangMenuProps,
  VoiceLangMenuVoice,
  VoiceLangMenuLang,
} from './VoiceLangMenu';
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
export { useMenuKeyboardNav } from './hooks/useMenuKeyboardNav';
export { useTypewriterCycle } from './hooks/useTypewriterCycle';
export type { UseTypewriterCycleOptions } from './hooks/useTypewriterCycle';
