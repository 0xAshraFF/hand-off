import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '2mb' }));

type Pricing = {
  type: string;
  currency: string;
  unitCost?: number;
  unit?: string;
  inputPer1M?: number;
  outputPer1M?: number;
  scope?: string;
};

type CatalogItem = {
  id: string;
  name: string;
  provider: string;
  kind: string;
  tasks: string[];
  pricing: Pricing;
  freeTier?: { available: boolean; note?: string };
  access?: { api?: boolean; web?: boolean; local?: boolean };
  quality?: { status: string; note: string };
  sourceUrl: string;
  lastVerified: string;
  tags: string[];
};

type CatalogSnapshot = {
  version: number;
  generatedAt: string;
  policy: Record<string, unknown>;
  items: CatalogItem[];
};

type Preference = 'free' | 'value' | 'quality';

type PlanOption = {
  toolId: string;
  label: string;
  cost: number | null;
  costLabel: string;
  costBasis: 'verified' | 'estimated' | 'owned' | 'free' | 'unknown';
};

type DraftTask = {
  id: string;
  stage: 'Prepare' | 'Make' | 'Check' | 'Publish';
  title: string;
  purpose: string;
  expectedOutput: string;
  options: PlanOption[];
  selectedToolId: string;
};

type PlanRequest = {
  projectName?: string;
  goal: string;
  budget?: number;
  quantity?: number;
  preference?: Preference;
  ownedTools?: string[];
  explanation?: 'guide' | 'details';
};

function loadCatalog(): CatalogSnapshot {
  const candidates = [
    path.join(process.cwd(), 'data', 'catalog.snapshot.json'),
    path.join(__dirname, 'data', 'catalog.snapshot.json'),
    path.join(process.cwd(), 'dist', 'data', 'catalog.snapshot.json')
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as CatalogSnapshot;
    }
  }
  throw new Error('Catalog snapshot is missing');
}

function itemById(catalog: CatalogSnapshot, id: string) {
  return catalog.items.find((item) => item.id === id);
}

function owned(ownedTools: string[], name: string) {
  const haystack = ownedTools.map((x) => x.toLowerCase());
  return haystack.some((x) => x.includes(name.toLowerCase()));
}

function tokenCost(item: CatalogItem | undefined, inputTokens: number, outputTokens: number) {
  if (!item?.pricing.inputPer1M || !item?.pricing.outputPer1M) return null;
  return Number(
    ((inputTokens / 1_000_000) * item.pricing.inputPer1M +
      (outputTokens / 1_000_000) * item.pricing.outputPer1M).toFixed(4)
  );
}

function perUnitCost(item: CatalogItem | undefined, quantity: number) {
  if (typeof item?.pricing.unitCost !== 'number') return null;
  return Number((item.pricing.unitCost * quantity).toFixed(2));
}

function makeOption(
  catalog: CatalogSnapshot,
  toolId: string,
  quantity: number,
  params?: { inputTokens?: number; outputTokens?: number; owned?: boolean; estimate?: number; label?: string }
): PlanOption {
  const item = itemById(catalog, toolId);
  let cost: number | null = null;
  let costBasis: PlanOption['costBasis'] = 'unknown';
  let costLabel = 'Price checked at plan time';

  if (params?.owned) {
    cost = 0;
    costBasis = 'owned';
    costLabel = 'Already owned — $0 incremental';
  } else if (item?.pricing.type === 'per_image') {
    cost = perUnitCost(item, quantity);
    costBasis = 'verified';
    costLabel = cost === null ? 'Usage based' : `~$${cost.toFixed(2)} for ${quantity}`;
  } else if (item?.pricing.type === 'token') {
    cost = tokenCost(item, params?.inputTokens || 30_000, params?.outputTokens || 10_000);
    costBasis = 'verified';
    costLabel = cost === null ? 'Usage based' : `~$${cost.toFixed(2)} API usage`;
  } else if (typeof params?.estimate === 'number') {
    cost = Number(params.estimate.toFixed(2));
    costBasis = 'estimated';
    costLabel = `~$${cost.toFixed(2)} estimate`;
  } else if (item?.freeTier?.available && ['editor', 'design', 'hosting'].includes(item.kind)) {
    cost = 0;
    costBasis = 'free';
    costLabel = 'Free route available';
  }

  return {
    toolId,
    label: params?.label || item?.name || toolId,
    cost,
    costLabel,
    costBasis
  };
}

function classifyGoal(goal: string) {
  const text = goal.toLowerCase();
  if (/video|reel|youtube|tiktok|short-form|short form|faceless/.test(text)) return 'video';
  if (/image|photo|creative|poster|ad creative|product shot/.test(text)) return 'image';
  if (/research|paper|literature|assistant|study/.test(text)) return 'research';
  if (/pdf|invoice|receipt|extract|document|ocr/.test(text)) return 'documents';
  if (/app|website|web app|tool|dashboard|automation|agent|saas|extension/.test(text)) return 'app';
  return 'general';
}

function chooseByPreference(task: DraftTask, preference: Preference, budget: number) {
  const priced = task.options.filter((o) => o.cost !== null);
  if (!priced.length) return task.options[0]?.toolId || task.selectedToolId;

  if (preference === 'free') {
    const free = priced.find((o) => o.cost === 0);
    if (free) return free.toolId;
    return [...priced].sort((a, b) => (a.cost || 0) - (b.cost || 0))[0].toolId;
  }

  if (preference === 'quality') {
    // Options are intentionally ordered from value to quality, so choose the last affordable one.
    const affordable = priced.filter((o) => (o.cost || 0) <= Math.max(0.01, budget * 0.75));
    return (affordable[affordable.length - 1] || priced[priced.length - 1]).toolId;
  }

  // Best value: choose first non-free paid option when it is comfortably in budget,
  // otherwise take the cheapest known-cost route.
  const affordable = priced.filter((o) => (o.cost || 0) <= Math.max(0.01, budget * 0.6));
  return (affordable[0] || [...priced].sort((a, b) => (a.cost || 0) - (b.cost || 0))[0]).toolId;
}

function buildDraft(req: Required<Pick<PlanRequest, 'goal' | 'budget' | 'quantity' | 'preference' | 'ownedTools'>> & PlanRequest, catalog: CatalogSnapshot): DraftTask[] {
  const kind = classifyGoal(req.goal);
  const q = Math.max(1, Math.round(req.quantity));
  const hasChatGPT = owned(req.ownedTools, 'chatgpt');
  const hasClaude = owned(req.ownedTools, 'claude');
  const hasCanva = owned(req.ownedTools, 'canva');
  const hasCapCut = owned(req.ownedTools, 'capcut');

  let tasks: DraftTask[];

  if (kind === 'image') {
    tasks = [
      {
        id: 'prepare',
        stage: 'Prepare',
        title: 'Define the creative brief',
        purpose: 'Turn the goal into a concise brief, visual constraints and prompt set.',
        expectedOutput: 'Approved brief + prompt variants',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 18_000, outputTokens: 6_000 }),
          makeOption(catalog, 'chatgpt-plus', 1, { owned: hasChatGPT }),
          makeOption(catalog, 'glm-5-3', 1)
        ],
        selectedToolId: 'deepseek-flash'
      },
      {
        id: 'make',
        stage: 'Make',
        title: `Generate ${q} final images`,
        purpose: 'Create the requested image set with the best cost/quality fit.',
        expectedOutput: `${q} production-ready images`,
        options: [
          makeOption(catalog, 'qwen-image-2-0', q),
          makeOption(catalog, 'gemini-3-1-flash-image', q)
        ],
        selectedToolId: req.preference === 'quality' ? 'gemini-3-1-flash-image' : 'qwen-image-2-0'
      },
      {
        id: 'check',
        stage: 'Check',
        title: 'Review consistency and text accuracy',
        purpose: 'Reject weak variants and verify product, text and layout consistency.',
        expectedOutput: 'QA checklist + accepted assets',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 12_000, outputTokens: 4_000 }),
          makeOption(catalog, 'chatgpt-plus', 1, { owned: hasChatGPT })
        ],
        selectedToolId: hasChatGPT ? 'chatgpt-plus' : 'deepseek-flash'
      },
      {
        id: 'publish',
        stage: 'Publish',
        title: 'Finish and export',
        purpose: 'Apply final sizing, brand layout and export variants.',
        expectedOutput: 'Export pack in required aspect ratios',
        options: [makeOption(catalog, 'canva', q, { owned: hasCanva })],
        selectedToolId: 'canva'
      }
    ];
  } else if (kind === 'video') {
    tasks = [
      {
        id: 'prepare',
        stage: 'Prepare',
        title: 'Outline topics and write scripts',
        purpose: 'Create hooks, scripts and scene directions before spending on generation.',
        expectedOutput: `${q} approved scripts + shot list`,
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 30_000, outputTokens: 12_000 }),
          makeOption(catalog, 'chatgpt-plus', 1, { owned: hasChatGPT }),
          makeOption(catalog, 'glm-5-3', 1)
        ],
        selectedToolId: hasChatGPT ? 'chatgpt-plus' : 'deepseek-flash'
      },
      {
        id: 'make',
        stage: 'Make',
        title: 'Generate voice and visual clips',
        purpose: 'Generate only approved scenes, then assemble them into short-form videos.',
        expectedOutput: `${q} rough-cut videos`,
        options: [
          makeOption(catalog, 'kling', q, { estimate: Math.max(1, q * 0.65) })
        ],
        selectedToolId: 'kling'
      },
      {
        id: 'check',
        stage: 'Check',
        title: 'Edit, caption and review',
        purpose: 'Fix pacing, captions, factual issues and visual inconsistencies.',
        expectedOutput: `${q} polished videos`,
        options: [
          makeOption(catalog, 'capcut', q, { owned: hasCapCut }),
          makeOption(catalog, 'davinci-resolve', q)
        ],
        selectedToolId: hasCapCut ? 'capcut' : 'davinci-resolve'
      },
      {
        id: 'publish',
        stage: 'Publish',
        title: 'Prepare publish package',
        purpose: 'Generate titles, descriptions, thumbnails and a simple measurement checklist.',
        expectedOutput: 'Publish pack + 7-day review checklist',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 12_000, outputTokens: 5_000 }),
          makeOption(catalog, 'chatgpt-plus', 1, { owned: hasChatGPT })
        ],
        selectedToolId: hasChatGPT ? 'chatgpt-plus' : 'deepseek-flash'
      }
    ];
  } else if (kind === 'app') {
    tasks = [
      {
        id: 'prepare',
        stage: 'Prepare',
        title: 'Turn the idea into an implementation brief',
        purpose: 'Define scope, user flow, acceptance criteria and technical constraints.',
        expectedOutput: 'Build-ready brief + task list',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 35_000, outputTokens: 12_000 }),
          makeOption(catalog, 'glm-5-3', 1),
          makeOption(catalog, 'chatgpt-plus', 1, { owned: hasChatGPT })
        ],
        selectedToolId: hasChatGPT ? 'chatgpt-plus' : 'deepseek-flash'
      },
      {
        id: 'make',
        stage: 'Make',
        title: 'Build the working product',
        purpose: 'Implement the smallest production-usable version, not a throwaway demo.',
        expectedOutput: 'Working repo + setup instructions',
        options: [
          makeOption(catalog, 'glm-5-3', 1),
          makeOption(catalog, 'deepseek-v4-pro', 1, { inputTokens: 120_000, outputTokens: 45_000 }),
          makeOption(catalog, 'claude-sonnet', 1, { owned: hasClaude })
        ],
        selectedToolId: hasClaude ? 'claude-sonnet' : 'deepseek-v4-pro'
      },
      {
        id: 'check',
        stage: 'Check',
        title: 'Review against acceptance criteria',
        purpose: 'Check functional gaps, edge cases, security basics and deployment readiness.',
        expectedOutput: 'QA report + fix list',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 40_000, outputTokens: 10_000 }),
          makeOption(catalog, 'glm-5-3', 1)
        ],
        selectedToolId: 'deepseek-flash'
      },
      {
        id: 'publish',
        stage: 'Publish',
        title: 'Deploy and document',
        purpose: 'Ship the app and leave a concise handoff for the next agent or developer.',
        expectedOutput: 'Live deployment + README + handoff',
        options: [makeOption(catalog, 'cloudflare-pages', 1)],
        selectedToolId: 'cloudflare-pages'
      }
    ];
  } else if (kind === 'research') {
    tasks = [
      {
        id: 'prepare',
        stage: 'Prepare',
        title: 'Frame the research question',
        purpose: 'Define the answer format, evidence bar and exclusions.',
        expectedOutput: 'Research brief',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 20_000, outputTokens: 6_000 }),
          makeOption(catalog, 'chatgpt-plus', 1, { owned: hasChatGPT })
        ],
        selectedToolId: hasChatGPT ? 'chatgpt-plus' : 'deepseek-flash'
      },
      {
        id: 'make',
        stage: 'Make',
        title: 'Analyze and synthesize the source set',
        purpose: 'Extract claims, compare viewpoints and structure the answer.',
        expectedOutput: 'Evidence-backed synthesis',
        options: [
          makeOption(catalog, 'deepseek-v4-pro', 1, { inputTokens: 90_000, outputTokens: 30_000 }),
          makeOption(catalog, 'glm-5-3', 1)
        ],
        selectedToolId: req.preference === 'quality' ? 'deepseek-v4-pro' : 'glm-5-3'
      },
      {
        id: 'check',
        stage: 'Check',
        title: 'Verify claims and citations',
        purpose: 'Separate sourced facts from inference and flag weak evidence.',
        expectedOutput: 'Verified notes + gaps',
        options: [makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 35_000, outputTokens: 8_000 })],
        selectedToolId: 'deepseek-flash'
      },
      {
        id: 'publish',
        stage: 'Publish',
        title: 'Package the research',
        purpose: 'Produce the requested concise report and an agent-ready continuation prompt.',
        expectedOutput: 'Final report + continuation handoff',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 18_000, outputTokens: 8_000 }),
          makeOption(catalog, 'chatgpt-plus', 1, { owned: hasChatGPT })
        ],
        selectedToolId: hasChatGPT ? 'chatgpt-plus' : 'deepseek-flash'
      }
    ];
  } else {
    // Documents and general tasks use the same conservative workflow.
    tasks = [
      {
        id: 'prepare',
        stage: 'Prepare',
        title: 'Define inputs, outputs and edge cases',
        purpose: 'Make the job precise before choosing tooling.',
        expectedOutput: 'Input/output contract',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 18_000, outputTokens: 5_000 }),
          makeOption(catalog, 'chatgpt-plus', 1, { owned: hasChatGPT })
        ],
        selectedToolId: hasChatGPT ? 'chatgpt-plus' : 'deepseek-flash'
      },
      {
        id: 'make',
        stage: 'Make',
        title: kind === 'documents' ? 'Extract and structure the information' : 'Execute the core work',
        purpose: kind === 'documents' ? 'Convert the source material into clean structured data.' : 'Use the most appropriate verified route for the core task.',
        expectedOutput: kind === 'documents' ? 'Structured dataset + exception list' : 'Working first result',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 70_000, outputTokens: 18_000 }),
          makeOption(catalog, 'deepseek-v4-pro', 1, { inputTokens: 70_000, outputTokens: 18_000 }),
          makeOption(catalog, 'glm-5-3', 1)
        ],
        selectedToolId: req.preference === 'quality' ? 'deepseek-v4-pro' : 'deepseek-flash'
      },
      {
        id: 'check',
        stage: 'Check',
        title: 'Validate the result',
        purpose: 'Check accuracy, missing cases and user constraints.',
        expectedOutput: 'QA checklist',
        options: [makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 20_000, outputTokens: 6_000 })],
        selectedToolId: 'deepseek-flash'
      },
      {
        id: 'publish',
        stage: 'Publish',
        title: 'Create the final handoff',
        purpose: 'Package the result so a person or agent can continue without re-explaining the project.',
        expectedOutput: 'Concise handoff',
        options: [
          makeOption(catalog, 'deepseek-flash', 1, { inputTokens: 12_000, outputTokens: 6_000 }),
          makeOption(catalog, 'chatgpt-plus', 1, { owned: hasChatGPT })
        ],
        selectedToolId: hasChatGPT ? 'chatgpt-plus' : 'deepseek-flash'
      }
    ];
  }

  // Apply preference only when a task did not have a deliberately chosen default.
  return tasks.map((task) => ({
    ...task,
    selectedToolId: task.selectedToolId || chooseByPreference(task, req.preference, req.budget)
  }));
}

async function maybeRefineWithPlanner(
  req: PlanRequest & { budget: number; quantity: number; preference: Preference; ownedTools: string[] },
  catalog: CatalogSnapshot,
  draft: DraftTask[]
): Promise<{ tasks: DraftTask[]; model: string; used: boolean }> {
  let apiKey = process.env.PLANNER_API_KEY || '';
  let baseUrl = process.env.PLANNER_BASE_URL || '';
  let model = process.env.PLANNER_MODEL || '';

  if (!apiKey && process.env.DEEPSEEK_API_KEY) {
    apiKey = process.env.DEEPSEEK_API_KEY;
    baseUrl = 'https://api.deepseek.com';
    model = model || 'deepseek-flash';
  }

  if (!apiKey || !baseUrl || !model) {
    return { tasks: draft, model: 'deterministic router', used: false };
  }

  const candidates = draft.map((task) => ({
    id: task.id,
    stage: task.stage,
    title: task.title,
    purpose: task.purpose,
    expectedOutput: task.expectedOutput,
    options: task.options
  }));

  const prompt = {
    project: {
      goal: req.goal,
      budget: req.budget,
      quantity: req.quantity,
      preference: req.preference,
      ownedTools: req.ownedTools
    },
    rules: [
      'Choose exactly one toolId from each task options array.',
      'Never invent a model, tool, price, discount, free tier, benchmark or source.',
      'Prefer zero incremental cost when an owned tool is adequate.',
      'Stay within budget when known costs make that possible.',
      'For best-value preference, do not pay more unless the quality difference matters to the stated job.',
      'Return concise JSON only.'
    ],
    tasks: candidates
  };

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are Handoff Planner. Route a project across already-verified candidates. You are a chooser, not a source of pricing facts.'
          },
          { role: 'user', content: JSON.stringify(prompt) }
        ]
      })
    });

    if (!response.ok) throw new Error(`Planner returned ${response.status}`);
    const payload: any = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || '{}');
    const selections: Record<string, string> = {};

    for (const row of parsed.tasks || []) {
      if (row?.id && row?.selectedToolId) selections[row.id] = row.selectedToolId;
    }

    const refined = draft.map((task) => {
      const selected = selections[task.id];
      const valid = selected && task.options.some((o) => o.toolId === selected);
      return valid ? { ...task, selectedToolId: selected } : task;
    });

    return { tasks: refined, model, used: true };
  } catch (error) {
    console.warn('Planner refinement failed; using deterministic route.', error);
    return { tasks: draft, model: 'deterministic router', used: false };
  }
}

function finalizePlan(
  req: PlanRequest & { budget: number; quantity: number; preference: Preference; ownedTools: string[] },
  catalog: CatalogSnapshot,
  tasks: DraftTask[],
  plannerModel: string,
  plannerUsed: boolean
) {
  const completed = tasks.map((task) => {
    const selected = task.options.find((o) => o.toolId === task.selectedToolId) || task.options[0];
    const item = itemById(catalog, selected.toolId);
    const alternatives = task.options
      .filter((o) => o.toolId !== selected.toolId)
      .map((option) => {
        const alt = itemById(catalog, option.toolId);
        return {
          toolId: option.toolId,
          name: alt?.name || option.label,
          provider: alt?.provider || '',
          cost: option.cost,
          costLabel: option.costLabel,
          basis: option.costBasis
        };
      });

    const reasonParts = [
      selected.costBasis === 'owned' ? 'uses a tool you already pay for' : '',
      selected.costBasis === 'free' ? 'keeps incremental spend at zero' : '',
      selected.costBasis === 'verified' && req.preference !== 'quality' ? 'fits the cost target with verified pricing' : '',
      req.preference === 'quality' ? 'prioritizes output quality within the available route' : ''
    ].filter(Boolean);

    return {
      id: task.id,
      stage: task.stage,
      title: task.title,
      purpose: task.purpose,
      expectedOutput: task.expectedOutput,
      toolId: selected.toolId,
      toolName: item?.name || selected.label,
      provider: item?.provider || 'Unknown provider',
      cost: selected.cost,
      costLabel: selected.costLabel,
      costBasis: selected.costBasis,
      reason: reasonParts[0] || item?.quality?.note || 'Best fit from the current candidate set.',
      quality: item?.quality || { status: 'not-tested', note: 'Not tested' },
      sourceUrl: item?.sourceUrl,
      lastVerified: item?.lastVerified,
      alternatives,
      agentInstruction: `${task.stage}: ${task.title}. Use ${item?.name || selected.label}. Goal: ${req.goal}. Deliver: ${task.expectedOutput}. Do not add paid tools unless the user approves a budget change.`
    };
  });

  const knownCost = Number(
    completed.reduce((sum, task) => sum + (typeof task.cost === 'number' ? task.cost : 0), 0).toFixed(2)
  );
  const unpricedCount = completed.filter((task) => task.cost === null).length;
  const withinBudget = knownCost <= req.budget;
  const kind = classifyGoal(req.goal);

  const sources = Array.from(
    new Map(
      completed
        .filter((task) => task.sourceUrl)
        .map((task) => [task.sourceUrl, { name: `${task.toolName} pricing/source`, url: task.sourceUrl, checked: task.lastVerified }])
    ).values()
  );

  const handoff = [
    `# HANDOFF — ${req.projectName || req.goal.slice(0, 72)}`,
    `Goal: ${req.goal}`,
    `Budget ceiling: $${req.budget.toFixed(2)}`,
    `Preference: ${req.preference}`,
    `Existing tools: ${req.ownedTools.length ? req.ownedTools.join(', ') : 'None provided'}`,
    '',
    '## Route',
    ...completed.map(
      (task, index) =>
        `${index + 1}. ${task.stage} — ${task.toolName}: ${task.expectedOutput}. ${task.agentInstruction}`
    ),
    '',
    '## Guardrails',
    '- Treat catalog prices as source data, not model memory.',
    '- Re-check any item marked estimated or unknown before spending.',
    '- Do not introduce another paid subscription unless it materially improves the requested result and stays within budget.',
    '- Keep outputs concise and preserve the requested deliverables.'
  ].join('\n');

  return {
    id: `plan-${Date.now()}`,
    projectName: req.projectName || req.goal.slice(0, 72),
    goal: req.goal,
    kind,
    quantity: req.quantity,
    budget: req.budget,
    preference: req.preference,
    ownedTools: req.ownedTools,
    summary: withinBudget
      ? `A ${req.preference === 'quality' ? 'quality-first' : req.preference === 'free' ? 'lowest-cost' : 'best-value'} route that keeps known spend within your $${req.budget.toFixed(2)} budget.`
      : `The current known-cost route is above budget. Use the lower-cost alternatives before starting paid generation.`,
    knownCost,
    budgetRemaining: Number((req.budget - knownCost).toFixed(2)),
    unpricedCount,
    costNote:
      unpricedCount > 0
        ? `${unpricedCount} step(s) use credit/subscription pricing that must be verified before purchase.`
        : 'All selected paid steps have a stored price in the current catalog snapshot.',
    priceCheckedAt: catalog.generatedAt,
    tasks: completed,
    sources,
    handoff,
    planner: {
      model: plannerModel,
      usedModelCall: plannerUsed,
      rule: 'LLM selects only from verified candidates; prices come from the catalog.'
    }
  };
}

app.get('/api/health', (_req: Request, res: Response) => {
  let catalog: CatalogSnapshot | null = null;
  try {
    catalog = loadCatalog();
  } catch {
    // handled in payload
  }
  res.json({
    status: catalog ? 'ok' : 'degraded',
    catalogVersion: catalog?.version || null,
    catalogGeneratedAt: catalog?.generatedAt || null,
    plannerConfigured: Boolean(
      (process.env.PLANNER_API_KEY && process.env.PLANNER_BASE_URL && process.env.PLANNER_MODEL) ||
        process.env.DEEPSEEK_API_KEY
    ),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/catalog', (_req: Request, res: Response) => {
  try {
    res.json(loadCatalog());
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Catalog unavailable' });
  }
});

app.post('/api/plan-v2', async (req: Request, res: Response) => {
  try {
    const body = req.body as PlanRequest;
    if (!body?.goal || typeof body.goal !== 'string' || body.goal.trim().length < 3) {
      return res.status(400).json({ error: 'Describe what you want to make.' });
    }

    const normalized = {
      ...body,
      goal: body.goal.trim(),
      budget: Math.max(0, Number(body.budget ?? 20)),
      quantity: Math.max(1, Number(body.quantity ?? 1)),
      preference: (['free', 'value', 'quality'].includes(body.preference || '') ? body.preference : 'value') as Preference,
      ownedTools: Array.isArray(body.ownedTools) ? body.ownedTools.filter(Boolean).slice(0, 20) : []
    };

    const catalog = loadCatalog();
    const draft = buildDraft(normalized, catalog);
    const refined = await maybeRefineWithPlanner(normalized, catalog, draft);
    const plan = finalizePlan(normalized, catalog, refined.tasks, refined.model, refined.used);

    return res.json({ plan });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Could not build plan' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Handoff running on http://localhost:${PORT}`);
  });
}

startServer();
