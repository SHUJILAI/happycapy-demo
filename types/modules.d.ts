// mammoth 的浏览器构建没有独立类型声明，这里补一个最小声明。
declare module "mammoth/mammoth.browser.js" {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{
    value: string;
    messages: unknown[];
  }>;
}
