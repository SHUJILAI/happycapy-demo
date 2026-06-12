import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Happycapy · 中文版",
  description: "可接入自有 OpenAI 兼容 API 的 Happycapy 智能体",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
