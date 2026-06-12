# Happycapy 中文版 AI Agent

基于 Next.js 14 + Vercel AI SDK 的中文 AI 智能体网页，复刻 Happycapy 界面并支持接入任意 OpenAI 兼容接口。

## 功能

- 流式对话（逐字输出），界面 1:1 中文复刻
- 接入你自己的 API：在「设置」里填 Base URL / API Key / 模型，配置只存在浏览器本地（localStorage），不上传
- 可选 Agent 工具（获取时间 / 计算器），可在设置里开关
- 兼容各类 OpenAI 接口（自动修正 `developer` 角色为 `system`，避免部分网关返回空）

## 本地运行

```bash
npm install
npm run dev   # http://localhost:8080
```

## 部署到 Vercel

1. 在 https://vercel.com 点击 **Add New → Project**
2. 导入本仓库
3. Framework 自动识别为 Next.js，直接 **Deploy** 即可（无需任何环境变量）

部署后打开站点，点左下角「设置」填入你的接口信息即可使用。

## 技术栈

- Next.js 14 (App Router)
- Vercel AI SDK v4 (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`)
- TypeScript + Zod
