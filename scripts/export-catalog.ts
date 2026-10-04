import fs from "node:fs";
import path from "node:path";
import { loadCatalog } from "../lib/catalog";
import { catalogSql } from "../lib/catalog-sql";
const output = process.argv[2];
if (!output)
  throw new Error(
    "Provide an output .sql path; apply the reviewed SQL server-side after migration.",
  );
const target = path.resolve(output);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, catalogSql(loadCatalog()));
console.log("Validated catalog SQL exported to " + target);
