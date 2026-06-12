import type { Message } from "ai";

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  messages: Message[];
};

const KEY = "capy_projects";

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveProjects(list: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function newProject(): Project {
  return {
    id: (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2),
    name: "新对话",
    createdAt: Date.now(),
    messages: [],
  };
}

// 根据首条用户消息自动生成项目标题
export function deriveName(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  const text = (first?.content || "").trim().replace(/\s+/g, " ");
  if (!text) return "新对话";
  return text.length > 18 ? text.slice(0, 18) + "…" : text;
}
