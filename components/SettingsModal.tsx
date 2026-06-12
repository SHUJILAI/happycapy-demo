"use client";
import { useState } from "react";
import type { ApiConfig } from "../lib/config";

export default function SettingsModal({
  config, onSave, onClose,
}: { config: ApiConfig; onSave: (c: ApiConfig) => void; onClose: () => void }) {
  const [baseURL, setBaseURL] = useState(config.baseURL);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [useTools, setUseTools] = useState(config.useTools);

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>API 设置</h2>
        <div className="sub">接入你自己的 OpenAI 兼容接口。配置仅保存在本浏览器（localStorage），不会上传。</div>

        <div className="field">
          <label>Base URL</label>
          <input value={baseURL} onChange={(e) => setBaseURL(e.target.value)}
            placeholder="https://api.openai.com/v1" />
          <div className="tip">任意 OpenAI 兼容端点，需以 /v1 结尾，如 OpenRouter、自建网关、本地模型等。</div>
        </div>

        <div className="field">
          <label>API Key</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            type="password" placeholder="sk-..." />
          <div className="tip">你的密钥，保存在本地浏览器中。</div>
        </div>

        <div className="field">
          <label>默认模型</label>
          <input value={model} onChange={(e) => setModel(e.target.value)}
            placeholder="openai/gpt-4.1" />
          <div className="tip">填写你的服务端支持的模型 ID。网关一般带前缀（如 openai/gpt-4.1、deepseek/deepseek-v4-pro）；官方接口直接填 gpt-4o、deepseek-chat 等。</div>
        </div>

        <div className="field">
          <label className="toggle-row">
            <input type="checkbox" checked={useTools}
              onChange={(e) => setUseTools(e.target.checked)} />
            <span>启用 Agent 工具（时间查询 / 计算器）</span>
          </label>
          <div className="tip">需服务端支持 function calling。若你的接口不支持工具调用导致回复为空，可关闭此项。</div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn primary"
            onClick={() => onSave({ baseURL: baseURL.trim(), apiKey: apiKey.trim(), model: model.trim() || "openai/gpt-4.1", useTools })}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
