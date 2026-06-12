"use client";
import { useState } from "react";
import type { ApiConfig } from "../lib/config";
import { PROVIDERS, findProvider } from "../lib/providers";

export default function SettingsModal({
  config, onSave, onClose,
}: { config: ApiConfig; onSave: (c: ApiConfig) => void; onClose: () => void }) {
  const [providerId, setProviderId] = useState(config.provider || "deepseek");
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [useTools, setUseTools] = useState(config.useTools);
  // 自定义厂商时手填
  const [customBase, setCustomBase] = useState(config.baseURL);
  const [customModel, setCustomModel] = useState(config.model);

  const provider = findProvider(providerId);

  // 切换厂商：自动带出该厂商的第一个模型
  const pickProvider = (id: string) => {
    setProviderId(id);
    const p = findProvider(id);
    if (!p.custom && p.models.length) setModel(p.models[0].id);
  };

  const save = () => {
    if (provider.custom) {
      onSave({
        provider: "custom",
        baseURL: customBase.trim(),
        apiKey: apiKey.trim(),
        model: customModel.trim(),
        useTools,
      });
    } else {
      const m = provider.models.find((x) => x.id === model) ? model : provider.models[0].id;
      onSave({
        provider: provider.id,
        baseURL: provider.baseURL,
        apiKey: apiKey.trim(),
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
        <div className="sub">选择你的模型厂商，填入 API Key 即可。配置只保存在本浏览器（localStorage），不会上传。</div>

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
                  <div className="model-card-t">{m.label}</div>
                  <div className="model-card-d">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label>API Key</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            type="password" placeholder={provider.keyPlaceholder} />
          <div className="tip">{provider.keyHint}</div>
        </div>

        <div className="field">
          <label className="toggle-row">
            <input type="checkbox" checked={useTools}
              onChange={(e) => setUseTools(e.target.checked)} />
            <span>启用 Agent 工具（时间查询 / 计算 / 读取网页）</span>
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
