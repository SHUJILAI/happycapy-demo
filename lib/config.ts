export type ApiConfig = {
  provider: string;   // 厂商预设 id（deepseek / openai / moonshot / openrouter / custom）
  baseURL: string;
  apiKey: string;
  model: string;
  useTools: boolean;
};

const KEY = "capy_api_config";

export const DEFAULT_CONFIG: ApiConfig = {
  provider: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: "",
  model: "deepseek-chat",
  useTools: true,
};

export function loadConfig(): ApiConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(c: ApiConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(c));
}
