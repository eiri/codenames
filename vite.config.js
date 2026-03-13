import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { Features } from "lightningcss";
import path from "path";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // https://stackoverflow.com/questions/79879525/installing-the-tailwindcss-vite-plugin-with-vite-8-peer-vite5-2-0-6/79879526#79879526
  css: {
    lighningcss: {
      drafts: {
        customMedia: true,
      },
      nonStandard: {
        deepSelectorCombinator: true,
      },
      include: Features.Nesting | Features.MediaQueries,
      exclude:
        Features.LogicalProperties | Features.DirSelector | Features.LightDark,
      targets: {
        safari: (16 << 16) | (4 << 8),
        ios_saf: (16 << 16) | (4 << 8),
        firefox: 128 << 16,
        chrome: 111 << 16,
      },
      errorRecovery: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
  },
});
