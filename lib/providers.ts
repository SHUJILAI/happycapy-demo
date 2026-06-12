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
    keyHint: "在 platform.deepseek.com 「API keys」里创建，sk- 开头。",
    keyPlaceholder: "sk-...",
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat（V3）", desc: "通用对话，速度快、性价比高" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner（R1）", desc: "深度推理，擅长数学 / 代码 / 逻辑" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI（官网）",
    baseURL: "https://api.openai.com/v1",
    keyHint: "在 platform.openai.com 「API keys」里创建，sk- 开头。",
    keyPlaceholder: "sk-...",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini", desc: "便宜、快，日常足够用" },
      { id: "gpt-4o", label: "GPT-4o", desc: "更强的通用模型" },
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
      { id: "moonshot-v1-8k", label: "Moonshot v1 8K", desc: "短上下文，便宜" },
      { id: "moonshot-v1-32k", label: "Moonshot v1 32K", desc: "中等上下文" },
      { id: "moonshot-v1-128k", label: "Moonshot v1 128K", desc: "超长上下文" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter（聚合多家模型）",
    baseURL: "https://openrouter.ai/api/v1",
    keyHint: "在 openrouter.ai 「Keys」里创建，sk-or- 开头。",
    keyPlaceholder: "sk-or-...",
    models: [
      { id: "deepseek/deepseek-chat", label: "DeepSeek Chat", desc: "经 OpenRouter 转发" },
      { id: "openai/gpt-4o-mini", label: "GPT-4o mini", desc: "经 OpenRouter 转发" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", desc: "经 OpenRouter 转发" },
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
