// 「长产物自动补全」：单次模型回复有输出上限（通常几千 token），
// 一份较大的 HTML / 小程序页面一次写不完，会在中途被截断——闭合的 ``` 永远不来，
// 右侧工作台于是出不来完整预览。这里在「检测到截断」时自动接着写：
// 把已写出的部分喂回模型，让它紧接着断点继续，多趟拼接，直到代码块闭合为止。
// 最终把这些续写片段「融合」成一份完整且闭合的文档，再交给界面展示。
import type { Message } from "ai";
import { runTaskOnce } from "./runTask";
import type { ApiConfig } from "./config";
import { uid } from "./reminders";

export const MAX_CONTINUE_ROUNDS = 6; // 最多自动续写几趟，兜底防止死循环

// 文本里 ``` 的个数为奇数 => 存在「未闭合的代码块」=> 多半是被截断了。
export function hasUnclosedFence(text: string): boolean {
  const count = (text.match(/```/g) || []).length;
  return count % 2 === 1;
}

// 续写时，模型有时会重复一小段已经写过的内容。
// 这里找出「已累积内容的结尾」与「新片段的开头」最长的重叠，并从新片段里去掉，避免重复。
function stripOverlap(acc: string, chunk: string): string {
  const maxLook = Math.min(400, acc.length, chunk.length);
  for (let len = maxLook; len >= 12; len--) {
    if (acc.slice(acc.length - len) === chunk.slice(0, len)) {
      return chunk.slice(len);
    }
  }
  return chunk;
}

const CONTINUE_INSTRUCTION =
  "上面那条助手消息的内容因为长度上限被【截断】了，还没写完。" +
  "请【紧接着它的最后一个字符】继续输出剩余的内容：" +
  "不要重复任何已经输出过的内容，不要写任何前言、解释或寒暄，直接接着写。" +
  "如果中断在代码块（例如 HTML）内部，请把这段代码补写完整，并在结尾用 ``` 正确闭合。" +
  "若剩余内容仍然较多，可以只写一部分，但务必保证语法连贯，下一轮我会再让你继续。";

// 把一条被截断的 assistant 回复自动补全为完整内容。
// prior: 截断回复之前的全部消息；partial: 被截断的回复正文。
// 返回融合后的完整正文（尽力保证代码块已闭合）。
export async function completeReply(
  prior: Message[],
  partial: string,
  config: ApiConfig,
  onProgress?: (round: number) => void,
): Promise<string> {
  let acc = partial;
  // 续写阶段关闭工具调用：更快、更省，也避免模型在续写途中又跑去调用工具打断输出。
  const cfg: ApiConfig = { ...config, useTools: false };

  for (let round = 1; round <= MAX_CONTINUE_ROUNDS; round++) {
    if (!hasUnclosedFence(acc)) break; // 已经闭合，无需再续
    onProgress?.(round);
    const history: Message[] = [
      ...prior,
      { id: uid(), role: "assistant", content: acc } as Message,
      { id: uid(), role: "user", content: CONTINUE_INSTRUCTION } as Message,
    ];
    const res = await runTaskOnce(history, cfg);
    const chunk = stripOverlap(acc, (res.content || "").trim());
    if (!chunk) break; // 模型没再产出新内容，停止
    acc += chunk;
  }

  // 兜底：若多趟之后仍未闭合，强制补上闭合反引号，至少保证产物能完整渲染。
  if (hasUnclosedFence(acc)) acc += "\n```";
  return acc;
}
