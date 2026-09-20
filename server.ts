import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { AI_MODELS_CATALOG, calculateCost } from './src/data/models.ts';
import { INITIAL_COMMUNITY_SUBMISSIONS } from './src/data/presets.ts';
import { ProjectPlan, TaskPlan, TaskModelCost, ModelStrategy, CommunitySubmission } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory persistent community store
let communityStore: CommunitySubmission[] = [...INITIAL_COMMUNITY_SUBMISSIONS];

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    engine: 'GLM-5.3 Fast Frontier Optimizer (Gemini Flash Accelerated)',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Community API
app.get('/api/community', (req: Request, res: Response) => {
  // Compute aggregate statistics
  const totalProjects = communityStore.length;
  const totalBudget = communityStore.reduce((sum, item) => sum + item.budget, 0);
  const totalPlannedCost = communityStore.reduce((sum, item) => sum + item.totalCost, 0);
  const avgCostSavings = totalBudget > 0 ? Math.round(((totalBudget - totalPlannedCost) / totalBudget) * 100) : 48;

  // Model frequency count
  const modelFrequency: Record<string, number> = {};
  communityStore.forEach((p) => {
    p.modelsUsed.forEach((m) => {
      modelFrequency[m.modelName] = (modelFrequency[m.modelName] || 0) + 1;
    });
  });

  const topModels = Object.entries(modelFrequency)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  res.json({
    submissions: communityStore,
    stats: {
      totalProjects,
      avgBudget: Number((totalBudget / Math.max(1, totalProjects)).toFixed(2)),
      avgPlannedCost: Number((totalPlannedCost / Math.max(1, totalProjects)).toFixed(2)),
      avgCostSavings,
      topModels
    }
  });
});

app.post('/api/community', (req: Request, res: Response) => {
  const { projectName, category, description, budget, totalCost, strategy, modelsUsed } = req.body;
  if (!projectName) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const newEntry: CommunitySubmission = {
    id: `comm-${Date.now()}`,
    projectName,
    category: category || 'Custom Application',
    description: description || 'Autonomous workflow with dynamic model routing.',
    budget: Number(budget) || 10,
    totalCost: Number(totalCost) || 0,
    strategy: strategy || 'mixed',
    modelsUsed: modelsUsed || [],
    timestamp: 'Just now',
    views: 1,
    likes: 1
  };

  communityStore.unshift(newEntry);
  if (communityStore.length > 50) {
    communityStore = communityStore.slice(0, 50);
  }

  res.json({ success: true, entry: newEntry });
});

// Fallback roadmap synthesizer if AI is offline or key not provided
function generateFallbackPlan(
  projectName: string,
  projectDescription: string,
  budget: number,
  strategy: ModelStrategy
): ProjectPlan {
  const desc = projectDescription.toLowerCase();

  // Detect likely project characteristics
  const isMarketing = desc.includes('campaign') || desc.includes('video') || desc.includes('image') || desc.includes('market');
  const isDashboard = desc.includes('dashboard') || desc.includes('analytics') || desc.includes('metric');
  const isSupport = desc.includes('support') || desc.includes('customer') || desc.includes('chat') || desc.includes('agent');
  const isAutomation = desc.includes('invoice') || desc.includes('extract') || desc.includes('parse') || desc.includes('automation');

  let rawTasks: { title: string; desc: string; cat: TaskPlan['category']; inTok: number; outTok: number; deliverables: string[] }[] = [];

  if (isMarketing) {
    rawTasks = [
      {
        title: 'User Authentication & Multi-Tenant Session Vault',
        desc: 'OAuth2 login, encrypted API key vault, team organization access control and rate-limiting.',
        cat: 'auth',
        inTok: 120_000,
        outTok: 35_000,
        deliverables: ['JWT Token Guard', 'RBAC Middleware', 'Session Storage']
      },
      {
        title: 'Prompt Expansion & High-Res Image Generation',
        desc: 'Transform raw concept into 4 prompt variants and generate high-fidelity advertising creatives.',
        cat: 'multimodal',
        inTok: 380_000,
        outTok: 160_000,
        deliverables: ['Style Preset Engine', 'Negative Prompt Tuner', 'Image Upscaler Hook']
      },
      {
        title: 'Automated Short-Form Video Clip Synthesis',
        desc: 'Assemble storyboard frames, audio narration script, and transition sequence for social media.',
        cat: 'video',
        inTok: 450_000,
        outTok: 220_000,
        deliverables: ['Storyboard JSON', 'Audio Script', 'Video Stitching Pipeline']
      },
      {
        title: 'Campaign Analytics & Real-Time Performance UI',
        desc: 'Interactive visual metrics tracking impressions, click-through rates, and model spending balance.',
        cat: 'dashboard',
        inTok: 180_000,
        outTok: 70_000,
        deliverables: ['Live Spend Tracker', 'CTR Bar Chart', 'Export CSV Report']
      },
      {
        title: 'Milestone Completion & Webhook Notifications',
        desc: 'Format transactional summary email, send Slack/Discord webhook alerts to marketing managers.',
        cat: 'messaging',
        inTok: 95_000,
        outTok: 40_000,
        deliverables: ['HTML Email Template', 'Webhook Retry Logic', 'Delivery Log']
      }
    ];
  } else if (isDashboard) {
    rawTasks = [
      {
        title: 'Telemetry Ingestion & Schema Normalization',
        desc: 'Validate inbound JSON streams, deduplicate event timestamps, and populate normalized data lake.',
        cat: 'database',
        inTok: 250_000,
        outTok: 60_000,
        deliverables: ['Zod Schema Validator', 'Batch Ingestion Queue', 'Index Optimizer']
      },
      {
        title: 'Natural Language to SQL/Query Compiler',
        desc: 'Allow users to ask ad-hoc questions ("show top 5 drop-offs this week") and compile safe SQL.',
        cat: 'core_logic',
        inTok: 320_000,
        outTok: 110_000,
        deliverables: ['SQL AST Guard', 'Query Cost Estimator', 'Schema Reflection']
      },
      {
        title: 'Interactive Dashboard Visualization Engine',
        desc: 'Dynamic rendering of time-series line graphs, conversion funnels, and drill-down filters.',
        cat: 'dashboard',
        inTok: 200_000,
        outTok: 90_000,
        deliverables: ['Responsive SVG Stage', 'Date-range Picker', 'Filter State Sync']
      },
      {
        title: 'Anomaly Detection & Threshold Alert Delivery',
        desc: 'Run periodic statistical checks for sudden metric spikes and dispatch email/SMS alerts.',
        cat: 'messaging',
        inTok: 150_000,
        outTok: 50_000,
        deliverables: ['Z-score Detector', 'Notification Queue', 'Digest Formatter']
      }
    ];
  } else if (isSupport) {
    rawTasks = [
      {
        title: 'Customer Identity & Session Verification',
        desc: 'Authenticate user account status, fetch prior support tickets, and configure session security.',
        cat: 'auth',
        inTok: 140_000,
        outTok: 45_000,
        deliverables: ['Customer Context Fetcher', 'CRM ID Matcher', 'CSRF Protection']
      },
      {
        title: 'Knowledge Base Semantic Search (RAG)',
        desc: 'Query vector embeddings for company policy, FAQs, and API documentation with reranking.',
        cat: 'core_logic',
        inTok: 480_000,
        outTok: 190_000,
        deliverables: ['Cosine Similarity Matcher', 'Context Window Packing', 'Hallucination Filter']
      },
      {
        title: 'Multi-turn Empathy & Frustration Detector',
        desc: 'Analyze conversation tone in real time; trigger escalation if frustration exceeds 0.7.',
        cat: 'core_logic',
        inTok: 280_000,
        outTok: 80_000,
        deliverables: ['Sentiment Classifier', 'Human Handoff Hook', 'Tone Guardrail']
      },
      {
        title: 'CRM Ticket Resolution & Email Summary',
        desc: 'Close resolved Zendesk/HubSpot tickets and send a formatted transcript with action items to customer.',
        cat: 'messaging',
        inTok: 160_000,
        outTok: 65_000,
        deliverables: ['Zendesk API Sync', 'Transcript PDF/Email', 'CSAT Survey Link']
      }
    ];
  } else {
    // Standard automation / multi-step workflow
    rawTasks = [
      {
        title: 'Workflow Authentication & Access Governance',
        desc: 'Secure service account tokens, manage team permissions, and enforce per-user rate limits.',
        cat: 'auth',
        inTok: 120_000,
        outTok: 40_000,
        deliverables: ['API Key Validator', 'Rate Limiter (Redis)', 'Audit Log']
      },
      {
        title: 'Input Ingestion, OCR & Multimodal Parsing',
        desc: 'Ingest raw documents, unstructured payloads or user prompts, converting them to typed JSON.',
        cat: 'multimodal',
        inTok: 410_000,
        outTok: 130_000,
        deliverables: ['Structured JSON Extractor', 'Format Normalizer', 'Error Boundary']
      },
      {
        title: 'Core Business Logic & Reasoning Engine',
        desc: 'Execute calculations, cross-reference external database records, and validate integrity rules.',
        cat: 'core_logic',
        inTok: 350_000,
        outTok: 140_000,
        deliverables: ['Deterministic Engine', 'Rule Evaluation Loop', 'Audit Trail']
      },
      {
        title: 'Management Dashboard & Execution Telemetry',
        desc: 'Visual interface showing pipeline status, throughput metrics, and real-time processing logs.',
        cat: 'dashboard',
        inTok: 190_000,
        outTok: 75_000,
        deliverables: ['Telemetry Feed', 'Task Status Badge', 'Execution Re-run UI']
      },
      {
        title: 'Outbound Notification & Webhook Dispatcher',
        desc: 'Broadcast webhook payloads and deliver completion notification emails to stakeholders.',
        cat: 'messaging',
        inTok: 110_000,
        outTok: 45_000,
        deliverables: ['Webhook Dispatcher', 'Email Notifier', 'Exponential Backoff']
      }
    ];
  }

  // Build task options
  const tasks: TaskPlan[] = rawTasks.map((rt, idx) => {
    // Generate options for this task based on catalog
    const modelOptions: TaskModelCost[] = AI_MODELS_CATALOG.map((m) => {
      const cost = calculateCost(m, rt.inTok, rt.outTok);
      let highlights = m.bestFor;
      if (m.id === 'deepseek-v3') highlights = 'Ultra-high cost efficiency with top-tier reasoning.';
      if (m.id === 'kimi-moonshot-k1.5') highlights = 'Superior context window retention for document tasks.';
      if (m.id === 'glm-5.3-frontier') highlights = 'Cheap frontier model with balanced Chinese & English reasoning.';
      if (m.id === 'gemini-2.5-flash') highlights = 'Sub-second speed with 1M token capability.';

      return {
        modelId: m.id,
        modelName: m.name,
        provider: m.provider,
        tier: m.tier,
        projectedCost: cost,
        inputTokens: rt.inTok,
        outputTokens: rt.outTok,
        totalTokens: rt.inTok + rt.outTok,
        latencyMs: m.avgLatencyMs,
        tokensPerSec: m.tokensPerSec,
        reliabilityPercent: m.reliabilityPercent,
        highlights
      };
    });

    // Pick default model according to user's strategy
    let defaultModelId = 'deepseek-v3';
    if (strategy === 'free') {
      defaultModelId = 'gemini-flash-free';
    } else if (strategy === 'local') {
      defaultModelId = 'ollama-llama-3.3-70b';
    } else if (strategy === 'frontier') {
      defaultModelId = 'glm-5.3-frontier';
    } else {
      // Mixed
      if (rt.cat === 'auth' || rt.cat === 'messaging') defaultModelId = 'deepseek-v3';
      else if (rt.cat === 'multimodal') defaultModelId = 'gemini-2.5-flash';
      else if (rt.cat === 'video') defaultModelId = 'glm-5.3-frontier';
      else defaultModelId = 'deepseek-v3';
    }

    return {
      id: `task-${idx + 1}`,
      taskNumber: idx + 1,
      title: rt.title,
      description: rt.desc,
      category: rt.cat,
      estimatedInputTokens: rt.inTok,
      estimatedOutputTokens: rt.outTok,
      selectedModelId: defaultModelId,
      availableModels: modelOptions,
      deliverables: rt.deliverables
    };
  });

  const totalCost = Number(
    tasks
      .reduce((sum, t) => {
        const sel = t.availableModels.find((m) => m.modelId === t.selectedModelId);
        return sum + (sel ? sel.projectedCost : 0);
      }, 0)
      .toFixed(2)
  );

  const totalTokens = tasks.reduce((sum, t) => sum + t.estimatedInputTokens + t.estimatedOutputTokens, 0);
  const budgetUtilizationPercent = budget > 0 ? Math.min(100, Math.round((totalCost / budget) * 100)) : 100;
  const feasibilityScore = totalCost <= budget ? 95 : Math.max(30, Math.round(95 - ((totalCost - budget) / budget) * 50));

  const specDocMarkdown = `# Technical Specification & Resource Allocation Plan
**Project Name:** ${projectName}
**Generated By:** GLM-5.3 Fast Frontier Planner Engine
**Allocated Budget:** $${budget.toFixed(2)} USD
**Projected Total Spend:** $${totalCost.toFixed(2)} USD (${budgetUtilizationPercent}% utilization)
**Feasibility Rating:** ${feasibilityScore}/100

---

## 1. Executive Summary
This architecture roadmap defines the implementation schedule, decomposed tasks, token consumption projections, and model allocations for **${projectName}**. Using the chosen **${strategy.toUpperCase()}** strategy, each micro-task has been mapped to an optimal LLM provider balancing cost, latency SLA, and reliability.

## 2. Decomposed Task Matrix & Model Allocation
${tasks
  .map((t) => {
    const chosen = t.availableModels.find((m) => m.modelId === t.selectedModelId);
    return `### Task ${t.taskNumber}: ${t.title}
- **Category:** \`${t.category}\`
- **Primary Model:** **${chosen?.modelName || 'DeepSeek-V3'}** (${chosen?.provider})
- **Projected Cost:** **$${chosen?.projectedCost.toFixed(3) || '0.000'} USD** (~${((t.estimatedInputTokens + t.estimatedOutputTokens) / 1000).toFixed(0)}k tokens)
- **Latency & Reliability:** ${chosen?.latencyMs}ms | ${chosen?.reliabilityPercent}% SLA
- **Key Deliverables:** ${t.deliverables.join(', ')}
`;
  })
  .join('\n')}

## 3. Recommended Basic & Advanced Platform Features (Architectural Discussion)
To safeguard budget, reduce latency, and ensure fault tolerance in production, the following platform capabilities are formally recommended:

1. **Semantic Prompt Caching (30-65% Cost Savings):**
   - Cache repetitive system instructions, prompt templates, and few-shot schemas using server-side KV memory (Redis or Cloudflare KV).
   - Expected token reduction: ~180k tokens/day.

2. **Model Cascade & Circuit Breaker Pattern:**
   - **Primary:** DeepSeek-V3 / Kimi for high-volume task resolution.
   - **Secondary Fallback:** Gemini 2.5 Flash if upstream latency exceeds 800ms or 429 rate limit is reached.
   - **Offline / Local Fallback:** Ollama Llama 3.3 for zero-downtime essential routing.

3. **Multi-Tenant Token Quota & Rate Guard:**
   - Enforce hard budget limits per API key/user to prevent runaway generation loops or budget exhaustion.
   - Real-time spend alert triggers when 80% and 95% of target budget is consumed.

4. **Time-To-First-Token (TTFT) Streaming:**
   - Stream responses via Server-Sent Events (SSE) to deliver perceived latency of < 250ms for front-end users.

5. **Telemetry & Community Observability:**
   - Log latency, cost-per-call, token in/out ratios, and reliability benchmarks into an internal metrics store for continuous cost optimization.
`;

  const handoffSummary = `# PROJECT HANDOFF: ${projectName}
Target Budget: $${budget.toFixed(2)} USD | Strategy: ${strategy.toUpperCase()}
Projected Total Spend: $${totalCost.toFixed(2)} USD

## Key Points & Task Allocation:
${tasks.map((t) => {
  const chosen = t.availableModels.find((m) => m.modelId === t.selectedModelId);
  return `- Task ${t.taskNumber} [${t.title}]: ${chosen?.modelName || 'DeepSeek-V3'} ($${chosen?.projectedCost.toFixed(3)} USD, ${chosen?.latencyMs}ms, ${chosen?.reliabilityPercent}% SLA)`;
}).join('\n')}

## Key Deliverables:
${tasks.flatMap((t) => t.deliverables.map((d) => `- ${d} (${t.title})`)).join('\n')}
`;

  return {
    id: `plan-${Date.now()}`,
    projectName,
    projectDescription,
    budget,
    preferredStrategy: strategy,
    totalCost,
    totalTokens,
    budgetUtilizationPercent,
    feasibilityScore,
    plannerModelUsed: 'Project Architecture Engine',
    phases: [
      {
        phase: 'Phase 1: Foundation & Security Setup',
        duration: 'Days 1-3',
        tasks: [tasks[0]?.title || 'Auth Setup', 'Provider API Key Vault & Mock Harness']
      },
      {
        phase: 'Phase 2: Core Task Synthesis & Media Engines',
        duration: 'Days 4-8',
        tasks: tasks.slice(1, 3).map((t) => t.title)
      },
      {
        phase: 'Phase 3: Real-Time UI, Dashboards & Telemetry',
        duration: 'Days 9-12',
        tasks: tasks.slice(3).map((t) => t.title)
      }
    ],
    tasks,
    handoffSummary,
    specDocMarkdown,
    createdAt: new Date().toISOString()
  };
}

// Main Planning Endpoint
app.post('/api/plan', async (req: Request, res: Response) => {
  const { projectName, projectDescription, budget, preferredStrategy } = req.body;

  if (!projectName || !projectDescription) {
    return res.status(400).json({ error: 'Project name and description are required.' });
  }

  const numBudget = Number(budget) || 10;
  const strategy: ModelStrategy = ['free', 'mixed', 'frontier', 'local'].includes(preferredStrategy)
    ? preferredStrategy
    : 'mixed';

  const gemini = getGeminiClient();

  if (!gemini) {
    console.log('No GEMINI_API_KEY found. Utilizing deterministic low-latency GLM-5.3 planner generator.');
    const plan = generateFallbackPlan(projectName, projectDescription, numBudget, strategy);
    return res.json({ plan, source: 'fallback_engine' });
  }

  try {
    const prompt = `You are GLM-5.3, a fast frontier AI architecture planning model.
Decompose the following user project into 4 to 5 discrete technical engineering tasks.
For each task:
- Assign an appropriate category from: 'auth', 'multimodal', 'video', 'dashboard', 'messaging', 'core_logic', 'database'.
- Estimate realistic input tokens (e.g., 50000 - 450000) and output tokens (e.g., 20000 - 180000).
- List 3 key deliverables.

Project Name: ${projectName}
Project Description: ${projectDescription}
Budget: $${numBudget} USD
Preferred Strategy: ${strategy} (Options: free, mixed, frontier, local)

Return ONLY valid JSON matching this schema:
{
  "tasks": [
    {
      "taskNumber": 1,
      "title": "Task title",
      "description": "Task description",
      "category": "auth",
      "estimatedInputTokens": 120000,
      "estimatedOutputTokens": 35000,
      "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"]
    }
  ],
  "phases": [
    {
      "phase": "Phase 1: Architecture & Foundation",
      "duration": "Days 1-3",
      "tasks": ["Task 1 title"]
    }
  ]
}`;

    const response = await gemini.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '';
    const parsed = JSON.parse(rawText);

    // Build the tasks with full model catalog pricing
    const tasks: TaskPlan[] = (parsed.tasks || []).map((pt: any, idx: number) => {
      const inTok = Number(pt.estimatedInputTokens) || 120_000;
      const outTok = Number(pt.estimatedOutputTokens) || 40_000;

      const modelOptions: TaskModelCost[] = AI_MODELS_CATALOG.map((m) => {
        const cost = calculateCost(m, inTok, outTok);
        let highlights = m.bestFor;
        if (m.id === 'deepseek-v3') highlights = 'Ultra-high cost efficiency with top-tier reasoning.';
        if (m.id === 'kimi-moonshot-k1.5') highlights = 'Deep contextual retention for document tasks.';
        if (m.id === 'glm-5.3-frontier') highlights = 'Cheap frontier model with balanced Chinese & English reasoning.';
        if (m.id === 'gemini-2.5-flash') highlights = 'Sub-second speed with 1M token capability.';

        return {
          modelId: m.id,
          modelName: m.name,
          provider: m.provider,
          tier: m.tier,
          projectedCost: cost,
          inputTokens: inTok,
          outputTokens: outTok,
          totalTokens: inTok + outTok,
          latencyMs: m.avgLatencyMs,
          tokensPerSec: m.tokensPerSec,
          reliabilityPercent: m.reliabilityPercent,
          highlights
        };
      });

      // Default model selection based on strategy
      let defaultModelId = 'deepseek-v3';
      if (strategy === 'free') defaultModelId = 'gemini-flash-free';
      else if (strategy === 'local') defaultModelId = 'ollama-llama-3.3-70b';
      else if (strategy === 'frontier') defaultModelId = 'glm-5.3-frontier';
      else {
        if (pt.category === 'auth' || pt.category === 'messaging') defaultModelId = 'deepseek-v3';
        else if (pt.category === 'multimodal') defaultModelId = 'gemini-2.5-flash';
        else if (pt.category === 'video') defaultModelId = 'glm-5.3-frontier';
        else defaultModelId = 'deepseek-v3';
      }

      return {
        id: `task-${idx + 1}`,
        taskNumber: idx + 1,
        title: pt.title || `Task ${idx + 1}`,
        description: pt.description || '',
        category: pt.category || 'core_logic',
        estimatedInputTokens: inTok,
        estimatedOutputTokens: outTok,
        selectedModelId: defaultModelId,
        availableModels: modelOptions,
        deliverables: Array.isArray(pt.deliverables) ? pt.deliverables : ['Architecture spec', 'Integration hook']
      };
    });

    const totalCost = Number(
      tasks
        .reduce((sum, t) => {
          const sel = t.availableModels.find((m) => m.modelId === t.selectedModelId);
          return sum + (sel ? sel.projectedCost : 0);
        }, 0)
        .toFixed(2)
    );

    const totalTokens = tasks.reduce((sum, t) => sum + t.estimatedInputTokens + t.estimatedOutputTokens, 0);
    const budgetUtilizationPercent = numBudget > 0 ? Math.min(100, Math.round((totalCost / numBudget) * 100)) : 100;
    const feasibilityScore = totalCost <= numBudget ? 96 : Math.max(35, Math.round(95 - ((totalCost - numBudget) / numBudget) * 50));

    const specDocMarkdown = `# Technical Specification & Resource Allocation Plan
**Project Name:** ${projectName}
**Generated By:** GLM-5.3 Fast Frontier Planner Engine
**Allocated Budget:** $${numBudget.toFixed(2)} USD
**Projected Total Spend:** $${totalCost.toFixed(2)} USD (${budgetUtilizationPercent}% utilization)
**Feasibility Rating:** ${feasibilityScore}/100

---

## 1. Executive Summary
This architecture roadmap defines the implementation schedule, decomposed tasks, token consumption projections, and model allocations for **${projectName}**. Using the chosen **${strategy.toUpperCase()}** strategy, each micro-task has been mapped to an optimal LLM provider balancing cost, latency SLA, and reliability.

## 2. Decomposed Task Matrix & Model Allocation
${tasks
  .map((t) => {
    const chosen = t.availableModels.find((m) => m.modelId === t.selectedModelId);
    return `### Task ${t.taskNumber}: ${t.title}
- **Category:** \`${t.category}\`
- **Primary Model:** **${chosen?.modelName || 'DeepSeek-V3'}** (${chosen?.provider})
- **Projected Cost:** **$${chosen?.projectedCost.toFixed(3) || '0.000'} USD** (~${((t.estimatedInputTokens + t.estimatedOutputTokens) / 1000).toFixed(0)}k tokens)
- **Latency & Reliability:** ${chosen?.latencyMs}ms | ${chosen?.reliabilityPercent}% SLA
- **Key Deliverables:** ${t.deliverables.join(', ')}
`;
  })
  .join('\n')}

## 3. Recommended Basic & Advanced Platform Features (Architectural Discussion)
To safeguard budget, reduce latency, and ensure fault tolerance in production, the following platform capabilities are formally recommended:

1. **Semantic Prompt Caching (30-65% Cost Savings):**
   - Cache repetitive system instructions, prompt templates, and few-shot schemas using server-side KV memory (Redis or Cloudflare KV).
   - Expected token reduction: ~180k tokens/day.

2. **Model Cascade & Circuit Breaker Pattern:**
   - **Primary:** DeepSeek-V3 / Kimi for high-volume task resolution.
   - **Secondary Fallback:** Gemini 2.5 Flash if upstream latency exceeds 800ms or 429 rate limit is reached.
   - **Offline / Local Fallback:** Ollama Llama 3.3 for zero-downtime essential routing.

3. **Multi-Tenant Token Quota & Rate Guard:**
   - Enforce hard budget limits per API key/user to prevent runaway generation loops or budget exhaustion.
   - Real-time spend alert triggers when 80% and 95% of target budget is consumed.

4. **Time-To-First-Token (TTFT) Streaming:**
   - Stream responses via Server-Sent Events (SSE) to deliver perceived latency of < 250ms for front-end users.

5. **Telemetry & Community Observability:**
   - Log latency, cost-per-call, token in/out ratios, and reliability benchmarks into an internal metrics store for continuous cost optimization.
`;

    const handoffSummary = `# PROJECT HANDOFF: ${projectName}
Target Budget: $${numBudget.toFixed(2)} USD | Strategy: ${strategy.toUpperCase()}
Projected Total Spend: $${totalCost.toFixed(2)} USD

## Key Points & Task Allocation:
${tasks.map((t) => {
  const chosen = t.availableModels.find((m) => m.modelId === t.selectedModelId);
  return `- Task ${t.taskNumber} [${t.title}]: ${chosen?.modelName || 'DeepSeek-V3'} ($${chosen?.projectedCost.toFixed(3)} USD, ${chosen?.latencyMs}ms, ${chosen?.reliabilityPercent}% SLA)`;
}).join('\n')}

## Key Deliverables:
${tasks.flatMap((t) => t.deliverables.map((d) => `- ${d} (${t.title})`)).join('\n')}
`;

    const plan: ProjectPlan = {
      id: `plan-${Date.now()}`,
      projectName,
      projectDescription,
      budget: numBudget,
      preferredStrategy: strategy,
      totalCost,
      totalTokens,
      budgetUtilizationPercent,
      feasibilityScore,
      plannerModelUsed: 'Project Architecture Engine',
      phases: parsed.phases || [
        {
          phase: 'Phase 1: Foundation & Security',
          duration: 'Days 1-3',
          tasks: [tasks[0]?.title || 'Setup']
        },
        {
          phase: 'Phase 2: Core Task Synthesis',
          duration: 'Days 4-8',
          tasks: tasks.slice(1, 3).map((t) => t.title)
        },
        {
          phase: 'Phase 3: Production Dashboards & Telemetry',
          duration: 'Days 9-12',
          tasks: tasks.slice(3).map((t) => t.title)
        }
      ],
      tasks,
      handoffSummary,
      specDocMarkdown,
      createdAt: new Date().toISOString()
    };

    return res.json({ plan, source: 'gemini_glm_engine' });
  } catch (err: any) {
    console.error('Error generating AI plan:', err);
    // Graceful fallback to guarantee zero user interruption
    const plan = generateFallbackPlan(projectName, projectDescription, numBudget, strategy);
    return res.json({ plan, source: 'fallback_engine', note: 'AI provider error handled gracefully.' });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
