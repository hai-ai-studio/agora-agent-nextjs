'use client';

import { useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useAgoraSession } from '@/features/conversation/hooks/useAgoraSession';
import { Ambient } from './Ambient';
import { ADA_AGENT_NAME } from './aria-state';

// Dynamically import the ConversationShell with ssr disabled.
const ConversationShell = dynamic(() => import('./ConversationShell'), {
  ssr: false,
});

// Dynamically import AgoraRTCProvider (browser-only). The AgoraVoiceAI toolkit is
// initialized inside ConversationShell after the RTC join succeeds, so this wrapper
// only needs to provide the RTC client.
const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } =
      await import('agora-rtc-react');
    return {
      default: function AgoraProviders({
        children,
      }: {
        children: React.ReactNode;
      }) {
        // useRef persists across StrictMode's simulated unmount/remount, so only
        // one RTC client is ever created per session (useMemo creates two in StrictMode).
        const clientRef = useRef<ReturnType<
          typeof AgoraRTC.createClient
        > | null>(null);
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
          });
        }
        return (
          <AgoraRTCProvider client={clientRef.current}>
            {children}
          </AgoraRTCProvider>
        );
      },
    };
  },
  { ssr: false },
);

export default function LandingPage() {
  const {
    showConversation,
    isLoading,
    error,
    agentJoinError,
    agoraData,
    rtmClient,
    startConversation,
    endConversation,
    handleTokenWillExpire,
  } = useAgoraSession();

  // In-call path: ConversationShell owns its own shell. We just mount it inside the RTC
  // provider + error boundary. The non-fatal invite warning floats on top as a toast so it
  // doesn't disrupt the shell layout.
  if (showConversation && agoraData && rtmClient) {
    return (
      <>
        {agentJoinError && (
          <div
            role="alert"
            className="fixed left-1/2 top-16 z-10 max-w-[min(90vw,420px)] -translate-x-1/2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-[14px] py-2.5 text-center text-[13px] text-[#7f1d1d] shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:border-[rgba(239,68,68,0.35)] dark:bg-[rgba(239,68,68,0.12)] dark:text-[#fca5a5] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          >
            Failed to connect with AI agent. The conversation may not work as
            expected.
          </div>
        )}
        <Suspense fallback={<LoadingSkeleton />}>
          <ErrorBoundary>
            <AgoraProvider>
              <ConversationShell
                agoraData={agoraData}
                rtmClient={rtmClient}
                onTokenWillExpire={handleTokenWillExpire}
                onEndConversation={endConversation}
              />
            </AgoraProvider>
          </ErrorBoundary>
        </Suspense>
      </>
    );
  }

  // Pre-call path: editorial landing. Drifting ambient blobs, brand mark in the top bar,
  // italic serif headline, minimal ink CTA pill, quiet attribution footer.
  return (
    <motion.div
      className="relative grid h-screen w-screen grid-rows-[auto_1fr_auto] overflow-hidden"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <Ambient state="idle" />

      <header className="relative z-[2] flex shrink-0 items-center justify-between px-6 py-[14px] max-[960px]:px-4 max-[960px]:py-3">
        <div className="flex items-center gap-2.5 text-ink">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">
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
          <span className="font-serif text-[22px] italic tracking-[-0.01em] max-[360px]:text-[18px]">
            {ADA_AGENT_NAME}
            <span className="text-ink-4"> · </span>
            <span className="text-ink-3">Agora</span>
          </span>
        </div>
      </header>

      <main className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center gap-[18px] p-6">
        <h1 className="text-center font-serif text-[clamp(40px,6vw,64px)] italic font-normal leading-none tracking-[-0.02em] text-ink">
          Say hi to {ADA_AGENT_NAME}.
        </h1>
        <p className="max-w-[420px] text-center font-sans text-[15px] text-ink-3">
          A voice-first demo of Agora&apos;s Conversational AI Engine. Tap start
          and speak naturally &mdash; the agent listens, thinks, and replies in
          real time.
        </p>

        {showConversation && (!agoraData || !rtmClient) ? (
          <p className="max-w-[420px] text-center font-sans text-[15px] text-ink-3">
            Failed to load conversation data.
          </p>
        ) : (
          <button
            type="button"
            className="mt-1 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-none bg-ink px-6 font-sans text-sm font-medium tracking-[-0.01em] text-white transition-colors duration-150 hover:bg-ink-2 disabled:cursor-default disabled:opacity-70"
            onClick={startConversation}
            disabled={isLoading}
            aria-label={
              isLoading
                ? `Starting conversation with ${ADA_AGENT_NAME}`
                : `Start conversation with ${ADA_AGENT_NAME}`
            }
          >
            {isLoading ? (
              <>
                <motion.span
                  className="h-3.5 w-3.5 rounded-full border-2 border-white/35 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  aria-hidden="true"
                />
                Starting…
              </>
            ) : (
              <>
                <MessageCircle
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                Start the call
              </>
            )}
          </button>
        )}

        {error && (
          <p className="font-mono text-[12px] tracking-[-0.01em] text-pill-error">
            {error}
          </p>
        )}
      </main>

      <footer className="relative z-[2] flex items-center gap-2 px-6 pb-5 pt-[14px] font-mono text-[11px] uppercase tracking-[0.08em] text-ink-4">
        <span>Powered by</span>
        <a
          href="https://agora.io/en/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Agora's website"
          className="group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/agora-logo-rgb-blue.svg"
            alt="Agora"
            className="h-[18px] w-auto opacity-65 transition-opacity duration-150 group-hover:opacity-100"
          />
        </a>
      </footer>
    </motion.div>
  );
}
