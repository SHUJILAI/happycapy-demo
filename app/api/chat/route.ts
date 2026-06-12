import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, convertToCoreMessages } from "ai";
import { z } from "zod";
import SKILL_LIBRARY from "../../../lib/skill-library.json";
import { SKILLS } from "../../../lib/skills";

export const runtime = "nodejs";
export const maxDuration = 60;

type SkillEntry = { name: string; desc: string; prompt: string };
const LIBRARY = SKILL_LIBRARY as Record<string, SkillEntry>;

// 给模型看的「技能清单」：id + 中文简介。模型据此判断该不该调用 loadSkill 自主加载。
const SKILL_CATALOG = SKILLS.map((s) => `- ${s.name}：${s.desc}`).join("\n");

const SYSTEM_PROMPT = `你是 Happycapy（中文名「快乐水豚」），一个友好、专业、聪明的中文 AI 智能体（agent），不是普通的问答机器人。
工作方式（与 Claude Code / Codex 一致的多步循环）：
- 先思考需要哪些信息，主动调用合适的工具来获取事实，而不是凭空猜测。
- 可以连续调用多个工具：思考 → 调用工具 → 读取结果 → 继续，直到任务完成。
- 涉及"现在几点/今天日期"用 getCurrentTime；涉及数值计算用 calculate；需要查看某个网页内容用 fetchUrl。
- 需要最新资讯、实时事实、你不确定或可能过时的信息时，先用 webSearch 联网搜索，再结合搜到的结果作答，并在合适处标注来源链接。
- 工具返回结果后，把信息自然地融入最终回答，不要直接粘贴原始 JSON。

【自主使用技能（重要）】
你内置了一批专业「技能」。当用户的需求匹配下面某个技能时，不要让用户自己动手，而应**主动**先调用 loadSkill 工具加载它的官方说明书，再严格按说明书的流程与输出规范来完成任务。一次可按需加载一个或多个技能。能直接产出的成果（文案、代码、HTML、SVG、Markdown 文档等）就直接产出。
可用技能清单：
${SKILL_CATALOG}

说明：本网页版直接对接你（用户自带的模型 API），擅长生成文字/代码/HTML/SVG/文档类成果；涉及真实图像/视频生成、音视频剪辑、发送邮件等需要外部服务和密钥的操作，本环境无法真正执行，这时请用 loadSkill 取得方法论，产出可落地的方案、脚本或代码，并诚实说明哪一步需要用户在本机/对应平台执行。

【可视化输出（非常重要）】
本应用会自动把你回复中用 \`\`\`html 围起来的代码块渲染成右侧「工作台」里的可交互网页预览。因此，当结果属于「有结构、信息量较大」的内容时——例如：方案/报告/对比/排行榜/数据表格/时间线/流程步骤/数据统计/卡片清单/产品介绍/学习资料/总结归纳等——你应当**默认把成果做成一份精美、自包含的 HTML 页面**呈现，而不是只丢一段朴素文字（朴素文字很难看）。要求：
- 用单个 \`\`\`html 代码块输出一个完整的 HTML 文档（含 <!DOCTYPE html>、<style> 内联样式；如需交互再加少量 <script>）。
- 设计要现代、美观、配色协调、排版有层次：善用卡片、圆角、阴影、留白、图标 emoji、表格、进度条、徽章等元素，移动端也能正常显示（响应式）。
- 不要引用外部 CSS/JS 文件或外网图片（可能加载不出来）；所有样式内联，保证离线自包含可直接预览。
- HTML 代码块前后，可用一两句中文简要说明这份可视化展示了什么。
- 简单的一两句话问答、闲聊、纯解释性回答，则正常用中文文字回答即可，不必强行套 HTML。

表达要求：
- 默认用简体中文回答，语气自然、简洁、有条理。
- 普通文字回答时结构清晰，适当使用列表和小标题；结构化成果优先按上面的「可视化输出」做成 HTML。`;

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

// 把上游 API 返回的难懂报错翻译成对小白友好的中文提示。
function friendlyError(err: unknown, model: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const low = raw.toLowerCase();
  // DeepSeek 等纯文本模型收到图片（image_url）时会报这个：unknown variant `image_url`, expected `text`
  if (low.includes("image_url") || (low.includes("unknown variant") && low.includes("image"))) {
    return `你发送了图片，但当前模型「${model}」是纯文本模型，看不懂图片。请点左下角「设置」换成支持看图（视觉/多模态）的模型——例如 OpenAI 的 gpt-4o，或其它带「视觉 / VL / vision」字样的模型；或者去掉图片只发文字。（这说明你的 API 是通的，只是这个模型不读图。）`;
  }
  if (low.includes("401") || low.includes("invalid api key") || low.includes("authentication") || low.includes("unauthorized")) {
    return "接口拒绝了你的 API Key（认证失败）。请到「设置」核对：Key 是否填对、是否过期、是否和所选「接口地址」属于同一家厂商。";
  }
  if (low.includes("404") || low.includes("model") && low.includes("not") && low.includes("found")) {
    return `接口找不到模型「${model}」。请到「设置」确认模型 ID 是否拼写正确、该厂商是否提供这个模型。`;
  }
  if (low.includes("429") || low.includes("rate limit") || low.includes("quota") || low.includes("insufficient")) {
    return "触发了接口的限流或余额不足。请稍后再试，或到对应平台检查账户额度。";
  }
  return raw || "调用上游 API 失败，请检查 Base URL、API Key 和模型名是否正确。";
}

export async function POST(req: Request) {
  try {
    const { messages, config, skill } = await req.json();
    const baseURL: string = config?.baseURL?.trim();
    const apiKey: string = config?.apiKey?.trim();
    // 用户选中的模型原样使用，绝不替换/兜底成别的模型——选哪个就调哪个。
    const model: string = config?.model?.trim() || "";
    const useTools: boolean = config?.useTools !== false;
    const system = buildSystem(typeof skill === "string" ? skill : undefined);
    let coreMessages: ReturnType<typeof convertToCoreMessages>;
    try { coreMessages = convertToCoreMessages(messages); }
    catch { coreMessages = messages; }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "尚未配置 API Key，请点击左下角「设置」填写你的 OpenAI 兼容接口信息。" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    // 只走用户自己填的接口：baseURL 也必须由用户指定，绝不替用户猜测/兜底到任何默认服务。
    if (!baseURL || !/^https?:\/\//i.test(baseURL)) {
      return new Response(
        JSON.stringify({ error: "尚未配置接口地址（Base URL），请在「设置」里填写你自己的 OpenAI 兼容接口地址（http(s):// 开头）。" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    // 没选模型就报错，绝不偷偷替你选一个别的模型来调用。
    if (!model) {
      return new Response(
        JSON.stringify({ error: "尚未选择模型，请在输入框右侧的模型菜单里选择，或到「设置」里填写模型 ID。" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = createOpenAI({
      apiKey,
      baseURL,
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
      messages: coreMessages,
      maxSteps: useTools ? 8 : 1,
      tools: !useTools ? undefined : {
        loadSkill: tool({
          description: "加载某个内置技能的官方说明书（SKILL.md 正文）。当用户的需求匹配某项专业技能时先调用它，拿到说明书后严格按其流程与输出规范完成任务。",
          parameters: z.object({
            skillId: z.string().describe("技能 id，必须来自系统提示词里的「可用技能清单」，例如 frontend-slides、data-storytelling、readme-generator"),
          }),
          execute: async ({ skillId }) => {
            const s = LIBRARY[(skillId || "").trim()];
            if (!s) {
              return { error: `未找到技能「${skillId}」。可用技能：${SKILLS.map((x) => x.name).join("、")}` };
            }
            return { skill: skillId, name: s.name, instructions: s.prompt };
          },
        }),
        webSearch: tool({
          description: "联网搜索：根据关键词在互联网上检索，返回若干条结果（标题、摘要、链接）。当需要最新资讯、实时事实或你不确定的信息时使用。",
          parameters: z.object({
            query: z.string().describe("搜索关键词，尽量精炼准确"),
          }),
          execute: async ({ query }) => {
            try {
              const ctrl = new AbortController();
              const timer = setTimeout(() => ctrl.abort(), 12_000);
              const resp = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query), {
                signal: ctrl.signal,
                headers: { "User-Agent": "Mozilla/5.0 (compatible; HappycapyAgent/1.0)" },
              });
              clearTimeout(timer);
              if (!resp.ok) return { query, error: `搜索失败，HTTP ${resp.status}` };
              const html = await resp.text();
              const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
              const decodeUddg = (href: string) => {
                const m = href.match(/[?&]uddg=([^&]+)/);
                try { return m ? decodeURIComponent(m[1]) : href.replace(/^\/\//, "https://"); } catch { return href; }
              };
              const results: { title: string; url: string; snippet: string }[] = [];
              const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<a[^>]*class="result__a"|$)/g;
              let mm: RegExpExecArray | null;
              while ((mm = re.exec(html)) && results.length < 6) {
                const url = decodeUddg(mm[1]);
                const title = strip(mm[2]);
                const sn = mm[3].match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
                const snippet = sn ? strip(sn[1]).slice(0, 300) : "";
                if (title && url) results.push({ title, url, snippet });
              }
              if (!results.length) return { query, results: [], note: "未解析到结果，可改用 fetchUrl 直接抓取已知网址。" };
              return { query, results };
            } catch (e) {
              return { query, error: e instanceof Error ? e.message : "联网搜索失败。" };
            }
          },
        }),
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
      sendReasoning: true, // 推理模型（如 deepseek-reasoner）的思考过程也流式发给前端，便于展示「思考过程」
      getErrorMessage: (err) => friendlyError(err, model),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务器内部错误";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
