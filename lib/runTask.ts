import type { Message } from "ai";
import { uid } from "./reminders";
import type { ApiConfig } from "./config";

type ToolInv = { toolCallId: string; toolName: string; args: unknown; state: string; result?: unknown };

// 在后台调用 /api/chat（与界面同一接口），把流式响应拼成一条完整的 assistant 消息。
// 用于「自动化」定时任务：到点自动跑提示词，结果写回对应会话，全程不依赖界面里的 useChat。
export async function runTaskOnce(history: Message[], config: ApiConfig): Promise<Message> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history, config }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (!res.body) throw new Error("接口无响应内容");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  let reasoning = "";
  let errText = "";
  const toolMap = new Map<string, ToolInv>();
  const toolOrder: string[] = [];

  // AI SDK data stream 协议：每行形如  TYPE:JSON
  const handleLine = (line: string) => {
    const idx = line.indexOf(":");
    if (idx < 0) return;
    const type = line.slice(0, idx);
    let val: unknown;
    try { val = JSON.parse(line.slice(idx + 1)); } catch { val = line.slice(idx + 1); }
    switch (type) {
      case "0": // 文本增量
        if (typeof val === "string") text += val;
        break;
      case "g": // 推理 / 思考过程增量
        if (typeof val === "string") reasoning += val;
        break;
      case "9": { // 工具调用
        const v = val as ToolInv;
        if (v?.toolCallId) {
          toolMap.set(v.toolCallId, { toolCallId: v.toolCallId, toolName: v.toolName, args: v.args, state: "call" });
          toolOrder.push(v.toolCallId);
        }
        break;
      }
      case "a": { // 工具结果
        const v = val as { toolCallId: string; result: unknown };
        const t = v?.toolCallId ? toolMap.get(v.toolCallId) : undefined;
        if (t) { t.result = v.result; t.state = "result"; }
        break;
      }
      case "3": // 错误
        errText += typeof val === "string" ? val : JSON.stringify(val);
        break;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) handleLine(line);
    }
  }
  if (buf.trim()) handleLine(buf.trim());

  if (errText && !text) throw new Error(errText);

  const extra: { reasoning?: string; toolInvocations?: ToolInv[] } = {};
  if (reasoning) extra.reasoning = reasoning;
  const invs = toolOrder.map((id) => toolMap.get(id)).filter(Boolean) as ToolInv[];
  if (invs.length) extra.toolInvocations = invs;

  const msg = {
    id: uid(),
    role: "assistant",
    content: text,
    ...extra,
  } as unknown as Message;
  return msg;
}
