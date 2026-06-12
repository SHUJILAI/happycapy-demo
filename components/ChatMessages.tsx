"use client";
import { memo, useEffect, useRef, useState } from "react";
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

// 单条消息。用 memo 包裹：只有「内容变化的那条」会重渲染，
// 不会每来一个 token 就把整段历史的 Markdown 全部重新解析（这是长对话卡死的主因之一）。
const MessageItem = memo(function MessageItem({ m, streaming }: { m: Message; streaming: boolean }) {
  if (m.role === "user") {
    const atts = ((m as any).experimental_attachments || []) as { name?: string; contentType?: string; url: string }[];
    const imgs = atts.filter((a) => a.contentType?.startsWith("image/"));
    return (
      <div className="msg user">
        <div className="bubble">
          {imgs.length ? (
            <div className="bubble-imgs">
              {imgs.map((a, idx) => <img key={idx} src={a.url} alt={a.name || ""} />)}
            </div>
          ) : null}
          {m.content}
        </div>
      </div>
    );
  }
  const r = getReasoning(m);
  return (
    <div className="msg assistant">
      <div className="ava"><img src="/capy-logo.png" alt="" /></div>
      <div className="body">
        <div className="who">Happycapy</div>
        {r ? <Thinking text={r} /> : null}
        {streaming
          // 流式输出中：用纯文本显示（开销极低）。否则长代码每个 token 都重新走一遍
          // Markdown 解析，O(n²) 直接卡死。等这条回复结束后再渲染富文本/产物卡片。
          ? <div className="stream-text">{m.content}</div>
          : renderContent(m.content)}
      </div>
    </div>
  );
});

export default function ChatMessages({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  // 流式时频繁滚动用 "auto"，避免 smooth 动画叠加造成卡顿。
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "auto" }); }, [messages]);

  const last = messages[messages.length - 1];
  const lastId = last?.id;
  const waiting = isLoading && (!last || last.role === "user" || (last.role === "assistant" && !last.content && !getReasoning(last)));

  return (
    <div className="chat-scroll">
      <div className="msgs">
        {messages.map((m) => (
          <MessageItem
            key={m.id}
            m={m}
            streaming={isLoading && m.role === "assistant" && m.id === lastId}
          />
        ))}
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
