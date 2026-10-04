import type { CatalogItem, Pricing } from "../catalog";
export const parserVersion = "official-tables-v1";
const text = (s: string) =>
  s
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
export function rows(html: string) {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      text(cell[1]),
    ),
  );
}
function dollars(cell: string) {
  const m = cell.match(/^\$(\d+(?:\.\d+)?)$/);
  if (!m) throw new Error("Rate is not an unambiguous USD value.");
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n > 1000)
    throw new Error("Rate outside parser safety range.");
  return n;
}
export type ParsedPrice = {
  pricing: Pricing;
  freeTier?: CatalogItem["freeTier"];
};
export function parseQwen(html: string, item: CatalogItem): ParsedPrice {
  const model =
    item.id === "qwen-image-2-0"
      ? "qwen-image-2.0"
      : item.id.replace(/-/g, "-");
  const matches = rows(html).filter(
    (r) => r[0] === model && r[1] === "International",
  );
  if (matches.length !== 1)
    throw new Error("Unique international Qwen row not found.");
  const m = matches[0][2]?.match(/^\$(\d+(?:\.\d+)?)\s*\/\s*image$/);
  if (!m) throw new Error("Qwen per-image rate not found.");
  const quota = matches[0][3]?.match(/^(\d+) images$/);
  return {
    pricing: {
      ...item.pricing,
      type: "per_image",
      currency: "USD",
      unitCost: dollars("$" + m[1]),
      unit: "image",
      scope: "International / Singapore API; output image rate",
    },
    freeTier: {
      available: Boolean(quota),
      unconditional: false,
      quota: quota ? { images: Number(quota[1]) } : null,
      note: quota
        ? "Official Singapore quota: " +
          quota[1] +
          " images. Account activation, eligibility and expiry conditions apply; confirm before assuming free usage."
        : "No quota confirmed in the parsed international row.",
    },
  };
}
export function parseGoogle(html: string, item: CatalogItem): ParsedPrice {
  const marker = html.match(
    /<h2\b[^>]*id=["']gemini-3\.1-flash-image["'][^>]*>/i,
  );
  if (!marker || marker.index === undefined)
    throw new Error("Google model section missing.");
  const section = html.slice(marker.index).split(/<h2\b/i)[1];
  if (!section) throw new Error("Google section changed.");
  const standard = section.match(
    /<h3\b[^>]*>Standard<\/h3>([\s\S]*?)<\/table>/i,
  );
  if (!standard) throw new Error("Standard pricing table missing.");
  const output = rows(standard[1]).find((r) => r[0] === "Output price");
  const input = rows(standard[1]).find((r) => r[0] === "Input price");
  const m = output?.[2]?.match(/\$(\d+(?:\.\d+)?)\s+per\s+1K image\b/i);
  const im = input?.[2]?.match(/^\$(\d+(?:\.\d+)?)\s+\(text\/image\)$/i);
  if (!m || !im || output?.[1] !== "Not available")
    throw new Error("Google 1K standard output/input/free-tier cells changed.");
  return {
    pricing: {
      ...item.pricing,
      type: "per_image",
      currency: "USD",
      unitCost: dollars("$" + m[1]),
      inputPer1M: dollars("$" + im[1]),
      unit: "1K image",
      scope:
        "Standard 1K output plus input tokens; batch and grounding excluded",
    },
    freeTier: {
      available: false,
      note: "No free-tier image output in the standard API pricing table.",
    },
  };
}
export function parseDeepSeek(html: string, item: CatalogItem): ParsedPrice {
  const table = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].find(
    (t) => {
      const r = rows(t[0]);
      return (
        r[0]?.[0] === "MODEL" &&
        r[0].includes("deepseek-flash") &&
        r[0].includes("deepseek-v4-pro")
      );
    },
  );
  if (!table) throw new Error("DeepSeek model pricing table missing.");
  const r = rows(table[0]),
    header = r[0].slice(-2),
    index = header.indexOf(item.id);
  if (index < 0) throw new Error("DeepSeek model column missing.");
  const peak = (label: string) => {
    const at = r.findIndex((c) => c.some((v) => v.includes(label)));
    if (at < 0 || r[at + 1]?.[0] !== "PEAK")
      throw new Error("DeepSeek peak pricing labels changed.");
    return dollars(r[at + 1].slice(-2)[index]);
  };
  return {
    pricing: {
      ...item.pricing,
      type: "token",
      currency: "USD",
      inputPer1M: peak("CACHE MISS"),
      cachedInputPer1M: peak("CACHE HIT"),
      outputPer1M: peak("OUTPUT TOKENS"),
      scope: "Peak USD rates per 1M tokens; caching/off-peak may reduce spend",
    },
  };
}
export function pricingAdapter(item: CatalogItem) {
  if (
    item.id === "qwen-image-2-0" &&
    new URL(item.sourceUrl).hostname === "www.alibabacloud.com"
  )
    return parseQwen;
  if (
    item.id === "gemini-3-1-flash-image" &&
    new URL(item.sourceUrl).hostname === "ai.google.dev"
  )
    return parseGoogle;
  if (
    ["deepseek-flash", "deepseek-v4-pro"].includes(item.id) &&
    new URL(item.sourceUrl).hostname === "api-docs.deepseek.com"
  )
    return parseDeepSeek;
  return undefined;
}
