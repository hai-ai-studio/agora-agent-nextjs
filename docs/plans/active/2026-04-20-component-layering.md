# 2026-04-20 — 组件分层准则与审计

> Status: **draft / awaiting review**
> Goal: 明确"展示 vs 逻辑"的分层边界，把现在混在 `features/conversation/components/` 里的展示逻辑下沉到 `convo-ui`，让业务层只做数据适配和编排。
>
> 本文件是对 [`docs/guides/CONVO_UI.md`](../../guides/CONVO_UI.md) §1 的细化：那份指南定义了两层（convo-ui vs features），这份把两层裂成四层，并逐个组件对照。

---

## 1. 为什么要做这件事

现状：`convo-ui` 建好了 28 个组件并且**零业务耦合**，但 `features/conversation/components/` 里的 `Controls`、`Waveform` 基本没消费它们——就地重造了一遍 SVG 图标、按钮样式、bar 动画。结果：

- 视觉逻辑（颜色、透明度、bar shaping）漏到了业务层，dark-mode / 主题切换时会踩坑两次。
- 设计系统演进（加一个 variant、改一个 token）无法自动惠及业务层。
- `ConversationShell` 变成 400 行的"编排 + 视觉 helper + 移动端 sheet"的大杂烩。

根因是**只有两层模型不够用**：现实里有"纯展示"、"有本地 UI 状态但无 IO 的展示"、"把 Agora 数据接到展示组件的薄适配器"、"持有 RTC 生命周期的容器"四种角色。下面给它们各自命名、各自定规。

---

## 2. 分层模型（四层）

```
┌────────────────────────────────────────────────────────────────┐
│ L4  Feature Shell             features/<feature>/components/   │
│     持有 RTC/RTM 生命周期、路由级副作用、顶层布局              │
│     例：LandingPage, ConversationShell                         │
├────────────────────────────────────────────────────────────────┤
│ L3  Feature Adapter           features/<feature>/components/   │
│     把业务数据源（Agora track / 设备 API / hook）              │
│     转换成 L1/L2 需要的 plain props；自身不做视觉决策          │
│     例：MicPicker（设备 API → 列表）                            │
├────────────────────────────────────────────────────────────────┤
│ L2  DS Stateful UI            components/convo-ui/             │
│     允许本地 UI 状态（popover open、selection draft、          │
│     RAF 动画帧），但禁止任何 IO / 浏览器外设 API / 业务类型     │
│     例：VoicePicker, BarsWave, Persona(timer), AudioPlayer     │
├────────────────────────────────────────────────────────────────┤
│ L1  DS Presentational         components/convo-ui/             │
│     props-in JSX-out，无 useState、无 useEffect                │
│     例：IconButton, BrandMark, TranscriptBubble                │
└────────────────────────────────────────────────────────────────┘
```

### 2.1 判断 checklist

给一个组件贴层标签时，按顺序问下面的问题。**第一个 yes 决定了它的层**：

| # | 问题                                                               | 如果 yes → 这一层 |
| - | ------------------------------------------------------------------ | ----------------- |
| 1 | 是否 import `agora-*` 运行时、`@/features/*`、或读 `process.env`？ | **L3 或 L4**      |
| 2 | 是否调用 `navigator.*` / `fetch` / `localStorage`？                | **L3 或 L4**      |
| 3 | 是否在 `useEffect` 里订阅 RTC/RTM 事件或管理 session 生命周期？    | **L4**            |
| 4 | 是否仅把上面的数据源映射成 plain props 后交给 L1/L2？              | **L3**            |
| 5 | 是否有 `useState`/`useEffect` 但只管 UI（popover、RAF、timer）？   | **L2**            |
| 6 | 以上都不，纯 props → JSX？                                         | **L1**            |

### 2.2 强约束

- **L1/L2 禁止 import 的清单**：`agora-rtc-react`, `agora-rtm`, `agora-agent-*`, `@/features/*`, `process.env.*`, `navigator.mediaDevices`, `fetch`。
- **L3 禁止做的事**：决定颜色、动画形状、尺寸、文案；这些应通过 props 传给 L1/L2，或由 L1/L2 从主题 token 自取。
- **L4 禁止做的事**：内联超过 ~20 行的 JSX helper（例如一大块卡片 body）——抽成 L3 组件。

### 2.3 命名与位置

- L1/L2 放 `src/components/convo-ui/`，文件名即组件名（`BarsWave.tsx`）。
- L3/L4 放 `src/features/<feature>/components/`。L3 文件名可以直接用领域名（`MicPicker`、`TranscriptPanel`），不需要 `-Adapter` 后缀。
- **非组件文件**（state machines、纯函数、类型）不进 `components/`，进同级 `lib/` 或 `types.ts`。

---

## 3. 审计：convo-ui（28 组件）

已全部扫过，**无业务耦合违规**。分布：

- **L1 纯展示（17）**：`IconButton`, `CallControls`, `BrandMark`, `BargeInIndicator`, `StatusIndicator`, `ConnectionStatus`, `LatencyIndicator`, `ErrorToast`, `BigCallButton`, `MicPermissionCard`, `VoiceCard`, `SessionList`, `ToolCallCard`, `AgentConfigCard`, `LiveSubtitle`, `TranscriptBubble`, `icons`
- **L2 有 UI 状态（6）**：`VoicePicker`, `VoiceSelector`, `LanguagePicker`, `AudioPlayer`, `Persona`（含 call timer）, `BarsWave`（RAF 动画帧）
- **L2 RAF-only（4）**：`VoiceOrb`, `LinearWave`, `CircleWave`, `Transcript`（自动滚动 effect）
- **Ambient**：用了 `useSyncExternalStore` 订阅 `prefers-color-scheme`——属 L2，合规（订阅的是 CSS 媒体查询，不是 IO）。

**动作：无需改动**。唯一可做的清理是在 `index.ts` 或 `CONVO_UI.md` 里把 L1 / L2 分组标注，让调用方一眼看出哪些"更重"——**这是 nice-to-have，不阻塞**。

---

## 4. 审计：features/conversation/components（6 文件）

| 文件                    | 当前层次       | 是否合规 | 问题                                                                            |
| ----------------------- | -------------- | -------- | ------------------------------------------------------------------------------- |
| `LandingPage.tsx`       | L4             | ✅       | 编排 `useAgoraSession` + 渲染 Ambient/BrandMark/ErrorToast。无视觉逻辑内联。    |
| `ConversationShell.tsx` | L4             | ⚠️       | 编排部分合规，但内联了 `transcriptCardBody` JSX + 移动端 sheet + 40 行 motion 代码，混了 L3 的职责。 |
| `Controls.tsx`          | L3（应为）     | ❌       | 自绘三个 SVG 图标、自定义 `DOCK_PILL`/`CTRL_BTN`/`CTRL_ACTIVE` 样式常量——**这些都是 L1 `CallControls` + `IconButton` + `icons` 已有的东西**，属于平行重造。 |
| `Waveform.tsx`          | L3（应为）     | ❌       | 250 行里绝大部分是视觉决策：48-bar shaping、center-mirror envelope、state→颜色 映射、activeOpacity。convo-ui 已有 `BarsWave`，但没用。 |
| `MicPicker.tsx`         | L3             | ⚠️       | 职责合规（设备 API → 列表），但内联了 chevron 图标 + popover 样式。popover 行为和 L2 的 `VoiceSelector`/`LanguagePicker` 重复。 |
| `aria-state.ts`         | 非组件         | ❌       | 文件就是类型 + pure function + 常量，**放在 `components/` 下是位置错误**，应迁到 `lib/`。 |

---

## 5. 改造计划

按"风险低 → 收益高"排序。每一步独立可落地，独立可 revert。

### Step 1 — `aria-state.ts` → `lib/`（0.5h，零风险）

**动作**：

- `mv src/features/conversation/components/aria-state.ts src/features/conversation/lib/aria-state.ts`
- 更新 2 处引用（`ConversationShell.tsx`、`LandingPage.tsx`）。

**验收**：`pnpm typecheck` + `pnpm lint` 绿。

---

### Step 2 — `Controls.tsx` 复用 convo-ui（2h，低风险）

**动作**：

1. 删除 `Controls.tsx` 里的 `IconMic`, `IconEnd`, `IconCaptions` 三个内联 SVG——全部在 convo-ui 的 `icons.tsx` 里有对应物（必要时补齐缺的）。
2. 删除 `DOCK_PILL`, `CTRL_BTN`, `CTRL_ACTIVE`, `CTRL_END` 四个样式常量，改用 convo-ui `CallControls` + `IconButton` 的 `variant`。
3. `VoiceSelector` 和 `MicPicker` 作为 `CallControls` 的 slot 插入；如果 `CallControls` 当前 API 不支持自定义 slot，扩展它（L1 层面的扩展，不掺业务）。
4. `Controls.tsx` 收缩到 ~50 行，只剩"props 进 / L1 组合出"。

**验收**：

- 视觉 diff：`/design` 页面对比改前改后截图，dock 外观不变。
- `pnpm build` 绿。

**风险点**：`CallControls` 如果没有 "active 态 + 危险态 + 自定义 slot" 的 variant 组合，可能需要先扩 L1；这部分属于 L1 的正常演进，不算额外成本。

---

### Step 3 — 抽 `TranscriptPanel`（L3）（2h，低风险）

**动作**：

1. 新建 `features/conversation/components/TranscriptPanel.tsx`。
2. 把 `ConversationShell.tsx` 里的 `transcriptCardBody` + 桌面 `<aside>` + 移动端 `AnimatePresence/motion.div` bottom-sheet 整块搬进去。
3. 对外暴露 `{ entries, activeText, activeSpeaker, visible, onHide }` 几个 plain props——内部消费 L1 的 `Transcript` + 自管布局切换。
4. `ConversationShell` 对应 ~70 行 JSX 消失，只剩 `<TranscriptPanel {...} />`。

**验收**：

- 手测：桌面和 <md 视口下，panel 的展开/收起、mobile sheet 的 backdrop-tap 关闭、动画时序都与之前一致。
- `pnpm build` 绿。

---

### Step 4 — `Waveform.tsx` 瘦身（4h，中等风险）

这一步最敏感，独立 plan 更稳妥——先在本 plan 里落定方向，具体实现另开文档。

**动作方向**：

1. **视觉下沉到 L2 `BarsWave`**：`BarsWave` 接受 `state: AriaState | 'idle' | 'listening' | ...` 和可选 `bands: { bass, mid, treble } | null`。如果 `bands` 非 null，用 `shapeByBand` 算 bar 高度；否则按 state 走内置的 synthesized 算法。颜色 / activeOpacity 完全由 state + 主题 token 驱动。
2. **L3 `Waveform.tsx` 退化成适配器**：`audioTrack → useAudioFFT → bands → <BarsWave state bands variant />`。代码量从 ~250 行降到 ~30 行。
3. `mapToAriaState` 的"user/agent 谁是 active"判定留在 L3 侧，通过 `variant` prop 告诉 L2。

**风险点**：`BarsWave` 现在独立运作（`animVals` 内部 RAF），和 `Waveform.tsx` 的 RAF 循环二选一。需要确认同时只有一个 RAF 在跑，否则帧率和电量都遭殃。

**验收独立列**：本步骤完成后再在独立 plan 里定。

---

### Step 5 — MicPicker popover 对齐（可选，优先级低）

**动作（可选）**：如果后续还会加第三个 popover，把三个（`VoiceSelector` / `LanguagePicker` / `MicPicker`）共用的 popover 壳抽成 L1 的 `<Popover>`。现在只有三个独立实现，**先不动**——三个平行实现胜过早抽象。

---

## 6. 准则固化

本 plan 落地后（Step 1-4 完成），把 §2 的四层模型和判断 checklist 合并进 [`docs/guides/CONVO_UI.md`](../../guides/CONVO_UI.md) §1，让它成为团队长期规约。本 plan 完成后移入 `docs/plans/completed/`。

---

## 7. 范围外

这些问题真实存在，但不在本 plan 处理，避免范围蔓延：

- `convo-ui` 内部 `VoicePicker` vs `VoiceSelector` 语义重叠——独立 plan。
- `BarsWave` / `LinearWave` / `CircleWave` / `VoiceOrb` 的选型指南——写进 Storybook，不在本 plan。
- `convo-ui` 抽成独立 npm 包 / shadcn registry——已被 ADR 0003 记为 superseded 的方向，暂不重开。
