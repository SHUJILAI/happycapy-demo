"use client";
import { useState } from "react";
import {
  PlusCircle, Store, Clock, Folder, Sidebar as SidebarIcon, Plus,
  User, Users, Gift, Gear, Phone, Help, SignOut, ChevronUp, ChevronRight,
} from "./icons";

function Ring({ offset, label }: { offset: number; label: string }) {
  return (
    <div className="ring">
      <svg width="26" height="26">
        <circle cx="13" cy="13" r="10" stroke="#e3e0d6" strokeWidth="3" fill="none" />
        <circle cx="13" cy="13" r="10" stroke="#3ba55d" strokeWidth="3" fill="none"
          strokeDasharray="63" strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="rlabel">{label}</span>
    </div>
  );
}

type ProjItem = { id: string; name: string };

export default function Sidebar({
  onNewChat, onOpenSettings, onOpenStore, onOpenAutomation,
  projects, activeId, onSelect, onDelete, open, onClose,
}: {
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenStore: () => void;
  onOpenAutomation: () => void;
  projects: ProjItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  open?: boolean;
  onClose?: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <>
    {open && <div className="nav-backdrop" onClick={onClose} />}
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="brand">
        <img className="logo" src="/capy-logo.png" alt="happycapy" />
        <span className="name">happycapy</span>
        <SidebarIcon className="icon collapse" onClick={onClose} />
      </div>

      <nav className="nav">
        <div className="nav-item" onClick={onNewChat}><PlusCircle />新建项目</div>
        <div className="nav-item" onClick={onOpenStore}><Store />技能商店</div>
        <div className="nav-item" onClick={onOpenAutomation}><Clock />自动化<span className="badge">Beta</span></div>
      </nav>

      <div className="section-head">
        <span>项目</span>
        <Plus className="icon add" style={{ width: 16, height: 16, cursor: "pointer" }} onClick={onNewChat} />
      </div>

      <div className="projects">
        {projects.length === 0 ? (
          <div className="proj-empty">
            <Folder className="icon" style={{ width: 16, height: 16, color: "var(--text-mute)" }} />
            <span>还没有项目，点「新建项目」开始</span>
          </div>
        ) : (
          projects.map((p) => (
            <div className={"proj" + (p.id === activeId ? " active" : "")} key={p.id} onClick={() => onSelect(p.id)}>
              <span className="dot" />
              <span className="label">{p.name}</span>
              <span className="proj-del" onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} aria-label="删除">×</span>
            </div>
          ))
        )}
      </div>

      <div className="sandbox">
        <div>
          <div className="sb-title">沙盒</div>
          <div className="sb-run">运行中</div>
        </div>
        <div className="rings">
          <Ring offset={40} label="CPU" />
          <Ring offset={30} label="内存" />
          <Ring offset={20} label="磁盘" />
        </div>
      </div>

      <div className="account" onClick={() => setMenu((v) => !v)}>
        <div className="av"><img src="/capy-logo.png" alt="" /></div>
        <div className="meta"><div className="u">我的账户</div><div className="p">免费版</div></div>
        <Gift className="icon gift" style={{ width: 18, height: 18 }} />
        <ChevronUp className="icon chev" style={{ width: 16, height: 16 }} />

        {menu && (
          <>
            <div className="overlay" onClick={(e) => { e.stopPropagation(); setMenu(false); }} />
            <div className="pop acct-menu" onClick={(e) => e.stopPropagation()}>
              <div className="am-head">
                <div className="av"><img src="/capy-logo.png" alt="" /></div>
                <div><div className="u">我的账户</div><div className="p">免费版</div></div>
              </div>
              <div className="am-item"><User />个人</div>
              <div className="am-item"><Users />新建团队</div>
              <div className="am-item"><Plus />创建团队</div>
              <div className="am-sep" />
              <div className="am-item am-gift">
                <Gift />
                <div className="txt"><span>邀请好友</span><span className="sub">双方各得 1,000 积分</span></div>
              </div>
              <div className="am-sep" />
              <div className="am-item" onClick={() => { setMenu(false); onOpenSettings(); }}><Gear />设置</div>
              <div className="am-item"><Phone />iOS 应用</div>
              <div className="am-item"><Help />帮助<ChevronRight className="icon arrow" style={{ width: 16, height: 16 }} /></div>
              <div className="am-sep" />
              <div className="am-item am-signout"><SignOut />退出登录</div>
            </div>
          </>
        )}
      </div>
    </aside>
    </>
  );
}
