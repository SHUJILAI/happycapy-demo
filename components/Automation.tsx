"use client";
import { useState } from "react";
import type { Reminder } from "../lib/reminders";
import { uid } from "../lib/reminders";

function fmt(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("zh-CN", { hour12: false });
}

export default function Automation({
  reminders, onChange, onClose,
}: { reminders: Reminder[]; onChange: (list: Reminder[]) => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"once" | "interval">("once");
  const [at, setAt] = useState("");          // datetime-local 值
  const [intervalMin, setIntervalMin] = useState("30");

  const add = () => {
    const t = title.trim();
    if (!t) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const r: Reminder = type === "once"
      ? { id: uid(), title: t, type, at: at ? new Date(at).getTime() : Date.now() + 60_000, enabled: true }
      : { id: uid(), title: t, type, intervalMin: Math.max(1, parseInt(intervalMin || "30", 10)), enabled: true };
    onChange([r, ...reminders]);
    setTitle(""); setAt("");
  };

  const toggle = (id: string) => onChange(reminders.map((r) => r.id === id ? { ...r, enabled: !r.enabled, done: false } : r));
  const del = (id: string) => onChange(reminders.filter((r) => r.id !== id));

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal auto" onClick={(e) => e.stopPropagation()}>
        <div className="store-top">
          <div>
            <h2>自动化 · 定时提醒</h2>
            <div className="sub">在浏览器本地设置提醒，到点会弹出系统通知与应用内提示（需保持页面打开）。</div>
          </div>
          <button className="x" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <div className="auto-form">
          <input className="auto-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="提醒内容，例如：喝水 / 站起来活动" />
          <div className="auto-row">
            <select value={type} onChange={(e) => setType(e.target.value as "once" | "interval")}>
              <option value="once">一次性</option>
              <option value="interval">循环</option>
            </select>
            {type === "once" ? (
              <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
            ) : (
              <div className="auto-int">
                每 <input type="number" min={1} value={intervalMin} onChange={(e) => setIntervalMin(e.target.value)} /> 分钟
              </div>
            )}
            <button className="btn primary" onClick={add}>添加</button>
          </div>
        </div>

        <div className="auto-list">
          {reminders.length === 0 && <div className="store-empty">还没有提醒，添加一个试试</div>}
          {reminders.map((r) => (
            <div className={"auto-item" + (r.enabled ? "" : " off")} key={r.id}>
              <div className="ai-main">
                <div className="ai-title">{r.title}</div>
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
