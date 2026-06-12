// 长文档「全读」：模型一次装不下整篇，于是分段多趟（map-reduce）——
// 逐段让模型提炼与任务相关的要点（map），最后把所有要点汇总（digest）交回正常对话作答（reduce）。
import type { Message } from "ai";
import { runTaskOnce } from "./runTask";
import type { ApiConfig } from "./config";
import { uid } from "./reminders";

export const LONGDOC_THRESHOLD = 40_000; // 抽取出的文字超过约 4 万字才启用全读
const CHUNK = 8_000;   // 每段字符数
const OVERLAP = 400;   // 段间重叠，避免切断语义

export function chunkText(text: string, size = CHUNK, overlap = OVERLAP): string[] {
  const chunks: string[] = [];
  if (size <= overlap) return [text];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    if (i + size >= text.length) break;
    i += size - overlap;
  }
  return chunks;
}

// 对一批文本分段通读，逐段提炼要点，返回汇总文本。
async function mapReduceOnce(
  text: string,
  task: string,
  config: ApiConfig,
  onProgress: ((cur: number, total: number) => void) | undefined,
  base: number,
  grandTotal: number,
): Promise<string> {
  const chunks = chunkText(text);
  const notes: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(base + i + 1, grandTotal);
    const instruction =
      `你正在分段通读一篇长文档，这是第 ${i + 1}/${chunks.length} 段。` +
      `请只依据本段内容，结合用户任务「${task || "总结全文要点"}」，` +
      `提炼出与任务相关的关键信息、事实、数据与原文要点，用简洁的中文条列。` +
      `不要编造本段没有的内容；若本段与任务无关，只回复「（本段无相关内容）」。`;
    const history: Message[] = [
      { id: uid(), role: "user", content: `${instruction}\n\n=== 本段原文 ===\n${chunks[i]}` },
    ];
    const res = await runTaskOnce(history, config);
    const txt = (res.content || "").trim();
    if (txt && !txt.startsWith("（本段无相关内容")) notes.push(`【第 ${i + 1} 段要点】\n${txt}`);
  }
  return notes.join("\n\n");
}

// 通读整篇长文档，返回要点汇总（digest）。
// 若汇总本身仍然过长，会再折叠一轮，保证最终能塞进模型上下文。
export async function digestLongDoc(
  docText: string,
  task: string,
  config: ApiConfig,
  onProgress?: (cur: number, total: number) => void,
): Promise<string> {
  const total = chunkText(docText).length;
  let digest = await mapReduceOnce(docText, task, config, onProgress, 0, total);
  // 极端长文：汇总仍超阈值时，继续折叠（reduce 的 reduce）。
  let guard = 0;
  while (digest.length > LONGDOC_THRESHOLD && guard < 3) {
    guard++;
    const sub = chunkText(digest).length;
    digest = await mapReduceOnce(digest, task, config, onProgress, 0, sub);
  }
  return digest;
}
