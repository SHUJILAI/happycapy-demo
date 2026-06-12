"use client";
import { useEffect, useRef } from "react";
import type { Message } from "@ai-sdk/react";

type Step = {
  id: string;
  tool: string;
  args: any;
  state: string;       // "call" | "partial-call" | "result"
  result?: any;
};

const TOOL_LABEL: Record<string, string> = {
  getCurrentTime: "查询时间",
  calculate: "数值计算",
  fetchUrl: "读取网页",
};

function pretty(v: any) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

export default function AgentPanel({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);

  // 汇总整段对话里所有工具调用，形成一条「智能体动作」时间线
  const steps: Step[] = [];
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    const invs = (m as any).toolInvocations as any[] | undefined;
    if (!invs) continue;
    for (const inv of invs) {
      steps.push({ id: inv.toolCallId, tool: inv.toolName, args: inv.args, state: inv.state, result: inv.result });
    }
  }

  const running = isLoading;
  const active = running && steps.some((s) => s.state !== "result");

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  return (
    <aside className="agent-panel">
      <div className="ap-head">
        <div className="ap-title">工作台</div>
        <div className={"ap-status" + (running ? " on" : "")}>
          <span className="ap-dot" />
          {running ? (active ? "调用工具中" : "思考中") : "空闲"}
        </div>
      </div>

      <div className="ap-body">
        {steps.length === 0 && !running ? (
          <div className="ap-empty">
            <div className="ap-empty-emoji">🛠️</div>
            <div className="ap-empty-title">智能体工作台</div>
            <div className="ap-empty-desc">
              这里会实时显示智能体的每一步动作：调用了什么工具、传入了什么参数、返回了什么结果。
              和 Claude Code / Codex 一样，过程对你完全透明。
            </div>
          </div>
        ) : (
          <div className="ap-timeline">
            {steps.map((s, i) => {
              const done = s.state === "result";
              return (
                <div className={"ap-step" + (done ? " done" : " running")} key={s.id}>
                  <div className="ap-step-rail">
                    <span className="ap-step-node">{done ? "✓" : i + 1}</span>
                  </div>
                  <div className="ap-step-main">
                    <div className="ap-step-name">
                      {TOOL_LABEL[s.tool] || s.tool}
                      <span className="ap-step-tool">{s.tool}</span>
                    </div>
                    {s.args != null && (
                      <pre className="ap-code">{pretty(s.args)}</pre>
                    )}
                    {done && s.result != null && (
                      <pre className="ap-code result">{pretty(s.result)}</pre>
                    )}
                    {!done && <div className="ap-running-tag">运行中…</div>}
                  </div>
                </div>
              );
            })}
            {running && (
              <div className="ap-step running thinking">
                <div className="ap-step-rail"><span className="ap-step-node spin" /></div>
                <div className="ap-step-main">
                  <div className="ap-step-name">智能体推理中</div>
                  <div className="typing"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="ap-foot">底层为多步智能体循环（思考 → 调用工具 → 读取结果 → 继续）</div>
    </aside>
  );
}
