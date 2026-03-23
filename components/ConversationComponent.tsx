'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { setParameter } from 'agora-rtc-sdk-ng/esm';
import {
  useRTCClient,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  useClientEvent,
  useIsConnected,
  useJoin,
  usePublish,
  RemoteUser,
  UID,
} from 'agora-rtc-react';
import { useConversationalAI } from 'agora-agent-client-toolkit-react';
import {
  TranscriptHelperMode,
  TurnStatus,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from 'agora-agent-client-toolkit';
import {
  AudioVisualizer,
  ConvoTextStream,
  transcriptToMessageList,
} from 'agora-agent-uikit';
import { MicButtonWithVisualizer } from 'agora-agent-uikit/rtc';
import { MicrophoneSelector } from './MicrophoneSelector';
import type { ConversationComponentProps, ClientStartRequest } from '@/types/conversation';

type ToolkitMessage = TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>;

export default function ConversationComponent({
  agoraData,
  rtmClient,
  onTokenWillExpire,
  onEndConversation,
}: ConversationComponentProps) {
  const client = useRTCClient();
  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();
  const [isEnabled, setIsEnabled] = useState(true);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const agentUID = process.env.NEXT_PUBLIC_AGENT_UID;
  const [activeAgentId, setActiveAgentId] = useState<string | undefined>(agoraData.agentId);
  const [joinedUID, setJoinedUID] = useState<UID>(0);

  const { isConnected: joinSuccess } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: agoraData.channel,
      token: agoraData.token,
      uid: parseInt(agoraData.uid, 10) || 0,
    },
    true
  );

  // Create mic track immediately on mount so getUserMedia resolves before (or during) the join.
  // Do NOT pass `isEnabled` — that ties track lifetime to mute state and breaks the Web Audio
  // graph inside MicButtonWithVisualizer. Mute uses track.setEnabled() only.
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(true);

  useEffect(() => {
    if (!agentUID) {
      console.warn('NEXT_AGENT_UID environment variable is not set');
    } else {
      console.log('Agent UID is set to:', agentUID);
    }
  }, [agentUID]);

  // ENABLE_AUDIO_PTS is a module-level SDK parameter (not on the client instance).
  // It must be set before publishing audio for transcript timing to be accurate.
  useEffect(() => {
    if (!client) return;
    try {
      setParameter('ENABLE_AUDIO_PTS', true);
      console.log('Enabled ENABLE_AUDIO_PTS for timing synchronization');
    } catch (error) {
      console.warn('Could not set ENABLE_AUDIO_PTS:', error);
    }
  }, [client]);

  // Track the auto-assigned RTC UID for token renewal and agent invite.
  useEffect(() => {
    if (joinSuccess && client) {
      const uid = client.uid;
      setJoinedUID(uid as UID);
      console.log('Join successful, using UID:', uid);
    }
  }, [joinSuccess, client]);

  // useConversationalAI config. rtmClient is stable (LandingPage completes
  // login+subscribe before rendering this component), so this memo is computed
  // once and the hook initialises exactly once per component lifetime.
  const conversationalAIConfig = useMemo(
    () => ({
      channel: agoraData.channel,
      rtmConfig: { rtmEngine: rtmClient },
      renderMode: TranscriptHelperMode.TEXT,
      enableLog: true,
    }),
    // rtmClient is stable for component lifetime — intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agoraData.channel]
  );

  const { transcript, isConnected: aiConnected, error: aiError } =
    useConversationalAI(conversationalAIConfig);

  useEffect(() => {
    if (aiError) console.error('[ConversationalAI] init error:', aiError);
  }, [aiError]);

  useEffect(() => {
    if (aiConnected) console.log('[ConversationalAI] toolkit connected, listening for transcripts');
  }, [aiConnected]);

  const messageList = useMemo(
    () =>
      transcriptToMessageList(
        (transcript as ToolkitMessage[]).filter((m) => m.status === TurnStatus.END)
      ),
    [transcript]
  );

  const currentInProgressMessage = useMemo(() => {
    const m = (transcript as ToolkitMessage[]).find((x) => x.status === TurnStatus.IN_PROGRESS);
    return m ? transcriptToMessageList([m])[0] : null;
  }, [transcript]);

  // Publish local mic once the track exists; usePublish waits for RTC connection.
  usePublish([localMicrophoneTrack]);

  useClientEvent(client, 'user-joined', (user) => {
    console.log('Remote user joined:', user.uid);
    if (user.uid.toString() === agentUID) setIsAgentConnected(true);
  });

  useClientEvent(client, 'user-left', (user) => {
    console.log('Remote user left:', user.uid);
    if (user.uid.toString() === agentUID) setIsAgentConnected(false);
  });

  // Sync isAgentConnected with remoteUsers (covers cases where user-joined/left are missed)
  useEffect(() => {
    const isAgentInRemoteUsers = remoteUsers.some(
      (user) => user.uid.toString() === agentUID
    );
    setIsAgentConnected(isAgentInRemoteUsers);
  }, [remoteUsers, agentUID]);

  useClientEvent(client, 'connection-state-change', (curState, prevState) => {
    console.log(`Connection state changed from ${prevState} to ${curState}`);
    if (curState === 'DISCONNECTED') console.log('Attempting to reconnect...');
  });

  // useJoin handles client.leave() on unmount — do NOT call it here too.
  useEffect(() => {
    return () => {
      if (localMicrophoneTrack) localMicrophoneTrack.close();
    };
  }, [localMicrophoneTrack]);

  const handleStartConversation = useCallback(async () => {
    if (!activeAgentId) return;

    try {
      const startRequest: ClientStartRequest = {
        requester_id: joinedUID?.toString(),
        channel_name: agoraData.channel,
      };

      const response = await fetch('/api/invite-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(startRequest),
      });

      if (!response.ok) {
        throw new Error(`Failed to start conversation: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.agent_id) setActiveAgentId(data.agent_id);
    } catch (error) {
      if (error instanceof Error) {
        console.warn('Error starting conversation:', error.message);
      }
    }
  }, [activeAgentId, joinedUID, agoraData.channel]);

  /**
   * Mute/unmute via track.setEnabled() only — usePublish owns publish state.
   * If we also unpublish in the toggle, usePublish and the button fight each other
   * and break the MicButtonWithVisualizer Web Audio graph.
   */
  const handleMicToggle = useCallback(async () => {
    const next = !isEnabled;
    const track = localMicrophoneTrack;
    if (!track) {
      setIsEnabled(next);
      return;
    }
    try {
      await track.setEnabled(next);
      setIsEnabled(next);
      if (next && !isAgentConnected) {
        await handleStartConversation();
      }
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, [isEnabled, localMicrophoneTrack, isAgentConnected, handleStartConversation]);

  const handleTokenWillExpire = useCallback(async () => {
    if (!onTokenWillExpire || !joinedUID) return;
    try {
      const newToken = await onTokenWillExpire(joinedUID.toString());
      await client?.renewToken(newToken);
      await rtmClient.renewToken(newToken);
      console.log('Successfully renewed Agora RTC and RTM tokens');
    } catch (error) {
      console.error('Failed to renew Agora token:', error);
    }
  }, [client, onTokenWillExpire, joinedUID, rtmClient]);

  useClientEvent(client, 'token-privilege-will-expire', handleTokenWillExpire);

  // Debug: log remote UIDs vs NEXT_PUBLIC_AGENT_UID to catch mismatches
  useEffect(() => {
    if (remoteUsers.length > 0) {
      console.log('Remote users detected:', remoteUsers.map((u) => u.uid));
      console.log('Current NEXT_AGENT_UID:', agentUID);

      const potentialAgents = remoteUsers.map((u) => u.uid.toString());
      if (agentUID && !potentialAgents.includes(agentUID)) {
        console.warn('Agent UID mismatch! Expected:', agentUID, 'Available users:', potentialAgents);
        console.info(`Consider updating NEXT_AGENT_UID to one of: ${potentialAgents.join(', ')}`);
      }
    }
  }, [remoteUsers, agentUID]);

  return (
    <div className="flex flex-col gap-6 p-4 h-full">
      {/* Connection status + end call */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={onEndConversation}
          className="px-4 py-2 bg-transparent text-red-500 rounded-full border border-red-500 backdrop-blur-sm
          hover:bg-red-500 hover:text-black transition-all duration-300 shadow-lg hover:shadow-red-500/20 text-sm font-medium"
        >
          End Conversation
        </button>
        <div
          className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        />
      </div>

      {/* Remote users (agent audio + RTC subscription) */}
      <div className="flex-1">
        {remoteUsers.map((user) => (
          <div key={user.uid}>
            <AudioVisualizer track={user.audioTrack} />
            <RemoteUser user={user} />
          </div>
        ))}
        {remoteUsers.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Waiting for AI agent to join...
          </div>
        )}
      </div>

      {/* Local controls */}
      <div className="fixed bottom-14 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="conversation-mic-host flex items-center justify-center">
          <MicButtonWithVisualizer
            isEnabled={isEnabled}
            setIsEnabled={setIsEnabled}
            track={localMicrophoneTrack}
            onToggle={handleMicToggle}
            className="overflow-visible"
          />
        </div>
        <MicrophoneSelector localMicrophoneTrack={localMicrophoneTrack} />
      </div>

      <ConvoTextStream
        messageList={messageList}
        currentInProgressMessage={currentInProgressMessage}
        agentUID={agentUID}
      />
    </div>
  );
}
