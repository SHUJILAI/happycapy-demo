"use client";
import { useRef, useState } from "react";
import { Plus, Puzzle, ChevronDown, ArrowUp, Check, Star, Bars } from "./icons";

const MODELS = [
  { id: "openai/gpt-4.1", label: "GPT-4.1", desc: "适用于复杂任务", kind: "openai" },
  { id: "openai/gpt-5-mini", label: "GPT-5 mini", desc: "快速、性价比高", kind: "openai" },
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", desc: "均衡、长文本强", kind: "openai" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash", desc: "谷歌快速模型", kind: "openai" },
  { id: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro", desc: "DeepSeek 旗舰，推理强", kind: "minimax" },
  { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", desc: "DeepSeek 极速版", kind: "minimax" },
];

const SKILLS = [
  "skill-creator", "find-skills", "frontend-slides", "canvas-design", "generate-image",
  "nano-banana-pro", "ai-video-generation", "pptx", "pdf", "latex-document",
  "data-storytelling", "world-class-carousel", "redbook-creator-publish", "happycapy-feishu",
  "happycapy-social-publisher", "mobile-app-developer", "create-design-system-rules",
  "resume-assistant", "weather", "video-downloader",
];

export default function Composer({
  input, onChange, onSubmit, isLoading, model, onModelChange,
}: {
  input: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  model: string;
  onModelChange: (m: string) => void;
}) {
  const [modelOpen, setModelOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const close = () => { setModelOpen(false); setSkillOpen(false); };
  const curLabel = MODELS.find((m) => m.id === model)?.label ?? model;

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
        <div className="model-sel" onClick={() => { setModelOpen((v) => !v); setSkillOpen(false); }}>
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
            {MODELS.map((m) => (
              <div className="mm-item" key={m.id} onClick={() => { onModelChange(m.id); close(); }}>
                {m.kind === "minimax"
                  ? <Bars className="icon star minimax" style={{ width: 18, height: 18 }} />
                  : <Star className="icon star" style={{ width: 18, height: 18 }} />}
                <div><div className="mt">{m.label}</div><div className="md">{m.desc}</div></div>
                {m.id === model && <Check className="icon check" style={{ width: 16, height: 16 }} />}
              </div>
            ))}
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
