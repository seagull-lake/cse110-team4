import { defineConfig } from "vite";

export default defineConfig({
  // 启动时直接打开生成器测试页。
  server: {
    open: "/problem-generator.html",
  },
  preview: {
    open: "/problem-generator.html",
  },
  build: {
    rollupOptions: {
      input: { main: "index.html", problemGenerator: "problem-generator.html" },
    },
  },
});
