import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // This config is dedicated to the project-site build, so assets must always
  // resolve beneath the repository path—even when we publish it manually.
  base: "/last-ten-seats/",
  plugins: [react()],
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
  },
});
