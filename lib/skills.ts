// 技能菜单元数据（仅用于前端展示与挑选）。
// name 同时也是技能 id（= 技能文件夹名），用作 lib/skill-library.json 的查找键。
// 真正的提示词正文存在 skill-library.json 里，挂载技能时由后端注入到模型 system。
export type SkillMeta = {
  name: string;     // = 技能 id
  category: string;
  desc: string;     // 中文一句话简介
};

export const SKILLS: SkillMeta[] = [
  { name: "skill-creator", category: "创作", desc: "创建、修改并优化你自己的技能。" },
  { name: "find-skills", category: "创作", desc: "根据需求发现并推荐合适的技能。" },
  { name: "frontend-slides", category: "内容", desc: "生成动效丰富的 HTML 幻灯片演示。" },
  { name: "ai-slide-deck", category: "内容", desc: "按主题自动生成带配图的演示文稿。" },
  { name: "canvas-design", category: "设计", desc: "用设计理念产出精美的 PNG / PDF 视觉稿。" },
  { name: "frontend-design", category: "设计", desc: "生成高质量、可上线的前端界面。" },
  { name: "infographic-creator", category: "设计", desc: "把文字内容做成精美信息图。" },
  { name: "generate-image", category: "图像", desc: "调用多模型生成图片（Gemini / Seedream 等）。" },
  { name: "nano-banana-pro", category: "图像", desc: "用 Gemini 3 Pro Image 生成或编辑图片。" },
  { name: "bg-remover", category: "图像", desc: "AI 智能抠图，去除背景、提取主体。" },
  { name: "generate-video", category: "视频", desc: "调用 Veo / Seedance 等模型生成视频。" },
  { name: "storyboard-to-film", category: "视频", desc: "从故事概念到成片的动画短片流水线。" },
  { name: "pptx", category: "办公", desc: "创建、读取、编辑 PowerPoint 文件。" },
  { name: "docx", category: "办公", desc: "创建、读取、编辑 Word 文档。" },
  { name: "xlsx", category: "办公", desc: "处理电子表格，读写 Excel 数据。" },
  { name: "pdf", category: "办公", desc: "读取、提取、合并、生成 PDF 文件。" },
  { name: "latex-document", category: "办公", desc: "用 LaTeX 排版生成专业 PDF 文档。" },
  { name: "data-storytelling", category: "数据", desc: "把数据转化为有说服力的可视化叙事。" },
  { name: "chart-visualization", category: "数据", desc: "智能选择图表类型可视化你的数据。" },
  { name: "comprehensive-researcher", category: "研究", desc: "对任意主题进行深入的多源研究。" },
  { name: "web-search", category: "研究", desc: "联网搜索并给出 AI 摘要。" },
  { name: "world-class-carousel", category: "内容", desc: "生成世界级的 Instagram 多图文内容。" },
  { name: "happycapy-feishu", category: "集成", desc: "接入飞书 MCP，操作消息 / 文档 / 多维表格。" },
  { name: "gmail", category: "集成", desc: "Gmail 集成，读取、发送、管理邮件。" },
  { name: "notion", category: "集成", desc: "Notion API，创建管理页面与数据库。" },
  { name: "capymail", category: "集成", desc: "用 Capy 发送邮件。" },
  { name: "weather", category: "工具", desc: "查询实时天气与预报，无需 API Key。" },
  { name: "currency-converter", category: "工具", desc: "实时汇率换算。" },
  { name: "github-push", category: "工具", desc: "把本地项目或文件推送到 GitHub。" },
  { name: "readme-generator", category: "工具", desc: "为仓库生成专业的 README。" },
];

export const CATEGORIES = ["全部", "创作", "内容", "设计", "图像", "视频", "办公", "数据", "研究", "集成", "工具"];
