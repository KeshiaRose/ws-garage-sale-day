import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OVERRIDES_PATH = join(__dirname, "src/data/tag-overrides.json");
const DESC_OVERRIDES_PATH = join(__dirname, "src/data/description-overrides.json");

function makeJsonApi(path) {
  return (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET") {
      res.end(readFileSync(path, "utf-8"));
    } else if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        writeFileSync(path, JSON.stringify(JSON.parse(body), null, 2), "utf-8");
        res.end('{"ok":true}');
      });
    }
  };
}

const overridesApi = {
  name: "overrides-api",
  configureServer(server) {
    server.middlewares.use("/api/overrides", makeJsonApi(OVERRIDES_PATH));
    server.middlewares.use("/api/description-overrides", makeJsonApi(DESC_OVERRIDES_PATH));
  },
};

export default defineConfig({
  plugins: [vue(), tailwindcss(), overridesApi],
});
