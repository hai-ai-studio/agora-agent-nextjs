# 2026-04-20 — Shared hooks extraction

> Status: **completed** (2026-04-20)
> Goal: eliminate the three parallel outside-click / popover / media-query implementations in convo-ui by promoting them to shared hooks. Follows up on the component-optimization audit ([`2026-04-20-component-layering.md`](../active/2026-04-20-component-layering.md) noted the symptom; this plan fixes it).

---

## 1. What's duplicated

Current state — three pickers each implement the same popover lifecycle by hand, slightly differently:

| File | Outside-click | Keyboard nav | Open state |
| --- | --- | --- | --- |
| `LanguagePicker.tsx` | `mousedown` + ref `.contains()` | — | `useState` |
| `MicPicker.tsx` | `click` + `.closest('.mic-picker')` class check | `useMenuKeyboardNav` | `useState` |
| `VoiceLangMenu.tsx` | `click` + `.closest('.voice-lang-menu-{useId}')` class check | `useMenuKeyboardNav` | `useState` |

Three different click events, three different containment strategies, three copies of the same `useEffect` gate. Plus `Ambient.tsx` has an inline `useIsDark` that can't be reused, and `ConversationShell.tsx` does its own one-shot `window.matchMedia()` read for the mobile breakpoint.

## 2. What we're extracting

Three new hooks under `src/components/convo-ui/hooks/`:

### 2.1 `useClickOutside(ref, active, onOutside)`

Classic outside-click hook. `mousedown` listener, ref-based containment. Gated on `active` so the listener only exists while the popover is open.

```ts
function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onOutside: () => void,
): void
```

- `mousedown` not `click` — fires before focus blur, so the dismissing interaction feels instant. Matches `LanguagePicker`'s original choice, which was the most correct of the three.
- ref-based containment replaces class-based lookups. `VoiceLangMenu`'s per-instance `voice-lang-menu-{useId()}` class becomes obsolete — each ref is already a unique DOM reference, so multi-instance isolation is free.

### 2.2 `useMediaQuery(query, defaultValue?)`

SSR-safe subscription to a CSS media query.

```ts
function useMediaQuery(query: string, defaultValue?: boolean): boolean
export const useIsDark = () => useMediaQuery('(prefers-color-scheme: dark)', false);
export const useIsMobile = () => useMediaQuery('(max-width: 767px)', false);
```

- Internally uses `useSyncExternalStore` — same pattern as Ambient's current inline `useIsDark`, promoted to a reusable hook.
- `defaultValue` handles the SSR frame (no `window` available). Falls back to `false` by default.
- **Does not** shadow `motion/react`'s `useReducedMotion` — that hook has extra semantics (listens across the whole DOM tree, participates in motion graphs). We won't re-export a reduced-motion wrapper here; consumers that need it keep using `motion/react`'s.

### 2.3 `usePopover()`

Combines `useState` + `useClickOutside` + `useMenuKeyboardNav` into one hook for the standard picker pattern.

```ts
function usePopover(): {
  open: boolean;
  setOpen: (next: boolean) => void;
  triggerRef: RefObject<HTMLElement | null>;
  menuRef: RefObject<HTMLElement | null>;
  handleMenuKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
}
```

Caller wiring collapses to:

```tsx
const { open, setOpen, triggerRef, menuRef, handleMenuKeyDown } = usePopover();

return (
  <>
    <button ref={triggerRef} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
      …
    </button>
    {open && (
      <div ref={menuRef} role="menu" onKeyDown={handleMenuKeyDown}>
        …
      </div>
    )}
  </>
);
```

Outside-click gating, keyboard navigation, auto-focus on open, Escape-to-close with trigger refocus — all handled.

## 3. Migration impact

| Consumer | Change |
| --- | --- |
| `MicPicker.tsx` | `useMenuKeyboardNav` + outside-click `useEffect` + `useState(false)` → one `usePopover()` call. Drops `.mic-picker` class entirely. |
| `VoiceLangMenu.tsx` | Same. Drops the `scopeClass` + `useId` wiring (previously needed for multi-instance outside-click isolation — now free via refs). |
| `LanguagePicker.tsx` | Uses `useClickOutside` directly (no menu role, no keyboard nav to extract). Already had `open`-gating after finding #7; this refactor just formalizes the pattern. |
| `Ambient.tsx` | Inline `useIsDark` is removed; imports `useIsDark` from convo-ui hooks. Behavior identical — the implementation moves but the subscription stays on `useSyncExternalStore`. |
| `ConversationShell.tsx` | `useState(() => window.matchMedia(...))` for `isTranscriptVisible` → `useIsMobile()` + derive initial state. Gains live updates on breakpoint changes (previously only ran once). |

## 4. What NOT to extract (for the record)

- **`useLatestRef(value)`** — the "ref written in an effect to keep a latest value" pattern. Used in BarsWave + Waveform (2 places, ~3 lines each). Marginal savings, skip.
- **`useAnimationFrame`** — canvas waveforms (CircleWave / LinearWave / VoiceOrb) each have a RAF loop, but the RAF wrapper itself is 4 lines and the bodies are all different. No meaningful shared surface.
- **Timer hooks** (Persona call timer, AudioPlayer position). Two different shapes, unifying would overfit.
- **Hot-path BarsWave RAF** — too specific to abstract.

## 5. Plan-acceptance checklist

- [x] Plan written (this doc)
- [x] `useClickOutside` landed + LanguagePicker migrated (MicPicker + VoiceLangMenu went straight to `usePopover` to avoid double migration)
- [x] `useMediaQuery` + `useIsDark` / `useIsMobile` landed + Ambient + ConversationShell migrated
- [x] `usePopover` landed + MicPicker + VoiceLangMenu migrated
- [x] `pnpm tsc --noEmit` + `pnpm lint` green
- [x] Plan moved to `docs/plans/completed/`
