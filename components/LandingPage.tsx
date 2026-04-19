'use client';

import { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { RTMClient } from 'agora-rtm';
import type {
  AgoraTokenData,
  ClientStartRequest,
  AgentResponse,
  AgoraRenewalTokens,
} from '../types/conversation';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSkeleton } from './LoadingSkeleton';
import { Ambient } from './aria/Ambient';
import { ARIA_AGENT_NAME } from './aria/types';

// Dynamically import the ConversationComponent with ssr disabled
const ConversationComponent = dynamic(() => import('./ConversationComponent'), {
  ssr: false,
});

// Dynamically import AgoraRTCProvider (browser-only).
// The AgoraVoiceAI toolkit is initialized inside ConversationComponent after
// the RTC join succeeds, so this wrapper only needs to provide the RTC client.
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
  const [showConversation, setShowConversation] = useState(false);

  // Preload heavy modules on mount so they're already cached when the user
  // clicks "Try it now!" — eliminates the ~1.8s dynamic-import delay.
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [agentJoinError, setAgentJoinError] = useState(false);

  const handleStartConversation = async () => {
    setIsLoading(true);
    setError(null);
    setAgentJoinError(false);

    try {
      // 1. Fetch RTC token + channel
      // console.log('Fetching Agora token...');
      const agoraResponse = await fetch('/api/generate-agora-token');
      const responseData = await agoraResponse.json();
      // console.log('Agora token response: uid =', responseData.uid, 'channel =', responseData.channel);

      if (!agoraResponse.ok) {
        throw new Error(
          `Failed to generate Agora token: ${JSON.stringify(responseData)}`,
        );
      }

      // 2. Run agent invite and RTM setup in parallel — both only need the token response.
      //    RTM must be ready before ConversationComponent mounts so AgoraVoiceAI
      //    can subscribe immediately. Agent invite is non-fatal.
      const [agentData, rtm] = await Promise.all([
        // 2a. Start the AI agent
        fetch('/api/invite-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requester_id: responseData.uid,
            channel_name: responseData.channel,
          } as ClientStartRequest),
        })
          .then(async (res) => {
            if (!res.ok) {
              setAgentJoinError(true);
              return null;
            }
            return res.json() as Promise<AgentResponse>;
          })
          .catch((err) => {
            console.error('Failed to start conversation with agent:', err);
            setAgentJoinError(true);
            return null;
          }),

        // 2b. Set up RTM (dynamically imported to keep it client-only)
        (async () => {
          const { default: AgoraRTM } = await import('agora-rtm');
          const rtm: RTMClient = new AgoraRTM.RTM(
            process.env.NEXT_PUBLIC_AGORA_APP_ID!,
            String(Date.now()),
          );
          await rtm.login({ token: responseData.token });
          await rtm.subscribe(responseData.channel);
          // console.log('RTM ready, channel:', responseData.channel);
          return rtm;
        })(),
      ]);

      // 3. All dependencies ready — store state and show conversation
      setRtmClient(rtm);
      setAgoraData({ ...responseData, agentId: agentData?.agent_id });
      setShowConversation(true);
    } catch (err) {
      setError('Failed to start conversation. Please try again.');
      console.error('Error starting conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenWillExpire = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      try {
        const channel = agoraData?.channel;
        if (!channel) {
          throw new Error('Missing channel for token renewal');
        }

        // RTC and RTM tokens are renewed independently:
        //   - RTC uses the browser client's assigned UID (passed in from ConversationComponent).
        //   - RTM uses uid=0 because buildTokenWithRtm embeds RTM capability by AppID+channel,
        //     not by a specific RTM userId — so uid=0 is valid for any RTM client instance.
        // Both are fetched in parallel to stay within the token-expiry grace-period window.
        const [rtcResponse, rtmResponse] = await Promise.all([
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${uid}`),
          fetch(`/api/generate-agora-token?channel=${channel}&uid=0`),
        ]);
        const [rtcData, rtmData] = await Promise.all([
          rtcResponse.json(),
          rtmResponse.json(),
        ]);

        if (!rtcResponse.ok || !rtmResponse.ok) {
          throw new Error('Failed to generate renewal tokens');
        }

        return {
          rtcToken: rtcData.token,
          rtmToken: rtmData.token,
        };
      } catch (error) {
        console.error('Error renewing token:', error);
        throw error;
      }
    },
    [agoraData],
  );

  // Step 1 of end-call: stop the agent server-side. Keeps the conversation UI mounted
  // so the Aria `ended` state can be dwelled-in ("Call ended" pill + "Start new call" CTA).
  // Called from ConversationComponent's end button.
  const handleStopAgent = useCallback(async () => {
    if (!agoraData?.agentId) return;
    try {
      const response = await fetch('/api/stop-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agoraData.agentId }),
      });
      if (!response.ok) {
        console.error('Failed to stop agent:', await response.text());
      }
    } catch (error) {
      console.error('Error stopping agent:', error);
    }
  }, [agoraData?.agentId]);

  // Step 2 of end-call: full teardown — RTM logout + unmount the conversation UI so the user
  // is back on the pre-call landing. Also called for the historical single-step end flow
  // (e.g. if a future consumer skips onStopAgent).
  const handleEndConversation = useCallback(async () => {
    // Safe to call again even if already stopped — /api/stop-conversation is idempotent.
    await handleStopAgent();
    rtmClient?.logout().catch((err) => console.error('RTM logout error:', err));
    setRtmClient(null);
    setShowConversation(false);
  }, [handleStopAgent, rtmClient]);

  // In-call path: ConversationComponent owns its own .aria-shell. We just mount it
  // inside the RTC provider + error boundary. The non-fatal invite warning floats
  // on top as a toast (via .aria-invite-warn) so it doesn't disrupt the shell layout.
  if (showConversation && agoraData && rtmClient) {
    return (
      <>
        {agentJoinError && (
          <div className="aria-invite-warn" role="alert">
            Failed to connect with AI agent. The conversation may not work as
            expected.
          </div>
        )}
        <Suspense fallback={<LoadingSkeleton />}>
          <ErrorBoundary>
            <AgoraProvider>
              <ConversationComponent
                agoraData={agoraData}
                rtmClient={rtmClient}
                onTokenWillExpire={handleTokenWillExpire}
                onEndConversation={handleEndConversation}
                onStopAgent={handleStopAgent}
              />
            </AgoraProvider>
          </ErrorBoundary>
        </Suspense>
      </>
    );
  }

  // Pre-call path: editorial landing in the Aria shell. Drifting ambient blobs, brand
  // mark in the top bar, italic serif headline, minimal ink CTA pill, quiet attribution footer.
  return (
    <div className="aria-shell aria-shell-idle">
      <Ambient state="idle" />

      <header className="top-bar">
        <div className="brand">
          <div className="brand-mark">
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
          <span className="brand-name">{ARIA_AGENT_NAME}</span>
        </div>
      </header>

      <main className="aria-landing-hero">
        <h1 className="aria-landing-headline">
          Say hi to {ARIA_AGENT_NAME}.
        </h1>
        <p className="aria-landing-sub">
          A voice-first demo of Agora&apos;s Conversational AI Engine. Tap start
          and speak naturally &mdash; the agent listens, thinks, and replies in
          real time.
        </p>

        {showConversation && (!agoraData || !rtmClient) ? (
          <p className="aria-landing-sub">Failed to load conversation data.</p>
        ) : (
          <button
            type="button"
            className="aria-landing-cta"
            onClick={handleStartConversation}
            disabled={isLoading}
            aria-label={
              isLoading
                ? `Starting conversation with ${ARIA_AGENT_NAME}`
                : `Start conversation with ${ARIA_AGENT_NAME}`
            }
          >
            {isLoading ? (
              <>
                <span className="aria-landing-cta-spinner" aria-hidden="true" />
                Starting…
              </>
            ) : (
              'Start the call'
            )}
          </button>
        )}

        {error && <p className="aria-landing-error">{error}</p>}
      </main>

      <footer className="aria-landing-foot">
        <span>Powered by</span>
        <a
          href="https://agora.io/en/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Agora's website"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/agora-logo-rgb-blue.svg" alt="Agora" />
        </a>
      </footer>
    </div>
  );
}
