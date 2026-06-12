"use client";
import { useState } from "react";
import type { ApiConfig } from "../lib/config";
import { PROVIDERS, findProvider } from "../lib/providers";

export default function SettingsModal({
  config, onSave, onClose,
}: { config: ApiConfig; onSave: (c: ApiConfig) => void; onClose: () => void }) {
  const [providerId, setProviderId] = useState(config.provider || "deepseek");
  // 各厂商各自的 key：切厂商时输入框跟着切换，互不覆盖
  const [keys, setKeys] = useState<Record<string, string>>(() => ({ ...(config.apiKeys || {}) }));
  const [model, setModel] = useState(config.model);
  const [useTools, setUseTools] = useState(config.useTools);
  // 自定义厂商时手填
  const [customBase, setCustomBase] = useState(config.baseURL);
  const [customModel, setCustomModel] = useState(config.model);
  // 内置厂商下：可选「自定义模型 ID」，填了就覆盖预设选择（方便用最新型号）
  const [override, setOverride] = useState(() => {
    const p = findProvider(config.provider || "deepseek");
    if (p.custom) return "";
    return p.models.some((m) => m.id === config.model) ? "" : config.model;
  });

  const provider = findProvider(providerId);
  const apiKey = keys[providerId] || "";
  const setApiKey = (v: string) => setKeys((prev) => ({ ...prev, [providerId]: v }));

  // 切换厂商：自动带出该厂商的第一个模型，并清掉上一个厂商的自定义覆盖
  const pickProvider = (id: string) => {
    setProviderId(id);
    setOverride("");
    const p = findProvider(id);
    if (!p.custom && p.models.length) setModel(p.models[0].id);
  };

  const save = () => {
    const apiKeys = { ...keys };
    if (provider.custom) {
      onSave({
        provider: "custom",
        baseURL: customBase.trim(),
        apiKey: (apiKeys["custom"] || "").trim(),
        apiKeys,
        model: customModel.trim(),
        useTools,
      });
    } else {
      const sel = provider.models.find((x) => x.id === model) ? model : provider.models[0]?.id || "";
      const m = override.trim() || sel;
      onSave({
        provider: provider.id,
        baseURL: provider.baseURL,
        apiKey: (apiKeys[provider.id] || "").trim(),
        apiKeys,
        model: m,
        useTools,
      });
    }
  };

  const canSave = provider.custom
    ? !!customBase.trim() && !!customModel.trim()
    : true;

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>API 设置</h2>
        <div className="sub">选择你的模型厂商，填入 API Key 即可。每个厂商的 Key 各自保存、互不影响。配置只存在本浏览器（localStorage），不会上传。</div>

        <div className="field">
          <label>模型厂商</label>
          <div className="prov-grid">
            {PROVIDERS.map((p) => (
              <div
                key={p.id}
                className={"prov-card" + (p.id === providerId ? " on" : "")}
                onClick={() => pickProvider(p.id)}
              >
                <div className="prov-name">{p.name}</div>
                {!p.custom && <div className="prov-url">{p.baseURL}</div>}
                {p.custom && <div className="prov-url">域名 / 模型自行填写</div>}
                {(keys[p.id] || "").trim() && <div className="prov-haskey">已填 Key ✓</div>}
              </div>
            ))}
          </div>
        </div>

        {provider.custom ? (
          <>
            <div className="field">
              <label>Base URL（域名）</label>
              <input value={customBase} onChange={(e) => setCustomBase(e.target.value)}
                placeholder="https://your-endpoint/v1" />
              <div className="tip">任意 OpenAI 兼容端点，通常以 /v1 结尾。</div>
            </div>
            <div className="field">
              <label>模型 ID</label>
              <input value={customModel} onChange={(e) => setCustomModel(e.target.value)}
                placeholder="如 gpt-4o-mini / deepseek-chat" />
            </div>
          </>
        ) : (
          <div className="field">
            <label>模型</label>
            <div className="model-grid">
              {provider.models.map((m) => (
                <div
                  key={m.id}
                  className={"model-card" + (m.id === model ? " on" : "")}
                  onClick={() => setModel(m.id)}
                >
                  <div className="model-card-t">{m.label}{m.tag && <span className="mtag">{m.tag}</span>}</div>
                  <div className="model-card-d">{m.desc}</div>
                </div>
              ))}
            </div>
            <div className="override">
              <label>自定义模型 ID（可选，填了优先用这个）</label>
              <input value={override} onChange={(e) => setOverride(e.target.value)}
                placeholder="想用最新型号就填精确名，如 deepseek-chat / MiniMax-Text-01" />
              <div className="tip">留空则用上面选中的预设。模型名以该厂商官方文档为准。</div>
            </div>
          </div>
        )}

        <div className="field">
          <label>{provider.name} 的 API Key</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            type="password" placeholder={provider.keyPlaceholder} autoComplete="off" />
          <div className="tip">{provider.keyHint}</div>
        </div>

        <div className="field">
          <label className="toggle-row">
            <input type="checkbox" checked={useTools}
              onChange={(e) => setUseTools(e.target.checked)} />
            <span>启用 Agent 工具（联网搜索 / 时间 / 计算 / 读取网页 / 加载技能）</span>
          </label>
          <div className="tip">需厂商支持 function calling。若接口不支持工具调用导致回复异常，可关闭此项。</div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!canSave} onClick={save}>保存</button>
        </div>
      </div>
    </div>
  );
}
