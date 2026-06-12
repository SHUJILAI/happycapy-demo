// 上传/粘贴/拖拽进来的附件。图片走多模态，文本类文件读出正文内联到消息里。
export type Attachment = {
  id: string;
  name: string;
  kind: "image" | "text" | "other";
  mime: string;
  size: number;
  url?: string;   // data URL（图片用，发给多模态模型）
  text?: string;  // 文本类文件的正文
};

const TEXT_EXT = [
  "txt", "md", "markdown", "csv", "tsv", "json", "yaml", "yml", "xml", "html", "htm",
  "css", "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "h", "hpp", "go", "rs",
  "rb", "php", "sh", "bash", "sql", "log", "ini", "toml", "env", "vue", "svelte",
];
const MAX_TEXT = 200_000; // 最多内联 200KB 文本

function readAs(file: File, how: "dataURL" | "text"): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    if (how === "dataURL") r.readAsDataURL(file);
    else r.readAsText(file);
  });
}

function isTextLike(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  if (/(json|xml|javascript|csv|yaml|x-yaml|markdown)/.test(file.type)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return TEXT_EXT.includes(ext);
}

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export async function fileToAttachment(file: File): Promise<Attachment> {
  const base = {
    id: newId(),
    name: file.name || "未命名文件",
    mime: file.type || "application/octet-stream",
    size: file.size,
  };
  if (file.type.startsWith("image/")) {
    return { ...base, kind: "image", url: await readAs(file, "dataURL") };
  }
  if (isTextLike(file)) {
    let text = await readAs(file, "text");
    if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT) + "\n…（内容过长，已截断）";
    return { ...base, kind: "text", text };
  }
  return { ...base, kind: "other" };
}

export function humanSize(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}
