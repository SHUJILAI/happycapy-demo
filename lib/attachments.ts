// 上传/粘贴/拖拽进来的附件。
// 图片走多模态（并先压缩，避免请求体过大导致 Failed to fetch）；
// 文本/代码直接读正文；zip/pdf/word/excel 在浏览器里解析成文本后内联。
export type Attachment = {
  id: string;
  name: string;
  kind: "image" | "text" | "other";
  mime: string;
  size: number;
  url?: string;   // data URL（图片用，发给多模态模型）
  text?: string;  // 文本类/已解析文件的正文
  note?: string;  // 解析状态提示（如“已从 PDF 提取文字”）
};

const TEXT_EXT = [
  "txt", "md", "markdown", "csv", "tsv", "json", "yaml", "yml", "xml", "html", "htm",
  "css", "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "h", "hpp", "go", "rs",
  "rb", "php", "sh", "bash", "sql", "log", "ini", "toml", "env", "vue", "svelte",
  "kt", "swift", "scss", "less", "gradle", "properties", "cfg", "conf", "gitignore",
];
const MAX_TEXT = 200_000;        // 单个文件最多内联 200KB 文本
const MAX_ZIP_TEXT = 300_000;    // 压缩包内文本合计上限
const MAX_ZIP_SIZE = 40 * 1024 * 1024; // 压缩包本身大小上限（40MB）
const IMG_MAX_SIDE = 1280;       // 图片压缩后最长边
const IMG_QUALITY = 0.82;

function readAs(file: File | Blob, how: "dataURL" | "text"): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    if (how === "dataURL") r.readAsDataURL(file);
    else r.readAsText(file);
  });
}

function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function isTextLike(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  if (/(json|xml|javascript|csv|yaml|x-yaml|markdown)/.test(file.type)) return true;
  return TEXT_EXT.includes(extOf(file.name));
}

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + "\n…（内容过长，已截断）" : s;

// ---- 图片：超过约 500KB 就压缩，控制请求体大小 ----
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}
async function imageDataUrl(file: File): Promise<string> {
  const dataUrl = await readAs(file, "dataURL");
  if (file.size <= 500_000) return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, IMG_MAX_SIDE / Math.max(img.width, img.height));
    if (scale >= 1 && file.size <= 1_500_000) return dataUrl;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", IMG_QUALITY);
  } catch {
    return dataUrl;
  }
}

// ---- zip：解压并读出里面的文本/代码文件 ----
function ignoredInZip(path: string): boolean {
  return (
    path.startsWith("__MACOSX/") ||
    path.includes("/node_modules/") || path.startsWith("node_modules/") ||
    path.includes("/.git/") || path.startsWith(".git/") ||
    path.includes("/dist/") || path.includes("/build/") || path.includes("/.next/") ||
    /\.(lock|map)$/.test(path) || path.endsWith(".DS_Store")
  );
}
async function parseZip(file: File): Promise<string> {
  if (file.size > MAX_ZIP_SIZE) {
    return `（压缩包过大：${humanSize(file.size)}，超过 ${humanSize(MAX_ZIP_SIZE)} 上限，未解析。请拆小后再上传。）`;
  }
  const { unzip, strFromU8 } = await import("fflate");
  const buf = new Uint8Array(await file.arrayBuffer());
  // 用异步 unzip（在 Web Worker 里解压，不阻塞主线程导致页面卡死）。
  // filter 只让“文本/代码且体积合理”的文件被解压，避免白白解压 node_modules 等。
  const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(
      buf,
      {
        filter: (f) =>
          !f.name.endsWith("/") &&
          !ignoredInZip(f.name) &&
          TEXT_EXT.includes(extOf(f.name)) &&
          f.originalSize <= MAX_TEXT,
      },
      (err, data) => (err ? reject(err) : resolve(data)),
    );
  });
  const parts: string[] = [];
  let total = 0;
  for (const name of Object.keys(entries).sort()) {
    const content = strFromU8(entries[name]);
    const block = `\n\n===== ${name} =====\n${content}`;
    if (total + block.length > MAX_ZIP_TEXT) {
      parts.push(`\n\n（其余文件因合计长度超限已省略）`);
      break;
    }
    parts.push(block);
    total += block.length;
  }
  if (!parts.length) return "（压缩包内没有可读取的文本/代码文件）";
  return `（已解压压缩包，读取到 ${parts.length} 个文本/代码文件）` + parts.join("");
}

// ---- PDF：用 pdf.js 提取文字 ----
async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjs as any).GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
  ).toString();
  const data = new Uint8Array(await file.arrayBuffer());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (pdfjs as any).getDocument({ data }).promise;
  const out: string[] = [];
  const maxPages = Math.min(doc.numPages, 80);
  let total = 0;
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = (tc.items as any[]).map((it) => ("str" in it ? it.str : "")).join(" ");
    const block = `\n--- 第 ${i} 页 ---\n${text}`;
    if (total + block.length > MAX_TEXT) { out.push("\n（PDF 内容过长，已截断）"); break; }
    out.push(block);
    total += block.length;
  }
  const joined = out.join("\n").trim();
  return joined || "（PDF 没有可提取的文字，可能是扫描件/图片型 PDF）";
}

// ---- Word(.docx)：mammoth 提取正文 ----
async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return truncate(res.value || "（Word 文档没有可提取的文字）", MAX_TEXT);
}

// ---- Excel(.xlsx/.xls)：SheetJS 转 CSV ----
async function parseSheet(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const parts = wb.SheetNames.map(
    (name) => `\n--- 工作表：${name} ---\n${XLSX.utils.sheet_to_csv(wb.Sheets[name])}`
  );
  return truncate(parts.join("\n"), MAX_TEXT);
}

export async function fileToAttachment(file: File): Promise<Attachment> {
  const base = {
    id: newId(),
    name: file.name || "未命名文件",
    mime: file.type || "application/octet-stream",
    size: file.size,
  };
  const ext = extOf(file.name);

  if (file.type.startsWith("image/")) {
    return { ...base, kind: "image", url: await imageDataUrl(file) };
  }

  try {
    if (ext === "zip" || /zip/.test(file.type)) {
      return { ...base, kind: "text", text: await parseZip(file), note: "已解压压缩包" };
    }
    if (ext === "pdf" || file.type === "application/pdf") {
      return { ...base, kind: "text", text: await parsePdf(file), note: "已从 PDF 提取文字" };
    }
    if (ext === "docx" || /wordprocessingml/.test(file.type)) {
      return { ...base, kind: "text", text: await parseDocx(file), note: "已从 Word 提取文字" };
    }
    if (ext === "xlsx" || ext === "xls" || /spreadsheetml|ms-excel/.test(file.type)) {
      return { ...base, kind: "text", text: await parseSheet(file), note: "已从 Excel 提取表格" };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ...base, kind: "other", note: `解析失败：${msg}` };
  }

  if (isTextLike(file)) {
    return { ...base, kind: "text", text: truncate(await readAs(file, "text"), MAX_TEXT) };
  }
  return { ...base, kind: "other" };
}

export function humanSize(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}
