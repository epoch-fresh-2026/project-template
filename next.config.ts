import type { NextConfig } from "next";

// GitHub Pages 把项目站挂在 /仓库名 下面。本地构建不设这个变量，页面仍在 /。
const pagesBasePath = process.env.PAGES_BASE_PATH;

const nextConfig: NextConfig = {
  // GitHub Pages 只提供静态文件。Cache Components 会打开 PPR，静态导出不支持。
  output: "export",
  ...(pagesBasePath ? { basePath: pagesBasePath } : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
