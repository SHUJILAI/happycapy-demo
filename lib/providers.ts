export type ProviderModel = { id: string; label: string; desc: string };
export type Provider = {
  id: string;
  name: string;
  baseURL: string;
  keyHint: string;       // 申请密钥的提示
  keyPlaceholder: string;
  models: ProviderModel[];
  custom?: boolean;       // 自定义：域名/模型需手填
};

export const PROVIDERS: Provider[] = [
  {
    id: "deepseek",
    name: "DeepSeek（深度求索·官网）",
    baseURL: "https://api.deepseek.com/v1",
    keyHint: "在 platform.deepseek.com 「API keys」里创建，sk- 开头。deepseek-chat 永远指向最新版（含 V4）。",
    keyPlaceholder: "sk-...",
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat（最新 V4）", desc: "官方滚动别名，自动用最新对话模型" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner（最新推理）", desc: "深度思考，擅长数学 / 代码 / 逻辑" },
    ],
  },
  {
    id: "minimax",
    name: "MiniMax（多模态·官网）",
    baseURL: "https://api.minimaxi.com/v1",
    keyHint: "在 platform.minimaxi.com 控制台创建密钥。具体最新型号可在下方「自定义模型 ID」里精确填写。",
    keyPlaceholder: "粘贴 MiniMax API Key",
    models: [
      { id: "MiniMax-Text-01", label: "MiniMax-Text-01", desc: "长上下文文本模型" },
      { id: "abab6.5s-chat", label: "abab6.5s-chat", desc: "通用对话" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI（官网）",
    baseURL: "https://api.openai.com/v1",
    keyHint: "在 platform.openai.com 「API keys」里创建，sk- 开头。",
    keyPlaceholder: "sk-...",
    models: [
      { id: "gpt-4o", label: "GPT-4o（最新旗舰）", desc: "多模态、通用最强" },
      { id: "gpt-4o-mini", label: "GPT-4o mini", desc: "便宜、快，日常足够用" },
      { id: "gpt-4.1", label: "GPT-4.1", desc: "适合复杂任务" },
    ],
  },
  {
    id: "moonshot",
    name: "Moonshot / Kimi（月之暗面·官网）",
    baseURL: "https://api.moonshot.cn/v1",
    keyHint: "在 platform.moonshot.cn 「API Key 管理」里创建。",
    keyPlaceholder: "sk-...",
    models: [
      { id: "moonshot-v1-128k", label: "Moonshot v1 128K", desc: "超长上下文" },
      { id: "moonshot-v1-32k", label: "Moonshot v1 32K", desc: "中等上下文" },
      { id: "moonshot-v1-8k", label: "Moonshot v1 8K", desc: "短上下文，便宜" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter（聚合多家最新模型）",
    baseURL: "https://openrouter.ai/api/v1",
    keyHint: "在 openrouter.ai 「Keys」里创建，sk-or- 开头。想用哪个最新型号可在下方自定义填写。",
    keyPlaceholder: "sk-or-...",
    models: [
      { id: "deepseek/deepseek-chat", label: "DeepSeek Chat（最新）", desc: "经 OpenRouter 转发" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", desc: "经 OpenRouter 转发" },
      { id: "openai/gpt-4o", label: "GPT-4o", desc: "经 OpenRouter 转发" },
    ],
  },
  {
    id: "custom",
    name: "自定义（其它 OpenAI 兼容接口）",
    baseURL: "",
    keyHint: "任意 OpenAI 兼容端点，自行填写域名与模型 ID。",
    keyPlaceholder: "sk-...",
    models: [],
    custom: true,
  },
];

export function findProvider(id: string): Provider {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

// 依据已保存的 baseURL 反查属于哪个内置厂商（用于旧配置兼容 / 下拉回显）
export function providerByBaseURL(baseURL: string): Provider | null {
  const norm = (s: string) => s.replace(/\/+$/, "");
  return PROVIDERS.find((p) => !p.custom && norm(p.baseURL) === norm(baseURL)) ?? null;
}
