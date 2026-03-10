import { NextRequest, NextResponse } from 'next/server';
import {
  AgoraClient,
  Agent,
  Area,
  ExpiresIn,
  OpenAI,
  ElevenLabsTTS,
  DeepgramSTT,
} from 'agora-agent-server-sdk';
import { ClientStartRequest, AgentResponse } from '@/types/conversation';

// System prompt that defines the agent's personality and behavior.
// Swap this out to change what the agent talks about.
const ADA_PROMPT = `You are **Ada**, a technical developer advocate and virtual assistant from **Agora**. You help builders deeply understand Agora's **voice-first AI stack** and guide them from idea to execution — whether they're prototyping a demo, designing production workflows, or evaluating alternatives. You don't just provide answers — you **empathize with developers**, ask thoughtful questions, and help them discover what's possible. You're technically credible, but human. You advocate for Agora's strengths: its **global SDRTN**, ultra-low latency infrastructure, and ability to orchestrate complex **voice-AI pipelines** with interruptible, context-aware, real-time interaction. Your job is to scope what they want to build, recommend the right approach, and guide them to next steps (docs, samples, demos, or a solutions handoff). You aim to make every dev feel like they're building with the best tools — and that **voice is the future interface**.

# Persona & Tone
- Think like a **developer advocate** — be technical, but also empowering. Help users understand why Agora's approach is powerful and how they can build quickly.
- Be curious: Ask good questions to uncover what users are really trying to build. Be excited by cool use cases.
- Don't shy away from sharing what makes Agora special: SDRTN, cascading workflows, agent orchestration, etc.
- Balance empathy and authority. You're not a support agent — you're a peer who builds things too.
- Friendly, concise, and technically credible. Avoid fluff.
- Default to practical guidance and actionable steps. Use plain English.

# Core Behavior Guidelines
- **Clarify before answering**: When asked for info that will require a detailed response, respond with 1–2 clarifying questions to better understand what they're trying to do. Only provide a detailed answer if they clarify.
- **Keep it short by default**: Give brief, focused replies (2–4 sentences max). Expand only if the user asks for more.
- **Max 2 back-to-back questions**: Never ask more than 2 questions in a row. Balance inquiry with helpful replies or a suggestion.
- **Don't assume too much**: If a question is vague ("How does it work?"), ask what aspect they want to focus on (e.g., setup, latency, architecture).
- **Always aim to guide, not lecture**: Your job is to scope and guide, not teach everything at once.`;

// First thing the agent says when a user joins the channel.
const GREETING = `Hi there! I'm Ada, your virtual assistant from Agora. I'm here to help you explore our voice AI offerings and understand what you're looking to build. What kind of project do you have in mind?`;

// ---------------------------------------------------------------------------
// Validate env vars once at module load — misconfiguration surfaces on startup
// rather than on the first user request.
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// API keys — set these in .env.local (see env.local.example)
const appId =
  process.env.NEXT_PUBLIC_AGORA_APP_ID || requireEnv('NEXT_AGORA_APP_ID');
const appCertificate = requireEnv('NEXT_AGORA_APP_CERTIFICATE');
// agentUid identifies the AI in the RTC channel — must match NEXT_PUBLIC_AGENT_UID on the client
const agentUid = process.env.NEXT_PUBLIC_AGENT_UID || 'Agent';
// Any OpenAI-compatible endpoint works here (OpenAI, Azure, Groq, etc.)
const llmUrl = requireEnv('NEXT_LLM_URL');
const llmApiKey = requireEnv('NEXT_LLM_API_KEY');
const deepgramApiKey = requireEnv('NEXT_DEEPGRAM_API_KEY');
const elevenLabsApiKey = requireEnv('NEXT_ELEVENLABS_API_KEY');
const elevenLabsVoiceId = requireEnv('NEXT_ELEVENLABS_VOICE_ID');

export async function POST(request: NextRequest) {
  try {
    // --- 1. Parse request ---

    const body: ClientStartRequest = await request.json();
    const { requester_id, channel_name } = body;

    if (!channel_name || !requester_id) {
      return NextResponse.json(
        { error: 'channel_name and requester_id are required' },
        { status: 400 },
      );
    }

    // --- 3. Build and start the agent ---

    // AgoraClient authenticates API calls to the Agora Conversational AI service
    const client = new AgoraClient({
      area: Area.US,
      appId,
      appCertificate,
    });

    const agent = new Agent({
      name: `conversation-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      instructions: ADA_PROMPT,
      greeting: GREETING,
      failureMessage: 'Please wait a moment.',
      maxHistory: 50,
      // VAD controls how long the agent waits after the user stops speaking
      // before treating it as the end of a turn
      turnDetection: {
        type: 'agora_vad',
        silence_duration_ms: 480,
        threshold: 0.5,
        interrupt_duration_ms: 160,
        prefix_padding_ms: 300,
      },
      // RTM is required for transcript events in the browser client
      advancedFeatures: { enable_rtm: true },
    })
      .withStt(
        new DeepgramSTT({
          apiKey: deepgramApiKey,
          model: 'nova-3',
          language: 'en',
        }),
      )
      .withLlm(
        new OpenAI({
          url: llmUrl,
          apiKey: llmApiKey,
          model: 'gpt-4o',
          greetingMessage: GREETING,
          failureMessage: 'Please wait a moment.',
          maxHistory: 10,
          params: { max_tokens: 1024, temperature: 0.7, top_p: 0.95 },
        }),
      )
      .withTts(
        new ElevenLabsTTS({
          key: elevenLabsApiKey,
          modelId: 'eleven_flash_v2_5',
          voiceId: elevenLabsVoiceId,
        }),
      );

    // remoteUids restricts the agent to only process audio from this user
    const session = agent.createSession(client, {
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      idleTimeout: 30,
      expiresIn: ExpiresIn.hours(1),
    });

    const agentId = await session.start();

    return NextResponse.json({
      agent_id: agentId,
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
    } as AgentResponse);
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start conversation',
      },
      { status: 500 },
    );
  }
}
