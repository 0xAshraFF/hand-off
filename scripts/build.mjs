import { spawnSync } from "node:child_process";
import { mkdirSync, copyFileSync } from "node:fs";
import { build } from "esbuild";
const vite = spawnSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build"],
  { stdio: "inherit" },
);
if (vite.status !== 0) process.exit(vite.status || 1);
await build({
  entryPoints: ["server.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  sourcemap: true,
  outfile: "dist/server.mjs",
});
mkdirSync("dist/data", { recursive: true });
copyFileSync("data/catalog.snapshot.json", "dist/data/catalog.snapshot.json");
