"use client";
import { useRef, useState } from "react";
import { Plus, Puzzle, ChevronDown, ArrowUp, Check, Star } from "./icons";
import type { ProviderModel } from "../lib/providers";

const SKILLS = [
  "skill-creator", "find-skills", "frontend-slides", "canvas-design", "generate-image",
  "nano-banana-pro", "ai-video-generation", "pptx", "pdf", "latex-document",
  "data-storytelling", "world-class-carousel", "redbook-creator-publish", "happycapy-feishu",
  "happycapy-social-publisher", "mobile-app-developer", "create-design-system-rules",
  "resume-assistant", "weather", "video-downloader",
];

export default function Composer({
  input, onChange, onSubmit, isLoading, model, models, onModelChange, onOpenSettings,
}: {
  input: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  model: string;
  models: ProviderModel[];
  onModelChange: (m: string) => void;
  onOpenSettings: () => void;
}) {
  const [modelOpen, setModelOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const close = () => { setModelOpen(false); setSkillOpen(false); };
  const curLabel = models.find((m) => m.id === model)?.label ?? model;

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="composer">
      <textarea
        ref={taRef}
        rows={1}
        value={input}
        placeholder="向 Happycapy 提问"
        onChange={(e) => { onChange(e.target.value); grow(e.target); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && input.trim()) { onSubmit(); if (taRef.current) taRef.current.style.height = "auto"; }
          }
        }}
      />
      <div className="row">
        <div className="c-plus"><Plus style={{ width: 20, height: 20 }} /></div>
        <div className="c-btn" onClick={() => { setSkillOpen((v) => !v); setModelOpen(false); }}>
          <Puzzle style={{ width: 17, height: 17 }} />
          {activeSkill ? `/${activeSkill}` : "技能"}
        </div>
        <div className="spacer" />
        <div className="model-sel" onClick={() => { setModelOpen((v) => !v); setSkillOpen(false); }} title={model}>
          <span>{curLabel}</span>
          <ChevronDown style={{ width: 15, height: 15 }} />
        </div>
        <button className="send" disabled={isLoading || !input.trim()} onClick={onSubmit}>
          <ArrowUp />
        </button>
      </div>

      {modelOpen && (
        <>
          <div className="overlay" onClick={close} />
          <div className="pop model-menu">
            <div className="mm-label">选择模型（来自「设置」里的厂商）</div>
            {models.length === 0 ? (
              <div className="mm-empty">
                当前厂商为「自定义」，模型在设置里填写。
              </div>
            ) : (
              models.map((m) => (
                <div className="mm-item" key={m.id} onClick={() => { onModelChange(m.id); close(); }}>
                  <Star className="icon star" style={{ width: 18, height: 18 }} />
                  <div><div className="mt">{m.label}</div><div className="md">{m.desc}</div></div>
                  {m.id === model && <Check className="icon check" style={{ width: 16, height: 16 }} />}
                </div>
              ))
            )}
            <div className="mm-sep" />
            <div className="mm-foot" onClick={() => { close(); onOpenSettings(); }}>
              切换厂商 / 填写 API Key →
            </div>
          </div>
        </>
      )}

      {skillOpen && (
        <>
          <div className="overlay" onClick={close} />
          <div className="pop skill-menu">
            <div className="sk-head">选择一个技能，或输入 <code>/skill-name</code> 使用多个技能</div>
            <div className="sk-list">
              {SKILLS.map((s) => (
                <div className={"sk-item" + (s === activeSkill ? " active" : "")} key={s}
                  onClick={() => { setActiveSkill(s === activeSkill ? null : s); close(); }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
