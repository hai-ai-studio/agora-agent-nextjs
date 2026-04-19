'use client';

import { useCallback } from 'react';
import { useClientEvent, type IAgoraRTCClient } from 'agora-rtc-react';
import type { RTMClient } from 'agora-rtm';
import type { AgoraRenewalTokens } from '@/features/conversation/types';

interface UseTokenRefreshParams {
  client: IAgoraRTCClient | null;
  rtmClient: RTMClient;
  // Supplied by the parent; resolves with fresh RTC + RTM tokens. When absent the refresh is a no-op.
  onTokenWillExpire?: (uid: string) => Promise<AgoraRenewalTokens>;
}

// Subscribes to `token-privilege-will-expire` and renews RTC + RTM tokens in parallel.
// RTC and RTM renew independently but share the same refresh window, so we fetch both
// from one parent callback to stay within Agora's grace-period before the old token dies.
// The RTC UID is read from `client.uid` at invocation time, which is guaranteed to exist
// because the token-will-expire event only fires for joined clients.
export function useTokenRefresh({
  client,
  rtmClient,
  onTokenWillExpire,
}: UseTokenRefreshParams): void {
  const handleTokenWillExpire = useCallback(async () => {
    const uid = client?.uid;
    if (!onTokenWillExpire || uid === null || uid === undefined) return;
    try {
      const { rtcToken, rtmToken } = await onTokenWillExpire(uid.toString());
      await client?.renewToken(rtcToken);
      await rtmClient.renewToken(rtmToken);
    } catch (error) {
      console.error('Failed to renew Agora token:', error);
    }
  }, [client, onTokenWillExpire, rtmClient]);

  useClientEvent(client, 'token-privilege-will-expire', handleTokenWillExpire);
}
