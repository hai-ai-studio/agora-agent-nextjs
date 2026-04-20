'use client';

import { useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Ambient, BrandMark, ErrorToast } from '@/components/convo-ui';
import { useAgoraSession } from '@/features/conversation/hooks/useAgoraSession';
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
          <ErrorToast>
            Failed to connect with AI agent. The conversation may not work as
            expected.
          </ErrorToast>
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

      <header className="relative z-20 flex shrink-0 items-center justify-between px-6 py-3.5 max-lg:px-4 max-lg:py-3">
        <BrandMark agentName={ADA_AGENT_NAME} />
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-center font-display text-[clamp(40px,6vw,64px)] italic font-normal leading-none tracking-[-0.02em] text-foreground">
          Say hi to {ADA_AGENT_NAME}.
        </h1>
        <p className="max-w-md text-center font-ui text-sm text-muted-foreground">
          A voice-first demo of Agora&apos;s Conversational AI Engine. Tap start
          and speak naturally &mdash; the agent listens, thinks, and replies in
          real time.
        </p>

        {showConversation && (!agoraData || !rtmClient) ? (
          <p className="max-w-md text-center font-ui text-sm text-muted-foreground">
            Failed to load conversation data.
          </p>
        ) : (
          <button
            type="button"
            className="mt-1 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-none bg-foreground px-6 font-ui text-sm font-medium tracking-[-0.01em] text-accent-foreground transition-colors duration-150 hover:bg-foreground/90 disabled:cursor-default disabled:opacity-70"
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
                  className="size-3.5 rounded-full border-2 border-white/35 border-t-white"
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
          <p className="font-mono text-xs tracking-[-0.01em] text-state-error">
            {error}
          </p>
        )}
      </main>

      <footer className="relative z-20 flex items-center gap-2 px-6 pb-5 pt-3.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
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
