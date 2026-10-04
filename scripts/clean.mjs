import { rmSync } from "node:fs";
for (const target of ["dist", "server.js"])
  rmSync(new URL("../" + target, import.meta.url), {
    recursive: true,
    force: true,
  });
