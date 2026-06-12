export type Reminder = {
  id: string;
  title: string;
  type: "once" | "interval";
  at?: number;          // once: 触发时间戳(ms)
  intervalMin?: number; // interval: 间隔分钟
  enabled: boolean;
  lastFired?: number;   // interval: 上次触发时间戳
  done?: boolean;       // once: 是否已触发
  // 定时任务：到点自动把 prompt 发进 projectId 指定的会话
  projectId?: string;   // 绑定的目标会话（项目）id
  prompt?: string;      // 每次唤醒时自动发送的提示词
};

const KEY = "capy_reminders";

export function loadReminders(): Reminder[] {
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

export function saveReminders(list: Reminder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function uid(): string {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
}

// 返回当前应触发的提醒，并给出更新后的列表（标记 done / lastFired）
export function dueReminders(list: Reminder[], now = Date.now()): { fired: Reminder[]; next: Reminder[] } {
  const fired: Reminder[] = [];
  const next = list.map((r) => {
    if (!r.enabled) return r;
    if (r.type === "once" && r.at && !r.done && now >= r.at) {
      fired.push(r);
      return { ...r, done: true };
    }
    if (r.type === "interval" && r.intervalMin) {
      const base = r.lastFired ?? r.at ?? now;
      if (!r.lastFired) {
        // 初次：从现在开始计时，不立即触发
        return { ...r, lastFired: now };
      }
      if (now - base >= r.intervalMin * 60_000) {
        fired.push(r);
        return { ...r, lastFired: now };
      }
    }
    return r;
  });
  return { fired, next };
}
