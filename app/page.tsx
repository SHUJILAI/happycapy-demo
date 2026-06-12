"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import Sidebar from "../components/Sidebar";
import Composer from "../components/Composer";
import ChatMessages from "../components/ChatMessages";
import SettingsModal from "../components/SettingsModal";
import SkillStore from "../components/SkillStore";
import Automation from "../components/Automation";
import AgentPanel from "../components/AgentPanel";
import { loadConfig, saveConfig, DEFAULT_CONFIG, type ApiConfig } from "../lib/config";
import { loadProjects, saveProjects, newProject, deriveName, type Project } from "../lib/projects";
import { loadReminders, saveReminders, dueReminders, type Reminder } from "../lib/reminders";
import { Globe, Mail, Search, Puzzle, Slides } from "../components/icons";

const CHIPS = [
  { icon: <span style={{ color: "#10a37f" }}>◍</span>, label: "GPT Image 2", prompt: "用 GPT Image 2 帮我生成一张图片，主题是" },
  { icon: <span>🍌</span>, label: "Nano Banana 2", prompt: "用 Nano Banana 2 帮我编辑/生成图片：" },
  { icon: <Puzzle />, label: "创建技能", prompt: "帮我创建一个新的技能（skill），用途是：" },
  { icon: <Slides />, label: "创建幻灯片", prompt: "帮我制作一份幻灯片，主题是：" },
  { icon: <Globe />, label: "前端设计", prompt: "帮我设计一个前端页面：" },
  { icon: <Mail />, label: "Capymail 技能", prompt: "帮我用 Capymail 发一封邮件：" },
  { icon: <Search />, label: "研究技能", prompt: "帮我研究并总结一个主题：" },
];

export default function Page() {
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);
  const [greeting, setGreeting] = useState("你好");

  const [showSettings, setShowSettings] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showAuto, setShowAuto] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const remindersRef = useRef<Reminder[]>([]);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);

  const { messages, input, setInput, append, isLoading, error, setMessages } = useChat({
    api: "/api/chat",
    body: { config },
  });

  // 初始化：读取本地配置 / 项目 / 提醒
  useEffect(() => {
    setConfig(loadConfig());
    const ps = loadProjects();
    setProjects(ps);
    if (ps.length) { setActiveId(ps[0].id); setMessages(ps[0].messages); }
    const rs = loadReminders();
    setReminders(rs); remindersRef.current = rs;
    setReady(true);
    const h = new Date().getHours();
    setGreeting(h < 6 ? "夜深了" : h < 12 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好");
    if (typeof Notification !== "undefined" && Notification.permission === "default" && rs.length) {
      Notification.requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 持久化当前项目的对话
  useEffect(() => {
    if (!ready || !activeId) return;
    setProjects((prev) => {
      const next = prev.map((p) =>
        p.id === activeId
          ? { ...p, messages, name: p.name === "新对话" ? deriveName(messages) : p.name }
          : p
      );
      saveProjects(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, ready, activeId]);

  // 定时检查提醒
  useEffect(() => {
    const fire = (r: Reminder) => {
      const text = `提醒：${r.title}`;
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try { new Notification("Happycapy 提醒", { body: r.title }); } catch { /* ignore */ }
      }
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, text }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000);
    };
    const tick = () => {
      const { fired, next } = dueReminders(remindersRef.current);
      if (fired.length) {
        fired.forEach(fire);
        remindersRef.current = next;
        setReminders(next);
        saveReminders(next);
      } else if (next.some((r, i) => r !== remindersRef.current[i])) {
        // 初次为 interval 写入 lastFired
        remindersRef.current = next;
        setReminders(next);
        saveReminders(next);
      }
    };
    const t = setInterval(tick, 20_000);
    tick();
    return () => clearInterval(t);
  }, []);

  const updateConfig = (c: ApiConfig) => { setConfig(c); saveConfig(c); };
  const updateReminders = (list: Reminder[]) => { setReminders(list); remindersRef.current = list; saveReminders(list); };

  const ensureProject = (): string => {
    if (activeId) return activeId;
    const p = newProject();
    const next = [p, ...projects];
    setProjects(next); saveProjects(next);
    setActiveId(p.id);
    return p.id;
  };

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    if (!config.apiKey) { setShowSettings(true); return; }
    ensureProject();
    setInput("");
    append({ role: "user", content }, { body: { config } });
  };

  const newChat = () => {
    const p = newProject();
    const next = [p, ...projects];
    setProjects(next); saveProjects(next);
    setActiveId(p.id);
    setMessages([]); setInput("");
  };

  const selectProject = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setActiveId(id);
    setMessages(p.messages);
    setInput("");
  };

  const deleteProject = (id: string) => {
    const next = projects.filter((p) => p.id !== id);
    setProjects(next); saveProjects(next);
    if (id === activeId) {
      if (next.length) { setActiveId(next[0].id); setMessages(next[0].messages); }
      else { setActiveId(null); setMessages([]); }
    }
  };

  const useSkill = (prompt: string) => {
    setInput(prompt);
    setShowStore(false);
  };

  const hasChat = messages.length > 0;

  return (
    <div className="app">
      <Sidebar
        onNewChat={newChat}
        onOpenSettings={() => setShowSettings(true)}
        onOpenStore={() => setShowStore(true)}
        onOpenAutomation={() => setShowAuto(true)}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        activeId={activeId}
        onSelect={selectProject}
        onDelete={deleteProject}
      />

      <main className="main">
        {!hasChat ? (
          <div className="home">
            <div className="hero">
              <img className="mascot" src="/capy-logo.png" alt="capybara" />
              <h1 className="greet">{greeting}，欢迎使用 Happycapy</h1>
              <Composer
                input={input}
                onChange={setInput}
                onSubmit={() => send()}
                isLoading={isLoading}
                model={config.model}
                onModelChange={(m) => updateConfig({ ...config, model: m })}
              />
              {ready && !config.apiKey && (
                <div className="banner" style={{ marginTop: 18 }}>
                  尚未配置 API。<a onClick={() => setShowSettings(true)}>点此填写你的 OpenAI 兼容接口</a>，即可开始真实对话。
                </div>
              )}
              <div className="chips">
                {CHIPS.map((c) => (
                  <div className="chip" key={c.label} onClick={() => setInput(c.prompt)}>
                    {c.icon}{c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-wrap">
            <ChatMessages messages={messages} isLoading={isLoading} />
            <div className="chat-foot">
              <div className="inner">
                {error && (
                  <div className="banner">出错了：{error.message} <a onClick={() => setShowSettings(true)}>检查设置</a></div>
                )}
                <Composer
                  input={input}
                  onChange={setInput}
                  onSubmit={() => send()}
                  isLoading={isLoading}
                  model={config.model}
                  onModelChange={(m) => updateConfig({ ...config, model: m })}
                />
                <div className="hint">Happycapy 可能会出错，请核查重要信息。</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {hasChat && <AgentPanel messages={messages} isLoading={isLoading} />}

      {showSettings && (
        <SettingsModal
          config={config}
          onSave={(c) => { updateConfig(c); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showStore && <SkillStore onUse={useSkill} onClose={() => setShowStore(false)} />}
      {showAuto && <Automation reminders={reminders} onChange={updateReminders} onClose={() => setShowAuto(false)} />}

      <div className="toasts">
        {toasts.map((t) => <div className="toast" key={t.id}>{t.text}</div>)}
      </div>
    </div>
  );
}
