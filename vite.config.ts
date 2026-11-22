import { defineConfig } from "vite-plus"

export default defineConfig({
  test: { include: ["{scripts,src}/**/*_test.ts"] },
  fmt: {
    semi: false,
    ignorePatterns: ["book/**", "dist/**", ".claude/**", ".github/**", ".mcp.json"],
  },
  lint: {
    ignorePatterns: ["book/**", "dist/**"],
    options: { typeAware: true, typeCheck: true },
  },
})
