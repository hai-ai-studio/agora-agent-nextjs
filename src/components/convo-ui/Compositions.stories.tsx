'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Ambient } from './Ambient';
import { BrandMark } from './BrandMark';
import { BargeInIndicator } from './BargeInIndicator';
import { CallControls } from './CallControls';
import { ConnectionStatus } from './ConnectionStatus';
import { LanguagePicker } from './LanguagePicker';
import { LatencyIndicator } from './LatencyIndicator';
import { Persona, type PersonaState } from './Persona';
import { SessionList } from './SessionList';
import { StatusIndicator } from './StatusIndicator';
import { ToolCallCard } from './ToolCallCard';
import { TranscriptBubble } from './TranscriptBubble';
import { VoiceOrb, type VoiceOrbState } from './VoiceOrb';
import { useTypewriter } from './hooks/useTypewriter';

/**
 * Compositions — realistic product surfaces built from convo-ui primitives.
 *
 * Mirrors the curated poster tour on `/design` (section 12 "In Context"), but lives in
 * Storybook so the compositions are browsable alongside the isolated components. All
 * state cycles inside the story; no Agora bindings.
 */
const meta: Meta = {
  title: 'Compositions',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'End-to-end surfaces assembled from the library — Landing screen, in-call Stage, and the full three-pane Console. Every story drives its own mock state cycle so the composed motion reads as it would in production.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/* ============================================================================
 *  Shared cycler hook
 * ========================================================================== */

function useVoiceStateCycle(
  seq: Array<{ s: VoiceOrbState; d: number }> = [
    { s: 'thinking', d: 1400 },
    { s: 'speaking', d: 4200 },
    { s: 'listening', d: 3200 },
  ],
) {
  const [state, setState] = useState<VoiceOrbState>(seq[0].s);
  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      const step = seq[i % seq.length];
      setState(step.s);
      i += 1;
      timer = setTimeout(run, step.d);
    };
    const start = setTimeout(run, 400);
    return () => {
      clearTimeout(start);
      if (timer) clearTimeout(timer);
    };
    // seq is a literal; cycle only runs once per story mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

/* ============================================================================
 *  Landing — editorial pre-call screen
 * ========================================================================== */

export const Landing: Story = {
  name: 'Landing',
  render: () => (
    <motion.div
      className="relative grid h-[42rem] w-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <Ambient state="idle" />
      <header className="relative z-20 flex items-center justify-between px-6 py-3.5">
        <BrandMark agentName="Ada" />
      </header>
      <main className="relative z-10 flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-center font-display text-[clamp(40px,6vw,64px)] italic leading-none tracking-[-0.02em] text-foreground">
          Say hi to Ada.
        </h1>
        <p className="max-w-md text-center font-ui text-sm text-muted-foreground">
          A voice-first demo of Agora&apos;s Conversational AI Engine. Tap start and
          speak naturally — the agent listens, thinks, and replies in real time.
        </p>
        <button
          type="button"
          className="mt-1 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-none bg-foreground px-6 font-ui text-sm font-medium text-background transition-colors duration-150 hover:bg-foreground/90"
        >
          <MessageCircle size={16} strokeWidth={1.8} aria-hidden="true" />
          Start the call
        </button>
      </main>
      <footer className="relative z-20 flex items-center gap-2 px-6 pb-5 pt-3.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>Powered by Agora</span>
      </footer>
    </motion.div>
  ),
};

/* ============================================================================
 *  In-call stage — dark center surface
 * ========================================================================== */

const STAGE_REPLY =
  "I found your account — current address is on file as 221B Baker St. What's the new one?";

function InCallStageRender() {
  const state = useVoiceStateCycle();
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const streaming = useTypewriter(
    state === 'speaking' ? STAGE_REPLY : '',
    32,
  );

  // PersonaState is a superset of VoiceOrbState at the names we cycle through, so this
  // cast is safe — the cycler only emits listening/thinking/speaking.
  const personaState = state as PersonaState;

  return (
    // InCallStage uses theme-aware semantic tokens — the gradient flips with the root
    // `.dark` class. In Light mode: warm paper → pure light. In Dark: near-black →
    // slightly warmer. No local `.dark` wrapper: the whole composition follows the
    // toolbar theme choice.
    <div className="relative flex h-[40rem] w-full flex-col overflow-hidden bg-gradient-to-b from-muted to-background p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,92,255,0.18),transparent_55%)]"
      />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
            Live call · 02:14
          </div>
          <div className="mt-1 text-[15px] font-medium text-foreground">
            Billing — Ada
          </div>
        </div>
        <LatencyIndicator ms={180} />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5">
        <Persona
          state={personaState}
          name="Ada"
          hint={
            personaState === 'listening'
              ? 'Listening… keep talking.'
              : personaState === 'thinking'
                ? 'Thinking through that for you.'
                : 'Ada is responding.'
          }
        />
        <VoiceOrb state={state} size={200} amplitude={0.6} />
        <StatusIndicator state={state} />
        {state === 'speaking' && streaming && (
          <div className="max-w-[26.25rem] px-5 text-center text-[17px] leading-[1.4] tracking-[-0.01em] text-foreground [text-wrap:balance]">
            {streaming}
            <span
              aria-hidden="true"
              className="ml-[3px] inline-block h-4 w-0.5 bg-voice-b align-text-bottom animate-caret-blink"
            />
          </div>
        )}
        {state === 'listening' && <BargeInIndicator active={false} />}
      </div>

      <div className="relative z-10 flex justify-center">
        <CallControls
          muted={muted}
          setMuted={setMuted}
          paused={paused}
          setPaused={setPaused}
        />
      </div>
    </div>
  );
}

export const InCallStage: Story = {
  name: 'In-call stage',
  render: () => <InCallStageRender />,
};

/* ============================================================================
 *  Full console — three-pane layout
 * ========================================================================== */

const TRANSCRIPT_HISTORY = [
  { role: 'user' as const, text: 'Hey, I need to update my billing address.', time: '3:14 PM' },
  { role: 'agent' as const, text: 'Of course. Let me pull up your account first.', time: '3:14 PM' },
];

function FullConsoleRender() {
  const state = useVoiceStateCycle();
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const streaming = useTypewriter(
    state === 'speaking' ? STAGE_REPLY : '',
    32,
  );
  const personaState = state as PersonaState;

  return (
    // Outer uses the theme-aware `bg-background` / `text-foreground` pair so the whole console flips
    // with the Storybook theme toggle. The center pane (below) pins itself to dark via
    // a nested `.dark` so the live-call stage is always legible regardless of theme.
    <div className="mx-auto w-full max-w-7xl bg-background px-10 py-10 font-ui text-foreground">
      <div className="mb-4 flex items-center justify-between">
        <BrandMark agentName="Ada" />
        <ConnectionStatus status="connected" />
      </div>
      <div className="rounded-3xl border border-border bg-muted p-7 shadow-md">
        <div className="grid h-[40rem] grid-cols-[minmax(15rem,17.5rem)_minmax(26.25rem,1fr)_minmax(17.5rem,20rem)] gap-5">
          {/* LEFT — sessions rail */}
          <div className="flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface dark:border-border dark:bg-surface/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold">Sessions</div>
              <button
                type="button"
                aria-label="New session"
                className="flex size-[26px] cursor-pointer items-center justify-center rounded-lg border-0 bg-muted"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M6 2v8M2 6h8" stroke="var(--warm-6)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="-mx-2 flex-1 overflow-y-auto px-2">
              <SessionList />
            </div>
          </div>

          {/* CENTER — live-call stage. Theme-aware gradient matches the outer shell. */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-muted to-background p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,92,255,0.15),transparent_50%)]"
            />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                  Live call · 02:14
                </div>
                <div className="mt-1 text-[15px] font-medium text-foreground">
                  Billing — Ada
                </div>
              </div>
              <LatencyIndicator ms={180} />
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
              <VoiceOrb state={state} size={180} amplitude={0.6} />
              <StatusIndicator state={state} />
              {state === 'speaking' && streaming && (
                <div className="max-w-[26rem] px-5 text-center text-[17px] leading-[1.4] tracking-[-0.01em] text-foreground [text-wrap:balance]">
                  {streaming}
                  <span
                    aria-hidden="true"
                    className="ml-[3px] inline-block h-4 w-0.5 bg-voice-b align-text-bottom animate-caret-blink"
                  />
                </div>
              )}
              {state === 'listening' && <BargeInIndicator active={false} />}
            </div>

            <div className="relative z-10 flex justify-center">
              <CallControls
                muted={muted}
                setMuted={setMuted}
                paused={paused}
                setPaused={setPaused}
              />
            </div>
          </div>

          {/* RIGHT — transcript + tool activity */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface dark:border-border dark:bg-surface/5 p-3.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold">Transcript</div>
                <LanguagePicker />
              </div>
              <div className="flex max-h-[17.5rem] flex-col gap-2 overflow-y-auto pr-1">
                {TRANSCRIPT_HISTORY.map((m, i) => (
                  <TranscriptBubble key={i} role={m.role} text={m.text} timestamp={m.time} />
                ))}
                {state === 'speaking' && streaming && (
                  <TranscriptBubble role="agent" text={streaming} streaming />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface dark:border-border dark:bg-surface/5 p-3">
              <div className="mb-0.5 text-xs font-semibold">Tool activity</div>
              <ToolCallCard
                name="lookup_user"
                status="success"
                args={{ email: 'alex@nimbus.io' }}
                result="u_88241 · Pro plan"
                duration="180ms"
              />
              <ToolCallCard
                name="get_address"
                status="success"
                args={{ user_id: 'u_88241' }}
                result="221B Baker St"
                duration="64ms"
              />
            </div>
            {/* Persona card surfaces below the rails so the composition highlights it in
                a realistic slot without crowding the dark stage. */}
            <Persona state={personaState} name="Ada" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const FullConsole: Story = {
  name: 'Full voice console',
  render: () => <FullConsoleRender />,
};
