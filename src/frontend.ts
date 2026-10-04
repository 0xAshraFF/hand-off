export type Preference = "free" | "value" | "quality";
export type Settings = {
  privacy: boolean;
  accessMode: "any" | "api" | "web" | "local";
  hardware: "none" | "cpu" | "gpu";
  region: string;
  durationSeconds: number;
  skillLevel: "basic" | "technical";
};
export const defaultSettings: Settings = {
  privacy: false,
  accessMode: "any",
  hardware: "none",
  region: "",
  durationSeconds: 60,
  skillLevel: "basic",
};
export type Alternative = {
  toolId: string;
  name: string;
  provider: string;
  cost: number | null;
  costLabel: string;
  basis: string;
  type?: "cheaper" | "upgrade" | "alternative";
  tag?: string;
  reason?: string;
  extraSpendReason?: string;
};
export type PlanTask = {
  id: string;
  stage: string;
  title: string;
  purpose: string;
  expectedOutput: string;
  toolId: string;
  toolName: string;
  provider: string;
  cost: number | null;
  costLabel: string;
  costBasis: string;
  reason: string;
  quality?: { status: string; note: string; sourceUrl?: string };
  sourceUrl?: string;
  lastVerified?: string;
  sourceCheck?: { status?: string; checkedAt?: string; note?: string };
  validation?: string[];
  assumptions?: string[];
  costCategory?: string;
  alternatives: Alternative[];
  agentInstruction: string;
  extraSpendReason?: string;
};
export type ProjectPlan = {
  id: string;
  projectName: string;
  goal: string;
  kind: string;
  quantity: number;
  budget: number;
  preference: Preference;
  ownedTools: string[];
  summary: string;
  knownCost: number;
  budgetRemaining: number;
  unpricedCount: number;
  budgetStatus?: "within" | "over" | "unconfirmed";
  warnings?: string[];
  costNote: string;
  priceCheckedAt?: string;
  tasks: PlanTask[];
  sources: Array<{ name: string; url: string; checked?: string }>;
  handoff: string;
  costBreakdown?: unknown;
  planner?: { model: string; usedModelCall: boolean; rule: string };
};
export type CatalogItem = {
  id: string;
  name: string;
  provider: string;
  kind: string;
  tasks: string[];
  tags?: string[];
  access?: { api?: boolean; web?: boolean; local?: boolean };
  pricing?: { type?: string; scope?: string };
  freeTier?: { available: boolean; note?: string };
  sourceUrl?: string;
  lastVerified?: string;
  sourceCheck?: { status?: string; checkedAt?: string; note?: string };
  stale?: boolean;
  quality?: { status: string; note: string; sourceUrl?: string };
};
export type Catalog = {
  generatedAt?: string;
  items: CatalogItem[];
  sourceChecks?: Array<{
    source: string;
    ok?: boolean;
    status?: string;
    checkedAt?: string;
    note?: string;
  }>;
};
export type Offer = {
  id: string;
  toolId?: string;
  title?: string;
  name?: string;
  provider?: string;
  description?: string;
  limits?: string | string[];
  eligibility?: string | string[];
  eligible?: boolean;
  status?: string;
  expiresAt?: string | null;
  lastVerified?: string;
  checkedAt?: string;
  sourceUrl?: string;
  fallback?: string;
  fallbackToolId?: string;
  check?: { status?: string; checkedAt?: string; note?: string };
};
export type Outcome = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  variant: "video" | "ad" | "finance" | "trading" | "research" | "documents";
  example: string;
  quantity: number;
  sections: string[];
  styles: string[];
  capabilities: string[];
};
export const outcomes: Outcome[] = [
  {
    id: "faceless",
    title: "Create faceless videos",
    description: "Scripts, visuals, voice, captions and final video checks.",
    category: "Content",
    difficulty: "Easy",
    variant: "video",
    example: "Create 10 faceless educational videos for YouTube Shorts.",
    quantity: 10,
    sections: ["Prepare", "Make", "Check", "Publish"],
    styles: ["Educational", "Cinematic"],
    capabilities: ["video", "writing", "audio", "editing"],
  },
  {
    id: "shop-ads",
    title: "Make ads for my shop",
    description: "Product visuals, ad copy and variants for social campaigns.",
    category: "Shopping",
    difficulty: "Easy",
    variant: "ad",
    example: "Create 10 product ad images for my online skincare shop.",
    quantity: 10,
    sections: ["Prepare", "Make", "Check"],
    styles: ["Photography", "Minimal"],
    capabilities: ["image", "design", "product ads"],
  },
  {
    id: "finance",
    title: "Build a finance tracker",
    description: "A personal finance web app with charts and categories.",
    category: "Tools & apps",
    difficulty: "Medium",
    variant: "finance",
    example:
      "Build a personal finance tracker web app with income, expenses and monthly charts.",
    quantity: 1,
    sections: ["Prepare", "Make", "Check", "Publish"],
    styles: ["Dashboard", "Minimal"],
    capabilities: ["coding", "hosting"],
  },
  {
    id: "trading",
    title: "Create a trading indicator",
    description: "Turn your rules into an indicator and validation checklist.",
    category: "Finance",
    difficulty: "Advanced",
    variant: "trading",
    example:
      "Build a TradingView indicator from my entry, stop loss and take profit rules.",
    quantity: 1,
    sections: ["Prepare", "Make", "Check"],
    styles: ["Dashboard"],
    capabilities: ["coding", "review"],
  },
  {
    id: "research",
    title: "Build a research assistant",
    description: "Compare papers and answer questions with traceable sources.",
    category: "Research",
    difficulty: "Medium",
    variant: "research",
    example:
      "Build a research assistant that compares papers and returns cited answers.",
    quantity: 1,
    sections: ["Prepare", "Make", "Check"],
    styles: ["Evidence first", "Minimal"],
    capabilities: ["research", "analysis", "coding"],
  },
  {
    id: "documents",
    title: "Extract information from documents",
    description: "Convert invoices, receipts or reports into structured data.",
    category: "Automation",
    difficulty: "Medium",
    variant: "documents",
    example:
      "Extract vendor, date, total and line items from 100 invoices into structured JSON.",
    quantity: 100,
    sections: ["Prepare", "Make", "Check"],
    styles: ["Structured data"],
    capabilities: ["vision", "ocr", "document", "analysis"],
  },
];
export type Filters = {
  query: string;
  category: string;
  section: string;
  style: string;
  difficulty: string;
  budget: string;
  free: boolean;
  local: boolean;
  api: boolean;
};
export const emptyFilters: Filters = {
  query: "",
  category: "",
  section: "",
  style: "",
  difficulty: "",
  budget: "",
  free: false,
  local: false,
  api: false,
};
export const categories = [...new Set(outcomes.map((o) => o.category))];
export const sections = [...new Set(outcomes.flatMap((o) => o.sections))];
export const styles = [...new Set(outcomes.flatMap((o) => o.styles))];
export function candidates(outcome: Outcome, catalog: Catalog | null) {
  return (catalog?.items || []).filter((item) =>
    outcome.capabilities.some((cap) =>
      [item.kind, ...(item.tasks || []), ...(item.tags || [])].some((tag) =>
        tag.toLowerCase().includes(cap),
      ),
    ),
  );
}
export function budgetStatus(plan: ProjectPlan) {
  return (
    plan.budgetStatus || (plan.knownCost > plan.budget ? "over" : "unconfirmed")
  );
}
export function filterOutcomes(
  filters: Filters,
  catalog: Catalog | null,
  previews: Record<string, ProjectPlan>,
) {
  return outcomes.filter((o) => {
    const haystack = [
      o.title,
      o.description,
      o.example,
      o.category,
      ...o.sections,
      ...o.styles,
      ...candidates(o, catalog).map((i) => i.name + " " + i.provider),
    ]
      .join(" ")
      .toLowerCase();
    return (
      filters.query
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .every((word) => haystack.includes(word)) &&
      (!filters.category || o.category === filters.category) &&
      (!filters.section || o.sections.includes(filters.section)) &&
      (!filters.style || o.styles.includes(filters.style)) &&
      (!filters.difficulty || o.difficulty === filters.difficulty) &&
      (!(filters.free || filters.local || filters.api) ||
        (!!previews[o.id] &&
          previews[o.id].tasks.length > 0 &&
          (!filters.free ||
            (budgetStatus(previews[o.id]) === "within" &&
              previews[o.id].knownCost === 0 &&
              previews[o.id].tasks.every(
                (t) => t.cost === 0 && ["free", "owned"].includes(t.costBasis),
              ))) &&
          (!filters.local ||
            previews[o.id].tasks.every(
              (t) =>
                catalog?.items.find((i) => i.id === t.toolId)?.access?.local,
            )) &&
          (!filters.api ||
            previews[o.id].tasks.every(
              (t) => catalog?.items.find((i) => i.id === t.toolId)?.access?.api,
            )))) &&
      (!filters.budget ||
        (!!previews[o.id] &&
          budgetStatus(previews[o.id]) === "within" &&
          previews[o.id].knownCost <= Number(filters.budget)))
    );
  });
}
export function dateLabel(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
}
export function safeUrl(value?: string) {
  try {
    const url = new URL(value || "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    signal: init?.signal || AbortSignal.timeout(60000),
  });
  let payload: { error?: string };
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      "The server did not return JSON. Please try again when the API is available.",
    );
  }
  if (!response.ok)
    throw new Error(
      payload.error || "Request failed (" + response.status + ").",
    );
  return payload as T;
}
