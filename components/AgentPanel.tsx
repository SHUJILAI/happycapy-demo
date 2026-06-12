"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "@ai-sdk/react";

type Artifact = { id: string; lang: string; code: string; isHtml: boolean; title: string };
type Step = { id: string; tool: string; args: any; state: string; result?: any };

const TOOL_LABEL: Record<string, string> = {
  loadSkill: "加载技能", getCurrentTime: "查询时间", calculate: "数值计算", fetchUrl: "读取网页",
};
const FENCE = /```(\w+)?\n?([\s\S]*?)```/g;

function extractArtifacts(messages: Message[]): Artifact[] {
  const out: Artifact[] = [];
  let n = 0;
  for (const m of messages) {
    if (m.role !== "assistant" || !m.content) continue;
    FENCE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = FENCE.exec(m.content))) {
      const lang = (match[1] || "").toLowerCase();
      const code = (match[2] || "").trim();
      if (!code) continue;
      const isHtml = lang === "html" || /^\s*(<!doctype html|<html[\s>]|<body[\s>])/i.test(code);
      n++;
      out.push({
        id: m.id + "-" + n, lang: lang || (isHtml ? "html" : "text"), code, isHtml,
        title: isHtml ? `页面 ${n}` : `${lang || "code"} ${n}`,
      });
    }
  }
  return out;
}

function extractSteps(messages: Message[]): Step[] {
  const out: Step[] = [];
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    const invs = (m as any).toolInvocations as any[] | undefined;
    if (!invs) continue;
    for (const inv of invs) out.push({ id: inv.toolCallId, tool: inv.toolName, args: inv.args, state: inv.state, result: inv.result });
  }
  return out;
}

function pretty(v: any) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

export default function AgentPanel({ messages, isLoading, width }: { messages: Message[]; isLoading: boolean; width?: number }) {
  const artifacts = useMemo(() => extractArtifacts(messages), [messages]);
  const steps = useMemo(() => extractSteps(messages), [messages]);

  const [tab, setTab] = useState<"art" | "steps">("steps");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"preview" | "code">("preview");
  const stepEnd = useRef<HTMLDivElement>(null);

  // 新产物出现：自动切到「产物」并打开最新的，HTML 默认预览
  const lastArtId = artifacts.length ? artifacts[artifacts.length - 1].id : null;
  useEffect(() => {
    if (lastArtId) {
      setActiveId(lastArtId);
      setTab("art");
      const a = artifacts[artifacts.length - 1];
      setView(a.isHtml ? "preview" : "code");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastArtId]);

  useEffect(() => { if (tab === "steps") stepEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [steps.length, isLoading, tab]);

  const active = artifacts.find((a) => a.id === activeId) || artifacts[artifacts.length - 1] || null;
  const running = isLoading;

  return (
    <aside className="agent-panel" style={width ? { width } : undefined}>
      <div className="ap-head">
        <div className="ap-tabs">
          <button className={"ap-tab" + (tab === "art" ? " on" : "")} onClick={() => setTab("art")}>
            产物{artifacts.length > 0 && <span className="ap-count">{artifacts.length}</span>}
          </button>
          <button className={"ap-tab" + (tab === "steps" ? " on" : "")} onClick={() => setTab("steps")}>
            步骤{steps.length > 0 && <span className="ap-count">{steps.length}</span>}
          </button>
        </div>
        <div className={"ap-status" + (running ? " on" : "")}>
          <span className="ap-dot" />{running ? "运行中" : "空闲"}
        </div>
      </div>

      {tab === "art" ? (
        <div className="ap-art">
          {!active ? (
            <div className="ap-empty">
              <div className="ap-empty-emoji">🖥️</div>
              <div className="ap-empty-title">产物画布</div>
              <div className="ap-empty-desc">智能体生成的网页 / 代码会在这里直接打开预览，就像在新窗口里渲染一样。</div>
            </div>
          ) : (
            <>
              <div className="ap-art-bar">
                {artifacts.length > 1 && (
                  <select className="ap-art-sel" value={active.id} onChange={(e) => setActiveId(e.target.value)}>
                    {artifacts.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                )}
                {artifacts.length <= 1 && <span className="ap-art-name">{active.title}</span>}
                <div className="ap-seg">
                  {active.isHtml && (
                    <button className={"seg" + (view === "preview" ? " on" : "")} onClick={() => setView("preview")}>预览</button>
                  )}
                  <button className={"seg" + (view === "code" || !active.isHtml ? " on" : "")} onClick={() => setView("code")}>代码</button>
                </div>
              </div>
              <div className="ap-art-body">
                {active.isHtml && view === "preview" ? (
                  <iframe className="ap-frame" title={active.title} sandbox="allow-scripts allow-same-origin" srcDoc={active.code} />
                ) : (
                  <pre className="ap-source"><code>{active.code}</code></pre>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="ap-body">
          {steps.length === 0 && !running ? (
            <div className="ap-empty">
              <div className="ap-empty-emoji">🛠️</div>
              <div className="ap-empty-title">智能体工作台</div>
              <div className="ap-empty-desc">这里会实时显示每一步动作：调用了什么工具、传入参数、返回结果。过程完全透明。</div>
            </div>
          ) : (
            <div className="ap-timeline">
              {steps.map((s, i) => {
                const done = s.state === "result";
                return (
                  <div className={"ap-step" + (done ? " done" : " running")} key={s.id}>
                    <div className="ap-step-rail"><span className="ap-step-node">{done ? "✓" : i + 1}</span></div>
                    <div className="ap-step-main">
                      <div className="ap-step-name">{TOOL_LABEL[s.tool] || s.tool}<span className="ap-step-tool">{s.tool}</span></div>
                      {s.args != null && <pre className="ap-code">{pretty(s.args)}</pre>}
                      {done && s.result != null && <pre className="ap-code result">{pretty(s.result)}</pre>}
                      {!done && <div className="ap-running-tag">运行中…</div>}
                    </div>
                  </div>
                );
              })}
              {running && (
                <div className="ap-step running">
                  <div className="ap-step-rail"><span className="ap-step-node spin" /></div>
                  <div className="ap-step-main">
                    <div className="ap-step-name">智能体推理中</div>
                    <div className="typing"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={stepEnd} />
            </div>
          )}
        </div>
      )}

      <div className="ap-foot">多步智能体循环：思考 → 调用工具 → 读取结果 → 生成产物</div>
    </aside>
  );
}
