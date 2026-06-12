"use client";
import { useRef, useState } from "react";
import { Plus, Puzzle, ChevronDown, ArrowUp, Check, Star, ImageIcon, FileText, X } from "./icons";
import type { ProviderModel } from "../lib/providers";
import { SKILLS } from "../lib/skills";
import type { Attachment } from "../lib/attachments";
import { humanSize } from "../lib/attachments";

export default function Composer({
  input, onChange, onSubmit, isLoading, model, models, onModelChange, onOpenSettings,
  activeSkill, onSkillChange, attachments, parsing = 0, busy = false, busyText,
  onAddFiles, onRemoveAttachment,
}: {
  input: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  model: string;
  models: ProviderModel[];
  onModelChange: (m: string) => void;
  onOpenSettings: () => void;
  activeSkill: string | null;
  onSkillChange: (id: string | null) => void;
  attachments: Attachment[];
  parsing?: number;
  busy?: boolean;
  busyText?: string;
  onAddFiles: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
}) {
  const [modelOpen, setModelOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const close = () => { setModelOpen(false); setSkillOpen(false); };
  const curLabel = models.find((m) => m.id === model)?.label ?? model;
  const canSend = !isLoading && !busy && parsing === 0 && (input.trim().length > 0 || attachments.length > 0);

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const pickFiles = (list: FileList | null) => {
    if (!list || !list.length) return;
    onAddFiles(Array.from(list));
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData?.files || []);
    if (files.length) { e.preventDefault(); onAddFiles(files); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) onAddFiles(files);
  };

  return (
    <div
      className={"composer" + (dragOver ? " drag" : "")}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
      onDrop={onDrop}
    >
      {activeSkill && (
        <div className="skill-chip-bar">
          <span className="skill-chip">
            <Puzzle style={{ width: 14, height: 14 }} />
            已挂载技能：<b>/{activeSkill}</b>
            <span className="skill-chip-x" onClick={() => onSkillChange(null)} title="卸载技能">×</span>
          </span>
          <span className="skill-chip-tip">本次提问会自动套用该技能的官方说明书</span>
        </div>
      )}

      {busy && busyText && (
        <div className="longdoc-bar">
          <span className="spinner" />
          <span>{busyText}</span>
          <span className="longdoc-tip">分段通读会多次调用模型、消耗 token，请耐心等待</span>
        </div>
      )}

      {(attachments.length > 0 || parsing > 0) && (
        <div className="attach-bar">
          {parsing > 0 && (
            <div className="attach parsing">
              <span className="spinner" />
              <span className="attach-meta">
                <span className="attach-name">解析中…</span>
                <span className="attach-size">{parsing} 个文件，大文件需稍候</span>
              </span>
            </div>
          )}
          {attachments.map((a) => (
            <div className={"attach" + (a.kind === "image" ? " img" : "")} key={a.id} title={a.name}>
              {a.kind === "image" && a.url ? (
                <img src={a.url} alt={a.name} />
              ) : (
                <span className="attach-ico">{a.kind === "text" ? <FileText style={{ width: 16, height: 16 }} /> : <ImageIcon style={{ width: 16, height: 16 }} />}</span>
              )}
              {a.kind !== "image" && (
                <span className="attach-meta">
                  <span className="attach-name">{a.name}</span>
                  <span className="attach-size">{humanSize(a.size)}{a.note ? " · " + a.note : (a.kind === "other" ? " · 无法读取内容" : "")}</span>
                </span>
              )}
              <span className="attach-x" onClick={() => onRemoveAttachment(a.id)} title="移除"><X style={{ width: 12, height: 12 }} /></span>
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={taRef}
        rows={1}
        value={input}
        placeholder={activeSkill ? `已挂载 /${activeSkill}，直接说出你的想法即可` : "向 Happycapy 提问，可粘贴 / 拖拽图片、文件"}
        onPaste={onPaste}
        onChange={(e) => { onChange(e.target.value); grow(e.target); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) { onSubmit(); if (taRef.current) taRef.current.style.height = "auto"; }
          }
        }}
      />
      <div className="row">
        <input ref={fileRef} type="file" multiple hidden
          onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }} />
        <div className="c-plus" onClick={() => fileRef.current?.click()} title="上传图片 / 文件">
          <Plus style={{ width: 20, height: 20 }} />
        </div>
        <div className={"c-btn" + (activeSkill ? " on" : "")} onClick={() => { setSkillOpen((v) => !v); setModelOpen(false); }}>
          <Puzzle style={{ width: 17, height: 17 }} />
          {activeSkill ? `/${activeSkill}` : "技能"}
        </div>
        <div className="spacer" />
        <div className="model-sel" onClick={() => { setModelOpen((v) => !v); setSkillOpen(false); }} title={model}>
          <span>{curLabel}</span>
          <ChevronDown style={{ width: 15, height: 15 }} />
        </div>
        <button className="send" disabled={!canSend} onClick={onSubmit}>
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
                  <div><div className="mt">{m.label}{m.tag && <span className="mtag">{m.tag}</span>}</div><div className="mdsc">{m.desc}</div><div className="mid">实际调用：{m.id}</div></div>
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
            <div className="sk-head">挂载一个技能：选中后，它的官方说明书会自动作为本次提问的「行动指南」。也可以不挂，智能体会按需自动调用。</div>
            <div className="sk-list">
              {activeSkill && (
                <div className="sk-item sk-clear" onClick={() => { onSkillChange(null); close(); }}>
                  ✕ 卸载当前技能 /{activeSkill}
                </div>
              )}
              {SKILLS.map((s) => (
                <div className={"sk-item" + (s.name === activeSkill ? " active" : "")} key={s.name}
                  onClick={() => { onSkillChange(s.name === activeSkill ? null : s.name); close(); }}>
                  <div className="sk-item-t">{s.name}{s.name === activeSkill && <Check className="icon check" style={{ width: 14, height: 14 }} />}</div>
                  <div className="sk-item-d">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
