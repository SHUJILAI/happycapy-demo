export type ApiConfig = {
  provider: string;   // 厂商预设 id（deepseek / google / openai / moonshot / openrouter / custom）
  baseURL: string;
  apiKey: string;     // 当前生效厂商的 key（真正发给后端用的那一个）
  apiKeys: Record<string, string>; // 各厂商各自保存的 key，切厂商时各显其值
  model: string;
  useTools: boolean;
};

const KEY = "capy_api_config";

export const DEFAULT_CONFIG: ApiConfig = {
  provider: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: "",
  apiKeys: {},
  model: "deepseek-v4-pro",
  useTools: true,
};

export function loadConfig(): ApiConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const cfg: ApiConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    if (!cfg.apiKeys || typeof cfg.apiKeys !== "object") cfg.apiKeys = {};
    // 旧配置迁移：把单一 apiKey 归入当前厂商的独立槽位
    if (cfg.apiKey && !cfg.apiKeys[cfg.provider]) cfg.apiKeys[cfg.provider] = cfg.apiKey;
    return cfg;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(c: ApiConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(c));
}
