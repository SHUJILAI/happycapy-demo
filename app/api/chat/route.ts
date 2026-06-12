import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import SKILL_LIBRARY from "../../../lib/skill-library.json";

export const runtime = "nodejs";
export const maxDuration = 60;

type SkillEntry = { name: string; desc: string; prompt: string };
const LIBRARY = SKILL_LIBRARY as Record<string, SkillEntry>;

const SYSTEM_PROMPT = `你是 Happycapy（中文名「快乐水豚」），一个友好、专业、聪明的中文 AI 智能体（agent），不是普通的问答机器人。
工作方式（与 Claude Code / Codex 一致的多步循环）：
- 先思考需要哪些信息，主动调用合适的工具来获取事实，而不是凭空猜测。
- 可以连续调用多个工具：思考 → 调用工具 → 读取结果 → 继续，直到任务完成。
- 涉及"现在几点/今天日期"用 getCurrentTime；涉及数值计算用 calculate；需要查看某个网页内容用 fetchUrl。
- 工具返回结果后，把信息自然地融入最终回答，不要直接粘贴原始 JSON。
表达要求：
- 默认用简体中文回答，语气自然、简洁、有条理。
- 回答结构清晰，适当使用列表和小标题。`;

// 当用户挂载了某个技能时，把该技能的「官方说明书」原样拼到 system 后面，
// 让模型严格按照这套技能流程来完成当前任务。
function buildSystem(skillId?: string): string {
  const id = (skillId || "").trim();
  const skill = id ? LIBRARY[id] : undefined;
  if (!skill) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}

================ 已挂载技能：${id} ================
用户为本次对话挂载了下面这个「技能」。请把它当作必须遵守的操作说明书：严格按照其中的流程、规范与输出格式来完成用户的请求。如果技能中提到的某些命令行工具/脚本在当前环境无法执行，就用你能力范围内最接近的方式产出等价的成果（例如直接生成对应的代码、HTML、文档内容），不要假装执行了无法执行的命令。

【技能简介】${skill.desc}

【技能说明书正文】
${skill.prompt}
================ 技能说明书结束 ================`;
}

export async function POST(req: Request) {
  try {
    const { messages, config, skill } = await req.json();
    const baseURL: string = config?.baseURL?.trim();
    const apiKey: string = config?.apiKey?.trim();
    const model: string = config?.model?.trim() || "openai/gpt-4.1";
    const useTools: boolean = config?.useTools !== false;
    const system = buildSystem(typeof skill === "string" ? skill : undefined);

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
      system,
      messages,
      maxSteps: useTools ? 8 : 1,
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
        fetchUrl: tool({
          description: "抓取一个网页并返回其纯文本内容。当用户给出网址、或需要查看某个页面/文章的实际内容时使用。",
          parameters: z.object({
            url: z.string().describe("要抓取的完整网址，必须以 http:// 或 https:// 开头"),
          }),
          execute: async ({ url }) => {
            if (!/^https?:\/\//i.test(url)) {
              return { error: "网址必须以 http:// 或 https:// 开头。" };
            }
            try {
              const ctrl = new AbortController();
              const timer = setTimeout(() => ctrl.abort(), 12_000);
              const resp = await fetch(url, {
                signal: ctrl.signal,
                headers: { "User-Agent": "Mozilla/5.0 (compatible; HappycapyAgent/1.0)" },
              });
              clearTimeout(timer);
              if (!resp.ok) return { url, error: `请求失败，HTTP ${resp.status}` };
              const html = await resp.text();
              const text = html
                .replace(/<script[\s\S]*?<\/script>/gi, " ")
                .replace(/<style[\s\S]*?<\/style>/gi, " ")
                .replace(/<[^>]+>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/\s+/g, " ")
                .trim();
              return { url, title: (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim(), text: text.slice(0, 4000) };
            } catch (e) {
              return { url, error: e instanceof Error ? e.message : "抓取网页失败。" };
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
