# 0005 — Zod at boundaries only (API routes + env + RTM payloads)

- Date: 2026-04-20
- Status: Proposed (not yet implemented as of writing)
- Revisit when: validation surface grows beyond ~10 schemas or internal data shapes become ambiguous

## Context

Inputs cross the boundary into our code from four places:

1. HTTP request bodies to `/api/invite-agent`, `/api/stop-conversation`, `/api/chat/completions`.
2. Query params to `/api/generate-agora-token`.
3. Environment variables (`NEXT_PUBLIC_AGORA_APP_ID`, `NEXT_AGORA_APP_CERTIFICATE`, optional BYOK keys).
4. RTM message payloads (decoded JSON in `useAgoraVoiceAI`).

Today, inputs 1-2 use `as X` casts. Env vars are accessed raw via `process.env.FOO!` with runtime surprises if unset. RTM payloads use hand-written type guards (`isRtmMessageErrorPayload`, `isRtmSalStatusPayload`).

The question: should we adopt Zod project-wide, or limit it?

## Decision

Adopt Zod at the **boundary** layer only:

1. **API route request parsing.** Replace `body as X` with `Schema.parse(body)`. On malformed input, return a 400 with clear detail.
2. **Env validation.** One `envSchema.parse(process.env)` call at server-module load time. Missing `NEXT_PUBLIC_AGORA_APP_ID` fails the first request, not at RTC-join time.
3. **RTM payload parsing.** Replace hand-written type guards with Zod schemas. The schema IS the type; no drift between `isX` predicate and `X` interface.

Do **not** adopt Zod for:

- Internal data shapes (React props, hook returns). TypeScript's structural types are already checked at compile time — runtime schemas here add noise without value.
- Transcript messages after they've been parsed by `AgoraVoiceAI`. We trust the toolkit.

## Consequences

**Good:**

- Malformed requests fail loud with actionable errors (boundary validation catches the real-world failure mode).
- Env misconfiguration fails at startup with "NEXT_AGORA_APP_CERTIFICATE is required" rather than at `RtcTokenBuilder.buildTokenWithRtm` with a cryptic error.
- RTM payload schemas double as TypeScript types via `z.infer<...>`, removing the "predicate + interface" duplication.
- Adds ~25KB to the server bundle (tree-shakable). Negligible to a quickstart whose client bundle is dominated by Agora SDK.

**Bad:**

- New dependency to learn. Mitigated by limiting scope — only 5-6 schemas project-wide.
- Schema syntax adds ceremony at each API route (`const Body = z.object({ ... })`). Accepted; it's one block per file.

## What this looks like in code

```ts
// src/features/conversation/types.ts (or a new schemas module)
import { z } from 'zod';

export const ClientStartRequest = z.object({
  requester_id: z.string(),
  channel_name: z.string(),
});
export type ClientStartRequest = z.infer<typeof ClientStartRequest>;

// src/app/api/invite-agent/route.ts
const body = ClientStartRequest.parse(await request.json());
// body is now typed AND validated
```

```ts
// src/features/conversation/lib/env.ts
import { z } from 'zod';

const Env = z.object({
  NEXT_PUBLIC_AGORA_APP_ID: z.string().min(1),
  NEXT_AGORA_APP_CERTIFICATE: z.string().min(1),
  NEXT_PUBLIC_AGENT_UID: z.string().optional(),
  // ...
});
export const env = Env.parse(process.env);
```

## Alternatives considered

- **No runtime validation (status quo).** Rejected for API routes — malformed client requests should fail loud, not unclear-downstream.
- **Yup / Valibot.** Rejected: Zod is the React / Next.js ecosystem default; we don't need Valibot's smaller bundle for 5 schemas.
- **Hand-rolled validators.** Rejected: exactly the thing the type-guards mentioned above are, and that drift between guard and type is the reason we're adopting Zod.

## Related

- [0004-no-state-library-yet](./0004-no-state-library-yet.md) — parallel "when to adopt a library" reasoning; Zustand was declined, Zod is accepted partially.
- See `docs/plans/tech-debt.md` under "Boundaries / validation" for the concrete migration items.
