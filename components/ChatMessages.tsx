"use client";
import { useEffect, useRef, useState } from "react";
import type { Message } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const FENCE = /```(\w+)?\n?([\s\S]*?)```/g;

// 正文里的代码块 → 替换成「产物卡片」（代码去右侧工作台预览）；其余自然语言用 Markdown 渲染。
function renderContent(text: string) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let last = 0, i = 0, m: RegExpExecArray | null;
  FENCE.lastIndex = 0;
  const pushText = (t: string, key: string) => {
    if (!t.trim()) return;
    parts.push(
      <div className="md" key={key}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{t}</ReactMarkdown>
      </div>
    );
  };
  while ((m = FENCE.exec(text))) {
    if (m.index > last) pushText(text.slice(last, m.index), "t" + i);
    const lang = (m[1] || "code").toLowerCase();
    const isHtml = lang === "html" || /^\s*(<!doctype html|<html[\s>]|<body[\s>])/i.test(m[2] || "");
    parts.push(
      <div className="artifact-chip" key={"c" + i}>
        <span className="ac-ico">{isHtml ? "🖥️" : "📄"}</span>
        <span className="ac-txt">已生成{isHtml ? "页面" : "产物"} · {lang}</span>
        <span className="ac-hint">见右侧工作台 →</span>
      </div>
    );
    last = FENCE.lastIndex; i++;
  }
  if (last < text.length) pushText(text.slice(last), "t" + i);
  return parts.length ? parts : <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown></div>;
}

// 从一条 assistant 消息里取出「思考过程」（推理模型会输出 reasoning）。
function getReasoning(m: Message): string {
  const anyM = m as any;
  if (typeof anyM.reasoning === "string" && anyM.reasoning.trim()) return anyM.reasoning;
  const parts = anyM.parts as any[] | undefined;
  if (Array.isArray(parts)) {
    const r = parts
      .filter((p) => p?.type === "reasoning")
      .map((p) => (typeof p.reasoning === "string" ? p.reasoning : p.text || ""))
      .join("");
    if (r.trim()) return r;
  }
  return "";
}

function Thinking({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"think" + (open ? " open" : "")}>
      <button className="think-head" onClick={() => setOpen((o) => !o)}>
        <span className="think-ico">💭</span>思考过程
        <span className="think-arrow">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="think-body">{text}</div>}
    </div>
  );
}

export default function ChatMessages({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const last = messages[messages.length - 1];
  const waiting = isLoading && (!last || last.role === "user" || (last.role === "assistant" && !last.content && !getReasoning(last)));

  return (
    <div className="chat-scroll">
      <div className="msgs">
        {messages.map((m) =>
          m.role === "user" ? (
            <div className="msg user" key={m.id}>
              <div className="bubble">
                {(() => {
                  const atts = ((m as any).experimental_attachments || []) as { name?: string; contentType?: string; url: string }[];
                  const imgs = atts.filter((a) => a.contentType?.startsWith("image/"));
                  return imgs.length ? (
                    <div className="bubble-imgs">
                      {imgs.map((a, idx) => <img key={idx} src={a.url} alt={a.name || ""} />)}
                    </div>
                  ) : null;
                })()}
                {m.content}
              </div>
            </div>
          ) : (
            <div className="msg assistant" key={m.id}>
              <div className="ava"><img src="/capy-logo.png" alt="" /></div>
              <div className="body">
                <div className="who">Happycapy</div>
                {(() => { const r = getReasoning(m); return r ? <Thinking text={r} /> : null; })()}
                {renderContent(m.content)}
              </div>
            </div>
          )
        )}
        {waiting && (
          <div className="msg assistant">
            <div className="ava"><img src="/capy-logo.png" alt="" /></div>
            <div className="body">
              <div className="who">Happycapy</div>
              <div className="typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
