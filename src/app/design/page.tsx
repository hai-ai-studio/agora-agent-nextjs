'use client';

import { useEffect, useState, type ReactNode, type CSSProperties } from 'react';
import {
  AgentConfigCard,
  AudioPlayer,
  BargeInIndicator,
  BarsWave,
  BigCallButton,
  CallControls,
  CircleWave,
  IconButton,
  Icons,
  LanguagePicker,
  LatencyIndicator,
  LinearWave,
  LiveSubtitle,
  MicPermissionCard,
  SessionList,
  StatusIndicator,
  ToolCallCard,
  TranscriptBubble,
  useTypewriter,
  VoiceOrb,
  VoicePicker,
  type VoiceOrbState,
} from '@/components/convo-ui';

/**
 * /design — Voice Agent Design System catalog.
 *
 * Renders all DS primitives from `src/components/convo-ui/*` in 12 numbered sections.
 * This page is a dev reference; not linked from the landing page. Font is Geist via
 * `font-ui`; existing Aria screens stay on `font-ui` (Inter Tight).
 */

// Section wrapper — numbered breadcrumb + italic serif title + meta count, separated by
// an ink-2 hairline. Kept inside the page file (not exported) since it's used only here.
function Section({
  num,
  title,
  count,
  children,
}: {
  num: string;
  title: string;
  count: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-22">
      <div className="mb-8 flex items-baseline gap-4 border-b border-border pb-4">
        <span className="font-mono text-xs text-muted-foreground">{num}</span>
        <h2 className="m-0 font-display text-[32px] italic leading-none tracking-[-0.01em] text-foreground">
          {title}
        </h2>
        <span className="ml-auto font-mono text-sm text-muted-foreground">{count}</span>
      </div>
      {children}
    </section>
  );
}

// Stage card — labeled cell with a demo stage. `dark` flips the stage background to
// dark-0 so components that invert (LiveSubtitle, orb on dark) can be shown honestly.
function Cell({
  label,
  desc,
  dark,
  stageStyle,
  children,
}: {
  label: string;
  desc?: string;
  dark?: boolean;
  stageStyle?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted p-7">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        {desc && (
          <div className="mt-1 text-xs leading-normal text-muted-foreground">{desc}</div>
        )}
      </div>
      <div
        className={`flex min-h-[11.25rem] items-center justify-center rounded-2xl border border-border p-6 ${
          dark ? 'bg-warm-7 text-foreground' : 'bg-surface'
        }`}
        style={stageStyle}
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================================
 *  Hero — title + animated VoiceOrb cycling through states.
 * ========================================================================= */
function Hero() {
  const [orbState, setOrbState] = useState<VoiceOrbState>('listening');
  useEffect(() => {
    const seq: VoiceOrbState[] = ['idle', 'listening', 'thinking', 'speaking'];
    let i = 0;
    const int = setInterval(() => {
      i = (i + 1) % seq.length;
      setOrbState(seq[i]);
    }, 2600);
    return () => clearInterval(int);
  }, []);

  return (
    <header className="mb-2 grid grid-cols-[1fr_240px] items-center gap-10">
      <div>
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          Agora · Voice Agent Design System · v0.1
        </div>
        <h1 className="m-0 font-display text-[72px] italic font-normal leading-[0.95] tracking-[-0.02em] text-foreground">
          Components for<br />conversations<br />that{' '}
          <span className="italic text-foreground">listen</span>.
        </h1>
        <p className="mt-4 max-w-[32.5rem] text-[15px] leading-[1.55] text-muted-foreground">
          A design system for voice-first AI interfaces. Soft, organic, deeply
          animated. 18 components covering orbs, waveforms, transcripts, controls,
          and agent configuration — all built to breathe.
        </p>
      </div>
      <div className="flex justify-center">
        <VoiceOrb state={orbState} size={220} amplitude={0.6} />
      </div>
    </header>
  );
}

/* =========================================================================
 *  00 — Foundations: voice gradient + ink palette + typography.
 * ========================================================================= */
const INK_SWATCHES = [
  { n: 'paper-0', v: '#FAFAF7' },
  { n: 'paper-1', v: '#F4F3EE' },
  { n: 'paper-2', v: '#EAE8E0' },
  { n: 'paper-3', v: '#D7D4C8' },
  { n: 'paper-4', v: '#A8A49A' },
  { n: 'paper-5', v: '#6B6862' },
  { n: 'paper-6', v: '#2A2A27' },
  { n: 'paper-7', v: '#0A0A09' },
];

const VOICE_SWATCHES = [
  { n: 'voice-a', v: '#7C5CFF', label: 'Violet' },
  { n: 'voice-b', v: '#E85C8A', label: 'Rose' },
  { n: 'voice-c', v: '#F5A55C', label: 'Amber' },
];

function FoundationsSection() {
  return (
    <Section num="00" title="Foundations" count="Color · Type · Motion">
      <div className="grid grid-cols-[1.2fr_1fr] gap-5">
        {/* Voice gradient — the signature */}
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted p-7">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Voice Gradient — Signature
            </div>
            <div className="mt-1 text-xs leading-normal text-muted-foreground">
              Violet → Rose → Amber. Used exclusively for voice states, the orb,
              and active conversation affordances. Never for ambient UI chrome.
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="h-20 rounded-xl bg-gradient-to-br from-voice-a via-voice-b to-voice-c" />
            <div className="grid grid-cols-3 gap-2">
              {VOICE_SWATCHES.map((s) => (
                <div
                  key={s.n}
                  className="rounded-xl border border-border bg-surface p-2.5"
                >
                  <div
                    className="mb-1.5 h-8 rounded-md"
                    style={{ background: s.v }}
                  />
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {s.n}
                  </div>
                  <div className="text-xs font-medium">{s.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Paper — warm neutrals */}
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted p-7">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Paper — Warm Neutrals
            </div>
            <div className="mt-1 text-xs leading-normal text-muted-foreground">
              Paper-like warm grays; never pure black or white.
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {INK_SWATCHES.map((s) => (
              <div key={s.n} className="text-center">
                <div
                  className="aspect-square rounded-lg border border-border"
                  style={{ background: s.v }}
                />
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {s.n}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography — three typefaces */}
        <div className="col-span-2 flex flex-col gap-4 rounded-3xl border border-border bg-muted p-7">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Typography
            </div>
          </div>
          <div className="grid grid-cols-3 gap-5 rounded-xl border border-border bg-surface p-6">
            <div>
              <div className="mb-2 font-mono text-[10px] text-muted-foreground">
                GEIST · UI SANS
              </div>
              <div className="font-ui text-[28px] font-medium tracking-[-0.02em]">
                A conversation
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                300 · 400 · 500 · 600 · 700
              </div>
            </div>
            <div>
              <div className="mb-2 font-mono text-[10px] text-muted-foreground">
                INSTRUMENT SERIF · DISPLAY
              </div>
              <div className="font-display text-[32px] italic text-foreground">
                in real time
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Italic · Display · Accents
              </div>
            </div>
            <div>
              <div className="mb-2 font-mono text-[10px] text-muted-foreground">
                GEIST MONO · CODE
              </div>
              <div className="font-mono text-xl font-medium">
                180ms · en_US
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                400 · 500 — data, specs
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  01 — VoiceOrb catalog: 5 states + dark stage.
 * ========================================================================= */
function OrbsSection() {
  const ORB_DESC: Record<VoiceOrbState, string> = {
    idle: 'Slow gentle breath. Ambient presence.',
    listening: 'Reactive to mic amplitude. Tightens on voice.',
    thinking: 'Rotating internal turbulence while reasoning.',
    speaking: 'Driven by TTS amplitude. Ripples outward.',
    muted: 'Desaturated monochrome. Calm, neutral.',
  };
  const states: VoiceOrbState[] = ['idle', 'listening', 'thinking', 'speaking', 'muted'];
  return (
    <Section num="01" title="Voice Orb" count="Signature · 5 states">
      <div className="grid grid-cols-3 gap-5">
        {states.map((s) => (
          <Cell key={s} label={s} desc={ORB_DESC[s]}>
            <div className="flex flex-col items-center gap-3.5">
              <VoiceOrb state={s} size={140} amplitude={s === 'speaking' ? 0.7 : 0.5} />
              <StatusIndicator state={s} size="sm" />
            </div>
          </Cell>
        ))}
        <Cell label="On dark surface" desc="The orb carries its own glow." dark>
          <VoiceOrb state="speaking" size={140} amplitude={0.6} />
        </Cell>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  02 — Waveforms: bars / linear / circle.
 * ========================================================================= */
function WaveformsSection() {
  return (
    <Section num="02" title="Waveforms" count="3 styles">
      <div className="grid grid-cols-3 gap-5">
        <Cell
          label="Bars"
          desc="Classic. Works at any size. Best for call-button insets."
        >
          <div className="w-full">
            <BarsWave active bars={24} height={60} />
          </div>
        </Cell>
        <Cell
          label="Linear"
          desc="Continuous trace. Evokes an oscilloscope, not a meter."
        >
          <LinearWave active width={240} height={56} />
        </Cell>
        <Cell
          label="Circular"
          desc="Three concentric rings. Paired with orb for depth."
        >
          <CircleWave active size={120} />
        </Cell>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  03 — Status indicators + latency.
 * ========================================================================= */
function StatusSection() {
  const allStates = ['idle', 'listening', 'thinking', 'speaking', 'muted', 'error'] as const;
  return (
    <Section num="03" title="Status & Telemetry" count="Agent state · Connection quality">
      <div className="grid grid-cols-2 gap-5">
        <Cell label="Agent State Pills">
          <div className="flex flex-wrap justify-center gap-2.5">
            {allStates.map((s) => (
              <StatusIndicator key={s} state={s} />
            ))}
          </div>
        </Cell>
        <Cell label="Latency & Quality">
          <div className="flex items-center justify-center gap-8">
            <LatencyIndicator ms={120} />
            <LatencyIndicator ms={340} />
            <LatencyIndicator ms={620} />
          </div>
        </Cell>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  05 — Transcript bubbles + dark-overlay live subtitle.
 * ========================================================================= */
function TranscriptSection() {
  // Loop the agent's streaming reply every few seconds so the caret animation is visible.
  const fullReply =
    "I can help with that. Your next invoice is on the 18th for $42. Want me to switch you to the annual plan?";
  const agentText = useTypewriter(fullReply, 32);
  return (
    <Section num="05" title="Transcript & Subtitles" count="Streaming · Interim">
      <div className="grid grid-cols-2 gap-5">
        <Cell
          label="Message bubbles"
          desc="Asymmetric corners. Agent messages carry the gradient signature."
        >
          <div className="flex w-full flex-col gap-3">
            <TranscriptBubble
              role="user"
              text="What's my next invoice look like?"
              timestamp="3:14 PM"
            />
            <TranscriptBubble
              role="agent"
              text={agentText || '…'}
              timestamp="3:14 PM"
              streaming={agentText.length > 0 && agentText.length < fullReply.length}
            />
            <TranscriptBubble
              role="user"
              text="Yes, switch me to annual."
              timestamp="3:15 PM"
              interim
            />
          </div>
        </Cell>
        <Cell
          label="Live subtitle"
          desc="Overlay style. High contrast, centered, large."
          dark
          stageStyle={{ padding: 36 }}
        >
          <LiveSubtitle
            text="Sure — I'll switch you to the annual plan and apply the 20% discount. Confirming now…"
            speaker="agent"
          />
        </Cell>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  06 — VoicePicker catalog.
 * ========================================================================= */
function VoicePickerSection() {
  return (
    <Section num="06" title="Voice Picker" count="6 personas">
      <div className="grid gap-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted p-7">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Voice library
            </div>
            <div className="mt-1 text-xs leading-normal text-muted-foreground">
              Each persona has a signature color, descriptor tags, and inline preview.
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <VoicePicker />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  11 — LanguagePicker + BargeInIndicator (barge-in inactive + active).
 * ========================================================================= */
function MiscSection() {
  return (
    <Section num="11" title="Language & Interruption" count="Locale · Barge-in">
      <div className="grid grid-cols-2 gap-5">
        <Cell
          label="Language / accent picker"
          desc="8 built-in locales. Descriptor shows regional variant."
        >
          <LanguagePicker />
        </Cell>
        <Cell
          label="Barge-in indicator"
          desc="Shown while agent is speaking. Active state when user interrupts."
        >
          <div className="flex flex-col items-center gap-4">
            <BargeInIndicator active={false} />
            <BargeInIndicator active={true} />
          </div>
        </Cell>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  07 — Session history + agent configuration card.
 * ========================================================================= */
function AgentSection() {
  return (
    <Section num="07" title="Sessions & Agents" count="History · Configuration">
      <div className="grid grid-cols-2 gap-5">
        <Cell
          label="Session list"
          desc="Recent calls. Avatar gradient matches agent voice."
        >
          <div className="w-full rounded-xl border border-border bg-surface p-3">
            <SessionList />
          </div>
        </Cell>
        <Cell
          label="Agent configuration card"
          desc="Agent identity, prompt preview, enabled tools, telemetry snapshot."
        >
          <div className="w-full">
            <AgentConfigCard />
          </div>
        </Cell>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  08 — Tool calls: running / success / error.
 * ========================================================================= */
function ToolCallsSection() {
  return (
    <Section num="08" title="Tool Calls" count="Live · Complete · Error">
      <div className="grid grid-cols-3 gap-5">
        <Cell label="Running">
          <div className="w-full">
            <ToolCallCard
              name="lookup_user"
              status="running"
              args={{ email: 'alex@nimbus.io' }}
            />
          </div>
        </Cell>
        <Cell label="Complete">
          <div className="w-full">
            <ToolCallCard
              name="get_invoice"
              status="success"
              args={{ user_id: 'u_88241', period: '2026-04' }}
              result="$42.00 · due Apr 18"
              duration="240ms"
            />
          </div>
        </Cell>
        <Cell label="Failed">
          <div className="w-full">
            <ToolCallCard
              name="issue_refund"
              status="error"
              args={{ order_id: '8821' }}
              result="Order expired"
            />
          </div>
        </Cell>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  09 — MicPermissionCard (prompt / requesting / denied).
 * ========================================================================= */
function PermissionSection() {
  return (
    <Section num="09" title="Microphone Permission" count="Prompt · Requesting · Denied">
      <div className="grid grid-cols-3 gap-5">
        <Cell label="Prompt">
          <MicPermissionCard state="prompt" />
        </Cell>
        <Cell label="Requesting">
          <MicPermissionCard state="requesting" />
        </Cell>
        <Cell label="Denied">
          <MicPermissionCard state="denied" />
        </Cell>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  10 — AudioPlayer light + dark variants.
 * ========================================================================= */
function PlayerSection() {
  return (
    <Section num="10" title="Audio Playback" count="Call recording player">
      <div className="grid grid-cols-2 gap-5">
        <Cell
          label="Recording playback"
          desc="Scrubbable waveform, variable speed."
        >
          <div className="w-full">
            <AudioPlayer />
          </div>
        </Cell>
        <Cell label="On dark surface" dark>
          <div className="w-full">
            <AudioPlayer title="Yesterday's call" date="Apr 19 · 11:22 AM" />
          </div>
        </Cell>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  12 — Product composition: full voice console (sessions / live call / details).
 *
 *  Uses the same primitives as the rest of the page but composed into a realistic shell:
 *  - Left rail: sessions panel with search + SessionList
 *  - Center stage: dark live-call surface with voice-gradient radial wash, animated
 *    VoiceOrb cycling through thinking/speaking/listening, live streaming subtitle,
 *    BargeInIndicator during listening, CallControls at the bottom
 *  - Right rail: Transcript card (with LanguagePicker) + Tool activity rail
 *
 *  The orb state sequencer advances `setOrbState` on a rolling timer; `speaking` triggers
 *  a fresh typewriter reveal of `fullReply` for the subtitle + streaming bubble.
 * ========================================================================= */
function ProductComposition() {
  const [orbState, setOrbState] = useState<VoiceOrbState>('speaking');
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [streaming, setStreaming] = useState('');

  const fullReply =
    "I found your account — current address is on file as 221B Baker St. What's the new one?";
  const transcript = [
    { role: 'user' as const, text: 'Hey, I need to update my billing address.', time: '3:14 PM' },
    { role: 'agent' as const, text: 'Of course. Let me pull up your account first.', time: '3:14 PM' },
  ];

  useEffect(() => {
    const seq: Array<{ s: VoiceOrbState; d: number }> = [
      { s: 'thinking', d: 1400 },
      { s: 'speaking', d: 4200 },
      { s: 'listening', d: 3200 },
    ];
    let i = 0;
    let typeTimer: ReturnType<typeof setTimeout> | undefined;
    let stepTimer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      const step = seq[i % seq.length];
      setOrbState(step.s);
      if (step.s === 'speaking') {
        let k = 0;
        const type = () => {
          k++;
          setStreaming(fullReply.slice(0, k));
          if (k < fullReply.length) typeTimer = setTimeout(type, 36);
        };
        typeTimer = setTimeout(type, 200);
      } else if (step.s === 'listening') {
        setStreaming('');
      }
      i++;
      stepTimer = setTimeout(run, step.d);
    };
    const start = setTimeout(run, 400);
    return () => {
      clearTimeout(start);
      if (typeTimer) clearTimeout(typeTimer);
      if (stepTimer) clearTimeout(stepTimer);
    };
  }, []);

  return (
    <Section num="12" title="In Context" count="Composition — full voice console">
      <div className="overflow-x-auto rounded-3xl border border-border bg-gradient-to-b from-muted to-surface p-7 shadow-md">
        <div className="grid h-[42.5rem] min-w-[65rem] grid-cols-[minmax(15rem,17.5rem)_minmax(26.25rem,1fr)_minmax(17.5rem,20rem)] gap-5">
          {/* LEFT — sessions rail */}
          <div className="flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold">Sessions</div>
              <button
                type="button"
                aria-label="New session"
                className="flex size-[26px] cursor-pointer items-center justify-center rounded-lg border-0 bg-muted"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path
                    d="M6 2v8M2 6h8"
                    stroke="var(--warm-6)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="relative">
              <input
                placeholder="Search…"
                className="w-full rounded-lg border-0 bg-muted px-2.5 py-1.5 pl-7 font-ui text-xs outline-none"
              />
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50"
              >
                <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <path d="m8 8 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="-mx-2 flex-1 overflow-y-auto px-2">
              <SessionList />
            </div>
          </div>

          {/* CENTER — live call stage */}
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
                  Billing — Aria
                </div>
              </div>
              <LatencyIndicator ms={180} />
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
              <VoiceOrb state={orbState} size={200} amplitude={0.6} />
              <StatusIndicator state={orbState} />
              {orbState === 'speaking' && streaming && (
                <div className="max-w-[26.25rem] px-5 text-center text-[17px] font-normal leading-[1.4] tracking-[-0.01em] text-foreground [text-wrap:balance]">
                  {streaming}
                  <span
                    aria-hidden="true"
                    className="ml-[3px] inline-block h-4 w-0.5 bg-voice-b align-text-bottom animate-caret-blink"
                  />
                </div>
              )}
              {orbState === 'listening' && <BargeInIndicator active={false} />}
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
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-3.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold">Transcript</div>
                <LanguagePicker />
              </div>
              <div className="flex max-h-[17.5rem] flex-col gap-2 overflow-y-auto pr-1">
                {transcript.map((m, i) => (
                  <TranscriptBubble key={i} role={m.role} text={m.text} timestamp={m.time} />
                ))}
                {orbState === 'speaking' && streaming && (
                  <TranscriptBubble role="agent" text={streaming} streaming />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
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
          </div>
        </div>
      </div>
    </Section>
  );
}

/* =========================================================================
 *  04 — Call Controls: big button + in-call bar + icon grid.
 * ========================================================================= */
function ControlsSection() {
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  return (
    <Section num="04" title="Call Controls" count="Start · Mute · End">
      <div className="grid grid-cols-3 gap-5">
        <Cell
          label="Primary call button"
          desc="States: idle · ringing · active."
        >
          <div className="flex items-center gap-5">
            <BigCallButton state="idle" />
            <BigCallButton state="ringing" />
            <BigCallButton state="active" />
          </div>
        </Cell>
        <Cell
          label="In-call bar"
          desc="Floating glass-morph bar. Use fixed-bottom."
        >
          <CallControls
            muted={muted}
            setMuted={setMuted}
            paused={paused}
            setPaused={setPaused}
          />
        </Cell>
        <Cell label="Icon buttons">
          <div className="grid grid-cols-4 justify-center gap-2.5">
            <IconButton icon={Icons.mic} label="Mic" />
            <IconButton icon={Icons.micOff} label="Mic off" active />
            <IconButton icon={Icons.speaker} label="Speaker" />
            <IconButton icon={Icons.video} label="Video" />
            <IconButton icon={Icons.phone} label="Call" variant="voice" />
            <IconButton icon={Icons.hangup} label="End" variant="danger" />
            <IconButton icon={Icons.settings} label="Settings" />
            <IconButton icon={Icons.more} label="More" variant="ghost" />
          </div>
        </Cell>
      </div>
    </Section>
  );
}

/* ========================================================================= */

export default function DesignPage() {
  return (
    <div className="mx-auto max-w-7xl bg-background px-10 pb-30 pt-12 font-ui text-foreground">
      <Hero />
      <FoundationsSection />
      <OrbsSection />

      <WaveformsSection />

      <StatusSection />

      <ControlsSection />

      <TranscriptSection />

      <VoicePickerSection />

      <AgentSection />
      <ToolCallsSection />
      <PermissionSection />
      <PlayerSection />

      <MiscSection />

      <ProductComposition />

      <footer className="mt-30 flex items-center justify-between border-t border-border pt-10 text-xs text-muted-foreground">
        <div className="font-mono">
          AGORA · Voice Agent Design System · v0.1
        </div>
        <div className="font-display text-base italic">
          Components for conversations that listen.
        </div>
      </footer>
    </div>
  );
}
