"use client";
import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import Sidebar from "../components/Sidebar";
import Composer from "../components/Composer";
import ChatMessages from "../components/ChatMessages";
import SettingsModal from "../components/SettingsModal";
import { loadConfig, saveConfig, DEFAULT_CONFIG, type ApiConfig } from "../lib/config";
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
  const [showSettings, setShowSettings] = useState(false);
  const [greeting, setGreeting] = useState("你好");

  useEffect(() => {
    setConfig(loadConfig());
    setReady(true);
    const h = new Date().getHours();
    setGreeting(h < 6 ? "夜深了" : h < 12 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好");
  }, []);

  const { messages, input, setInput, append, isLoading, error, setMessages } = useChat({
    api: "/api/chat",
    body: { config },
  });

  const updateConfig = (c: ApiConfig) => { setConfig(c); saveConfig(c); };

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    if (!config.apiKey) { setShowSettings(true); return; }
    setInput("");
    append({ role: "user", content }, { body: { config } });
  };

  const newChat = () => { setMessages([]); setInput(""); };
  const hasChat = messages.length > 0;

  return (
    <div className="app">
      <Sidebar onNewChat={newChat} onOpenSettings={() => setShowSettings(true)} />

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

      {showSettings && (
        <SettingsModal
          config={config}
          onSave={(c) => { updateConfig(c); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
