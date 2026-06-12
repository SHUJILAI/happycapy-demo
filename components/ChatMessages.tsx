"use client";
import { useEffect, useRef } from "react";
import type { Message } from "@ai-sdk/react";

const FENCE = /```(\w+)?\n?([\s\S]*?)```/g;

// 把正文里的代码块替换成「产物卡片」，正文只留自然语言，代码去右侧工作台预览
function renderContent(text: string) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let last = 0, i = 0, m: RegExpExecArray | null;
  FENCE.lastIndex = 0;
  while ((m = FENCE.exec(text))) {
    if (m.index > last) {
      const t = text.slice(last, m.index);
      if (t.trim()) parts.push(<span key={"t" + i}>{t}</span>);
    }
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
  if (last < text.length) {
    const t = text.slice(last);
    if (t.trim()) parts.push(<span key={"t" + i}>{t}</span>);
  }
  return parts.length ? parts : <span>{text}</span>;
}

export default function ChatMessages({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const last = messages[messages.length - 1];
  const waiting = isLoading && (!last || last.role === "user" || (last.role === "assistant" && !last.content));

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
