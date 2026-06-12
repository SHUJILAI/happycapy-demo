"use client";
import { useEffect, useRef } from "react";
import type { Message } from "@ai-sdk/react";

function ToolBadge({ inv }: { inv: any }) {
  const args = inv.args ? JSON.stringify(inv.args) : "";
  const done = inv.state === "result";
  return (
    <div className="tool">
      {done ? "已调用工具" : "正在调用工具"} · {inv.toolName}({args})
      {done && inv.result != null && (
        <>{"\n→ " + (typeof inv.result === "string" ? inv.result : JSON.stringify(inv.result))}</>
      )}
    </div>
  );
}

export default function ChatMessages({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const last = messages[messages.length - 1];
  const waiting = isLoading && (!last || last.role === "user" || (last.role === "assistant" && !last.content));

  return (
    <div className="chat-scroll">
      <div className="msgs">
        {messages.map((m) => (
          <div className={"msg " + m.role} key={m.id}>
            <div className="ava">
              {m.role === "user" ? "我" : <img src="/capy-logo.png" alt="" />}
            </div>
            <div className="body">
              <div className="who">{m.role === "user" ? "你" : "Happycapy"}</div>
              {m.toolInvocations?.map((inv: any) => <ToolBadge inv={inv} key={inv.toolCallId} />)}
              {m.content}
            </div>
          </div>
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
