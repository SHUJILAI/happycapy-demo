import React from "react";

type P = { className?: string; style?: React.CSSProperties; onClick?: React.MouseEventHandler<SVGSVGElement> };
const S = (d: React.ReactNode, vb = "0 0 24 24") => (p: P) =>
  (
    <svg className={p.className ?? "icon"} style={p.style} onClick={p.onClick} viewBox={vb} fill="none"
      stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );

export const PlusCircle = S(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>);
export const Plus = S(<path d="M12 5v14M5 12h14" />);
export const Store = S(<><path d="M5 7l3-3h8l3 3M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M5 7h14" /><path d="M9 11a3 3 0 006 0" /></>);
export const Clock = S(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const Folder = S(<path d="M4 7l3-3h5l2 3h6v11a1 1 0 01-1 1H5a1 1 0 01-1-1V7z" />);
export const Sidebar = S(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>);
export const Puzzle = S(<path d="M9 4a2 2 0 014 0v1h3a1 1 0 011 1v3h1a2 2 0 010 4h-1v3a1 1 0 01-1 1h-3v-1a2 2 0 00-4 0v1H6a1 1 0 01-1-1v-3" />);
export const ChevronDown = S(<path d="M6 9l6 6 6-6" />);
export const ChevronUp = S(<path d="M6 15l6-6 6 6" />);
export const ChevronRight = S(<path d="M9 6l6 6-6 6" />);
export const ArrowUp = S(<path d="M12 19V5M5 12l7-7 7 7" />);
export const Check = S(<path d="M5 12l5 5 9-11" />);
export const User = S(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>);
export const Users = S(<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20a6 6 0 0112 0M14 20a5 5 0 017-4.5" /></>);
export const Gift = S(<><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M2 9h20M12 9v11M12 9c-2-4-6-4-6-1s4 1 6 1zm0 0c2-4 6-4 6-1s-4 1-6 1z" /></>);
export const Gear = S(<><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.3 1a7 7 0 00-1.7-1L16.5 3h-9l-.4 2.5a7 7 0 00-1.7 1l-2.3-1-2 3.5 2 1.5a7 7 0 000 2l-2 1.5 2 3.5 2.3-1a7 7 0 001.7 1l.4 2.5h9l.4-2.5a7 7 0 001.7-1l2.3 1 2-3.5-2-1.5a7 7 0 00.1-1z" /></>);
export const Phone = S(<><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>);
export const Help = S(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 3.5M12 17h.01" /></>);
export const SignOut = S(<path d="M15 5h-7a1 1 0 00-1 1v12a1 1 0 001 1h7M11 12h10M18 9l3 3-3 3" />);
export const Star = S(<path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" />);
export const Bars = S(<path d="M4 16V8M9 18V6M14 14V10M19 17V7" />);
export const Slides = S(<><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18" /></>);
export const Globe = S(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" /></>);
export const Mail = S(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>);
export const Search = S(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>);
export const Paperclip = S(<path d="M21 11l-8.5 8.5a5 5 0 01-7-7L14 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L15 6" />);
export const ImageIcon = S(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9" r="1.6" /><path d="M21 16l-5-5L5 20" /></>);
export const FileText = S(<><path d="M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V8z" /><path d="M14 3v5h4M9 13h6M9 17h6" /></>);
export const X = S(<path d="M6 6l12 12M18 6L6 18" />);
