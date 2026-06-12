// 从本地 Happycapy 技能库（~/.claude/skills/<id>/SKILL.md）提取每个技能的「真实提示词」，
// 去掉 YAML frontmatter，生成 lib/skill-library.json。
// 这些 prompt 就是官方技能说明书本体，挂载技能时会被原样注入到模型的 system 里。
//
// 用法：node scripts/build-skill-library.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SKILLS_DIR = join(homedir(), ".claude", "skills");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "skill-library.json");

// 要内置的技能 id（= 技能文件夹名），与 lib/skills.ts 的菜单保持一致
const IDS = [
  "skill-creator", "find-skills", "frontend-slides", "ai-slide-deck", "canvas-design",
  "frontend-design", "infographic-creator", "generate-image", "nano-banana-pro", "bg-remover",
  "generate-video", "storyboard-to-film", "pptx", "docx", "xlsx",
  "pdf", "latex-document", "data-storytelling", "chart-visualization", "comprehensive-researcher",
  "web-search", "world-class-carousel", "happycapy-feishu", "gmail", "notion",
  "capymail", "weather", "currency-converter", "github-push", "readme-generator",
];

// 拆出 frontmatter，返回 { meta, body }
function splitFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, "");
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const fm = text.slice(3, end);
      const body = text.slice(end + 4).replace(/^\s*\n/, "");
      const meta = {};
      for (const line of fm.split("\n")) {
        const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (m) meta[m[1]] = m[2].trim();
      }
      return { meta, body: body.trim() };
    }
  }
  return { meta: {}, body: text.trim() };
}

const out = {};
let missing = [];
for (const id of IDS) {
  const p = join(SKILLS_DIR, id, "SKILL.md");
  if (!existsSync(p)) { missing.push(id); continue; }
  const { meta, body } = splitFrontmatter(readFileSync(p, "utf8"));
  out[id] = {
    name: meta.name || id,
    desc: meta.description || "",
    prompt: body,
  };
}

writeFileSync(OUT, JSON.stringify(out, null, 0), "utf8");
const bytes = Buffer.byteLength(JSON.stringify(out));
console.log(`wrote ${Object.keys(out).length} skills -> ${OUT} (${(bytes / 1024).toFixed(0)} KB)`);
if (missing.length) console.warn("MISSING:", missing.join(", "));
