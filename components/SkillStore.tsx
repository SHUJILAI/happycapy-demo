"use client";
import { useMemo, useState } from "react";
import { SKILLS, CATEGORIES } from "../lib/skills";
import { Search } from "./icons";

export default function SkillStore({
  onUse, onClose,
}: { onUse: (prompt: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("全部");

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return SKILLS.filter((s) => {
      const okCat = cat === "全部" || s.category === cat;
      const okKw = !kw || s.name.toLowerCase().includes(kw) || s.desc.toLowerCase().includes(kw);
      return okCat && okKw;
    });
  }, [q, cat]);

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal store" onClick={(e) => e.stopPropagation()}>
        <div className="store-top">
          <div>
            <h2>技能商店</h2>
            <div className="sub">每个技能都是一段提示词模版。点「使用」会把模版自动贴进输入框，补全内容后发送即可。</div>
          </div>
          <button className="x" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <div className="store-search">
          <Search style={{ width: 16, height: 16 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索技能…" />
        </div>

        <div className="store-cats">
          {CATEGORIES.map((c) => (
            <button key={c} className={"cat" + (c === cat ? " on" : "")} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        <div className="store-grid">
          {list.map((s) => (
            <div className="sk-card" key={s.name}>
              <div className="sk-card-top">
                <span className="sk-name">{s.name}</span>
                <span className="sk-cat">{s.category}</span>
              </div>
              <div className="sk-desc">{s.desc}</div>
              <button className="sk-use" onClick={() => onUse(s.prompt)}>使用</button>
            </div>
          ))}
          {list.length === 0 && <div className="store-empty">没有匹配的技能</div>}
        </div>
      </div>
    </div>
  );
}
