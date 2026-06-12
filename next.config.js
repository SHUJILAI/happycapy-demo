/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdfjs-dist 在 Node 环境会可选引用 canvas，浏览器端用不到，置为 false 避免打包报错。
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false };
    return config;
  },
};

module.exports = nextConfig;
