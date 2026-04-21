# Agora Conversational AI Next.js Quickstart

> [English](./README.md) · **简体中文**
>
> Agora 官方 Conversational AI demo 家族中的 Next.js 版本。相较基础 demo，这个 quickstart 在 **UX 细节与视觉设计** 上额外投入了打磨，两个环境变量即可**开箱运行**，同时附带一个可独立复用的**语音 UI 组件库**（`convo-ui`），方便基于它扩展到你自己的产品。

<p align="center">
  <img src=".github/assets/Conversation-Ai-Client.gif" alt="Conversational AI demo" width="720" />
</p>

## 亮点

- **Karaoke 风格实时字幕** — 词级高亮跟随 Agent 的 TTS 播放位置，而不是服务器时间戳；用户打断时，字幕信号会平滑切换到"当前真正在说话的人"。
- **端到端延迟实时指示** — 从 Agent 回传的延迟数据中解析出来，用 4 段信号条（绿 / 黄 / 红）可视化呈现，一眼看出通话是否健康。
- **为语音而生的 UI** — canvas 驱动的 `VoiceOrb` 呼吸球、多种波形可视化、流式字幕、工具调用卡、连接指示、打断提示——每个组件都是为真实的对话 UX 调过的，不是从通用聊天 UI 改出来的。
- **`convo-ui` 组件库** — 28 个组件打包为独立的内置库。`/design` 页面是可视目录，或者 `pnpm storybook` 独立调试，自带亮暗主题切换和 a11y 检测。
- **单一视图状态机** — 把 RTC 连接、RTM 登录、麦克风静音、Agent 状态合并成一个枚举，确保通话中 UI 不会闪烁，也不会在 Agent 还没打招呼时就提示"开始说话"。
- **两个环境变量就能跑** — 默认走 Agora 托管的 STT / LLM / TTS，不用注册任何第三方账号就能听见第一声 hello。

## 快速开始

```bash
git clone https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs.git
cd agent-quickstart-nextjs
pnpm install
cp env.local.example .env.local    # 然后填入两个 Agora 变量
pnpm dev
```

打开 `http://localhost:3000`。

必需环境变量（在 [Agora 控制台](https://console.agora.io/) 建项目后获取）：

| 变量 | 位置 |
| --- | --- |
| `NEXT_PUBLIC_AGORA_APP_ID` | 客户端 + 服务端 |
| `NEXT_AGORA_APP_CERTIFICATE` | 仅服务端 — 绝不外泄 |

可选：`NEXT_PUBLIC_AGENT_UID`（默认 `123456`）、`NEXT_AGENT_GREETING`（覆盖开场白）。

## 定制

| 想改什么 | 改哪里 |
| --- | --- |
| Agent 的系统 prompt 和开场白 | `src/features/conversation/server/invite-agent-config.ts` |
| VAD / 模型 / 音色 管线 | `src/app/api/invite-agent/route.ts` |
| 接入自建 LLM | `src/app/api/chat/completions/route.ts` + 设置 `NEXT_LLM_URL` / `NEXT_LLM_API_KEY` |
| 更换 STT / TTS 供应商 | 在 `src/app/api/invite-agent/route.ts` 取消注释 Deepgram / ElevenLabs 块 |
| UI 组件与主题 | `src/components/convo-ui/`，`/design` 浏览目录，`pnpm storybook` 独立调试 |

BYOK 示例（Deepgram STT、ElevenLabs TTS、自建 LLM）以注释形式保留在 invite-agent 路由里。自建 LLM 代理需要公网 URL——本地开发用 `ngrok http 3000`，Agora 云端无法访问 `localhost`。

## 架构

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./system-architecture-dark.svg">
  <img src="./system-architecture.svg" alt="系统架构" />
</picture>

浏览器向后端换取 Token → 后端邀请 Agora 云端 Agent 加入频道 → 浏览器加入 RTC 推送麦克风音频，通过 RTM 订阅实时转录和 Agent 状态 → 调用 `/api/stop-conversation` 结束会话。

完整目录地图、数据流、每条 API 路由的契约，见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAgoraIO-Conversational-AI%2Fagent-quickstart-nextjs&project-name=agent-quickstart-nextjs&repository-name=agent-quickstart-nextjs&env=NEXT_PUBLIC_AGORA_APP_ID,NEXT_AGORA_APP_CERTIFICATE&envDescription=Agora%20credentials%20needed%20to%20run%20the%20app&envLink=https%3A%2F%2Fgithub.com%2FAgoraIO-Conversational-AI%2Fagent-quickstart-nextjs%23run-it&demo-title=Agora%20Conversational%20AI%20Next.js%20Quickstart&demo-description=Official%20Next.js%20quickstart%20for%20building%20browser-based%20voice%20AI%20with%20Agora&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2FAgoraIO-Conversational-AI%2Fagent-quickstart-nextjs%2Fmain%2F.github%2Fassets%2FConversation-Ai-Client.gif)

点击上方 Vercel 按钮一键部署，或将仓库推送到任何支持 Next.js 16 的平台，部署时只需填入两个 Agora 环境变量。

## 文档导航

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 目录树、数据流、API 路由、组件
- [AGENTS.md](./AGENTS.md) — AI Coding Agent 作业规则、已知陷阱、样式规范
- [docs/guides/GUIDE.md](./docs/guides/GUIDE.md) — 手把手构建指南
- [docs/guides/TEXT_STREAMING_GUIDE.md](./docs/guides/TEXT_STREAMING_GUIDE.md) — 转录 / 文本流深入
- [docs/decisions/](./docs/decisions/) — 结构决策背后的 ADR

## 致谢

本项目基于 [AgoraIO-Conversational-AI/agent-quickstart-nextjs](https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs) 构建，感谢上游团队提供的基础 demo。
