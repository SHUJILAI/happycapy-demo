export type ProviderModel = { id: string; label: string; desc: string; tag?: string };
export type Provider = {
  id: string;
  name: string;
  baseURL: string;
  keyHint: string;       // 申请密钥的提示
  keyPlaceholder: string;
  models: ProviderModel[];
  custom?: boolean;       // 自定义：域名/模型需手填
};

// tag 是给模型贴的「档位」标签，让小白一眼看懂：快速 / 强大 / 推理 / 看图
export const PROVIDERS: Provider[] = [
  {
    id: "deepseek",
    name: "DeepSeek（深度求索·官网）",
    baseURL: "https://api.deepseek.com/v1",
    keyHint: "在 platform.deepseek.com 「API keys」里创建，sk- 开头。deepseek-chat 永远指向最新版（含 V4）。",
    keyPlaceholder: "sk-...",
    models: [
      { id: "deepseek-chat", label: "DeepSeek V4", desc: "通用对话旗舰，日常首选（自动用最新版）", tag: "强大" },
      { id: "deepseek-reasoner", label: "DeepSeek R1 推理", desc: "会先思考再回答，擅长数学 / 代码 / 逻辑", tag: "推理" },
    ],
  },
  {
    id: "google",
    name: "Google Gemini（OpenAI 兼容接口）",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    keyHint: "在 aistudio.google.com「Get API key」里创建。Pro 更强、Flash 更快更省。三者都能看图。",
    keyPlaceholder: "AIza...",
    models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "最强档，复杂推理 / 长文 / 看图", tag: "强大·看图" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "快且便宜，日常够用，能看图", tag: "快速·看图" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", desc: "更省钱的轻量版，能看图", tag: "快速·看图" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI（官网）",
    baseURL: "https://api.openai.com/v1",
    keyHint: "在 platform.openai.com 「API keys」里创建，sk- 开头。",
    keyPlaceholder: "sk-...",
    models: [
      { id: "gpt-4o", label: "GPT-4o", desc: "多模态旗舰，通用最强，能看图", tag: "强大·看图" },
      { id: "gpt-4o-mini", label: "GPT-4o mini", desc: "快、便宜，日常足够用，能看图", tag: "快速·看图" },
      { id: "gpt-4.1", label: "GPT-4.1", desc: "适合复杂、长上下文任务", tag: "强大" },
    ],
  },
  {
    id: "minimax",
    name: "MiniMax（多模态·官网）",
    baseURL: "https://api.minimaxi.com/v1",
    keyHint: "在 platform.minimaxi.com 控制台创建密钥。具体最新型号可在下方「自定义模型 ID」里精确填写。",
    keyPlaceholder: "粘贴 MiniMax API Key",
    models: [
      { id: "MiniMax-Text-01", label: "MiniMax-Text-01", desc: "长上下文文本模型", tag: "强大" },
      { id: "abab6.5s-chat", label: "abab6.5s-chat", desc: "通用对话，响应快", tag: "快速" },
    ],
  },
  {
    id: "moonshot",
    name: "Moonshot / Kimi（月之暗面·官网）",
    baseURL: "https://api.moonshot.cn/v1",
    keyHint: "在 platform.moonshot.cn 「API Key 管理」里创建。",
    keyPlaceholder: "sk-...",
    models: [
      { id: "moonshot-v1-128k", label: "Kimi v1 128K", desc: "超长上下文，适合长文档", tag: "强大" },
      { id: "moonshot-v1-32k", label: "Kimi v1 32K", desc: "中等上下文，性价比高", tag: "均衡" },
      { id: "moonshot-v1-8k", label: "Kimi v1 8K", desc: "短上下文，最便宜最快", tag: "快速" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter（聚合多家最新模型）",
    baseURL: "https://openrouter.ai/api/v1",
    keyHint: "在 openrouter.ai 「Keys」里创建，sk-or- 开头。想用哪个最新型号可在下方自定义填写。",
    keyPlaceholder: "sk-or-...",
    models: [
      { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "经 OpenRouter 转发，能看图", tag: "强大·看图" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", desc: "经 OpenRouter 转发，能看图", tag: "强大·看图" },
      { id: "openai/gpt-4o", label: "GPT-4o", desc: "经 OpenRouter 转发，能看图", tag: "强大·看图" },
      { id: "deepseek/deepseek-chat", label: "DeepSeek V4", desc: "经 OpenRouter 转发", tag: "强大" },
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

// 粗略判断某个模型是否「可能支持看图」（多模态/视觉）。用于发图前给用户友好提示，不做硬性拦截。
export function modelLikelyVision(model: string): boolean {
  const m = (model || "").toLowerCase();
  return /(gpt-4o|gpt-4\.1|gpt-4-vision|vision|\bvl\b|-vl|claude-3|claude-opus|claude-sonnet|gemini|qwen-vl|llava|pixtral|grok-vision|minimax-vl)/.test(m);
}

// 粗略判断某个模型是否「推理/思考型」（会输出思考过程）。
export function modelIsReasoning(model: string): boolean {
  const m = (model || "").toLowerCase();
  return /(reasoner|-r1|\br1\b|reasoning|o1|o3|o4|thinking|qwq)/.test(m);
}

export function findProvider(id: string): Provider {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

// 依据已保存的 baseURL 反查属于哪个内置厂商（用于旧配置兼容 / 下拉回显）
export function providerByBaseURL(baseURL: string): Provider | null {
  const norm = (s: string) => s.replace(/\/+$/, "");
  return PROVIDERS.find((p) => !p.custom && norm(p.baseURL) === norm(baseURL)) ?? null;
}
