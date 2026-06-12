import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `你是 Happycapy（中文名「快乐水豚」），一个友好、专业、聪明的中文 AI 智能体。
- 默认用简体中文回答，语气自然、简洁、有条理。
- 需要时可以调用提供的工具，并把结果自然地融入回答。
- 回答尽量结构清晰，适当使用列表和小标题。`;

export async function POST(req: Request) {
  try {
    const { messages, config } = await req.json();
    const baseURL: string = config?.baseURL?.trim();
    const apiKey: string = config?.apiKey?.trim();
    const model: string = config?.model?.trim() || "openai/gpt-4.1";
    const useTools: boolean = config?.useTools !== false;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "尚未配置 API Key，请点击左下角「设置」填写你的 OpenAI 兼容接口信息。" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = createOpenAI({
      apiKey,
      baseURL: baseURL || "https://api.openai.com/v1",
      // 部分网关（如 Cloudflare 保护的端点）会拦截缺少 UA 的请求
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HappycapyAgent/1.0)" },
      // AI SDK 默认把 system 提示词发成 role:"developer"，而多数 OpenAI 兼容
      // 网关/模型只认 role:"system"（否则会返回空内容）。这里改写回 system。
      fetch: async (url, options) => {
        if (typeof options?.body === "string" && options.body.includes('"developer"')) {
          try {
            const parsed = JSON.parse(options.body);
            if (Array.isArray(parsed.messages)) {
              let changed = false;
              for (const m of parsed.messages) {
                if (m?.role === "developer") { m.role = "system"; changed = true; }
              }
              if (changed) options = { ...options, body: JSON.stringify(parsed) };
            }
          } catch { /* 非 JSON body 原样透传 */ }
        }
        return fetch(url, options as RequestInit);
      },
    });

    const result = streamText({
      model: openai(model),
      system: SYSTEM_PROMPT,
      messages,
      maxSteps: useTools ? 5 : 1,
      tools: !useTools ? undefined : {
        getCurrentTime: tool({
          description: "获取当前的日期和时间。当用户询问现在几点、今天日期等时间相关问题时使用。",
          parameters: z.object({
            timeZone: z.string().optional().describe("IANA 时区，例如 Asia/Shanghai，默认上海"),
          }),
          execute: async ({ timeZone }) => {
            const tz = timeZone || "Asia/Shanghai";
            const now = new Date().toLocaleString("zh-CN", { timeZone: tz, hour12: false });
            return { timeZone: tz, datetime: now };
          },
        }),
        calculate: tool({
          description: "进行数学计算。当用户需要算术、百分比、汇率换算等数值计算时使用。",
          parameters: z.object({
            expression: z.string().describe("要计算的纯数学表达式，例如 (1234*0.15)+88"),
          }),
          execute: async ({ expression }) => {
            if (!/^[\d\s+\-*/().%]+$/.test(expression)) {
              return { error: "表达式包含非法字符，仅支持数字与 + - * / ( ) % 运算符。" };
            }
            try {
              // eslint-disable-next-line no-new-func
              const value = Function(`"use strict";return (${expression})`)();
              return { expression, result: value };
            } catch {
              return { error: "无法计算该表达式。" };
            }
          },
        }),
      },
    });

    return result.toDataStreamResponse({
      getErrorMessage: (err) => (err instanceof Error ? err.message : "调用上游 API 失败，请检查 Base URL、API Key 和模型名是否正确。"),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务器内部错误";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
