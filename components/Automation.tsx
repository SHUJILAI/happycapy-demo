"use client";
import { useState } from "react";
import type { Reminder } from "../lib/reminders";
import { uid } from "../lib/reminders";

function fmt(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("zh-CN", { hour12: false });
}

type ProjItem = { id: string; name: string };

export default function Automation({
  reminders, projects, onChange, onClose,
}: {
  reminders: Reminder[];
  projects: ProjItem[];
  onChange: (list: Reminder[]) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<"once" | "interval">("interval");
  const [at, setAt] = useState("");          // datetime-local 值
  const [intervalMin, setIntervalMin] = useState("60");

  const projName = (id?: string) => projects.find((p) => p.id === id)?.name ?? "（会话已删除）";
  const noProject = projects.length === 0;

  const add = () => {
    const p = prompt.trim();
    if (!p) return;
    if (!projectId) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const name = title.trim() || (p.length > 16 ? p.slice(0, 16) + "…" : p);
    const base = { id: uid(), title: name, projectId, prompt: p, enabled: true } as const;
    const r: Reminder = type === "once"
      ? { ...base, type, at: at ? new Date(at).getTime() : Date.now() + 60_000 }
      : { ...base, type, intervalMin: Math.max(1, parseInt(intervalMin || "60", 10)) };
    onChange([r, ...reminders]);
    setTitle(""); setPrompt(""); setAt("");
  };

  const toggle = (id: string) => onChange(reminders.map((r) => r.id === id ? { ...r, enabled: !r.enabled, done: false } : r));
  const del = (id: string) => onChange(reminders.filter((r) => r.id !== id));

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal auto" onClick={(e) => e.stopPropagation()}>
        <div className="store-top">
          <div>
            <h2>自动化 · 定时任务</h2>
            <div className="sub">给某个会话设定时间，到点 Capy 会自动把你写好的提示词发进去并跑起来，结果直接存进那个会话。需保持本页面打开。</div>
          </div>
          <button className="x" onClick={onClose} aria-label="关闭">×</button>
        </div>

        {noProject ? (
          <div className="banner" style={{ margin: "0 0 16px" }}>
            还没有任何会话。请先在左侧「新建项目」开一个会话，再来这里给它设定时任务。
          </div>
        ) : (
          <div className="auto-form">
            <textarea
              className="auto-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="每次唤醒时自动发送的提示词，例如：总结今天的科技新闻并做成网页 / 帮我想一句今日鼓励语"
            />
            <input
              className="auto-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="任务名称（选填，不填则自动用提示词开头）"
            />
            <div className="auto-row">
              <label className="auto-field">
                发送到
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <select value={type} onChange={(e) => setType(e.target.value as "once" | "interval")}>
                <option value="interval">循环</option>
                <option value="once">一次性</option>
              </select>
              {type === "once" ? (
                <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
              ) : (
                <div className="auto-int">
                  每 <input type="number" min={1} value={intervalMin} onChange={(e) => setIntervalMin(e.target.value)} /> 分钟
                </div>
              )}
              <button className="btn primary" onClick={add} disabled={!prompt.trim() || !projectId}>添加</button>
            </div>
          </div>
        )}

        <div className="auto-list">
          {reminders.length === 0 && <div className="store-empty">还没有定时任务，添加一个试试</div>}
          {reminders.map((r) => (
            <div className={"auto-item" + (r.enabled ? "" : " off")} key={r.id}>
              <div className="ai-main">
                <div className="ai-title">{r.title}</div>
                {r.prompt && (
                  <div className="ai-prompt">→ 发送到「{projName(r.projectId)}」：{r.prompt}</div>
                )}
                <div className="ai-meta">
                  {r.type === "once"
                    ? `一次性 · ${fmt(r.at)}${r.done ? " · 已触发" : ""}`
                    : `循环 · 每 ${r.intervalMin} 分钟${r.lastFired ? " · 上次 " + fmt(r.lastFired) : ""}`}
                </div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={r.enabled} onChange={() => toggle(r.id)} />
                <span />
              </label>
              <button className="ai-del" onClick={() => del(r.id)} aria-label="删除">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
