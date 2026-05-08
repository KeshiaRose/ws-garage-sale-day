import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OVERRIDES_PATH = join(__dirname, "src/data/tag-overrides.json");

const overridesApi = {
  name: "overrides-api",
  configureServer(server) {
    server.middlewares.use("/api/overrides", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.method === "GET") {
        res.end(readFileSync(OVERRIDES_PATH, "utf-8"));
      } else if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          writeFileSync(OVERRIDES_PATH, JSON.stringify(JSON.parse(body), null, 2), "utf-8");
          res.end('{"ok":true}');
        });
      }
    });
  },
};

export default defineConfig({
  plugins: [vue(), tailwindcss(), overridesApi],
});
