import { CachedSetup } from '../types';

export const CACHED_SETUPS: CachedSetup[] = [
  {
    id: 'campaign-studio',
    title: 'Marketing Campaign & Content Studio',
    shortDesc: 'Auth, prompt generation, image gen, video synthesis, real-time dashboard, email notifications',
    icon: 'Sparkles',
    category: 'Creative & Marketing',
    recommendedBudget: 10,
    strategy: 'mixed',
    promptDescription: `Create an automated marketing campaign generator with a $10 budget:
1. User authentication and secure credential management.
2. Prompt refinement and multi-aspect image generation.
3. Automated short-form video generation pipeline.
4. Real-time campaign tracking dashboard with conversion metrics.
5. Email notifications to subscribers and team upon milestone completion.`,
    handoffPrompt: `# PROJECT HANDOFF PROMPT (Paste into terminal or Cursor in project folder)
# Fits cleanly in token window (< 1000 tokens)
cat << 'EOF' > project_context.md
# Architecture Handoff: Marketing Campaign & Content Studio
Target Budget: $10.00 USD
Directory Structure:
- src/auth: User login, session tokens, rate-limits
- src/media: Prompt enrichment, Image diffusion proxy, Video rendering queue
- src/dashboard: Real-time telemetry, campaign conversion charts
- src/notifications: Resend/SendGrid transactional email webhooks
Tech Stack: React 19, TypeScript, Tailwind, Node.js microservices
Models Needed: Cheap frontier planner (GLM 5.3 / DeepSeek / Gemini Flash)
EOF`,
    suggestedTasks: [
      'User Authentication & Secure Session Vault',
      'Prompt Refinement & High-Res Image Generation',
      'AI Video Clip Synthesis Pipeline',
      'Campaign Analytics & KPI Dashboard UI',
      'Transactional Email Delivery & Webhook Alerts'
    ]
  },
  {
    id: 'realtime-dashboard',
    title: 'Interactive Real-Time BI Dashboard',
    shortDesc: 'Data streaming, aggregation, interactive chart generation, low-latency filter queries',
    icon: 'LayoutDashboard',
    category: 'Dashboards & Analytics',
    recommendedBudget: 8,
    strategy: 'mixed',
    promptDescription: `Build an enterprise analytics dashboard that aggregates telemetry, parses unstructured logs into structured time-series metrics, provides natural language chart query generation, and refreshes streaming metrics under 500ms latency.`,
    handoffPrompt: `# DASHBOARD HANDOFF COMMAND
cat << 'EOF' > dashboard_spec.md
# Analytics Dashboard Scope:
- Ingestion: High-throughput log parser into JSON time-series
- Visualization: Multi-metric charts (Recharts / D3 SVG)
- AI Feature: Natural language to SQL/chart filter generator
- Latency SLA: < 300ms query time, budget ceiling $8.00/mo
EOF`,
    suggestedTasks: [
      'Data Ingestion & Schema Normalization',
      'Natural Language to SQL/Query Compiler',
      'Dynamic Chart Visualization Engine',
      'Streaming Metric Websocket Relay',
      'Anomaly Alerting & Periodic Reporting'
    ]
  },
  {
    id: 'customer-service-agent',
    title: 'Omnichannel Customer Support Agent',
    shortDesc: 'Contextual RAG, ticket resolution, sentiment guardrails, human handoff triggers',
    icon: 'Headphones',
    category: 'Customer Service',
    recommendedBudget: 15,
    strategy: 'mixed',
    promptDescription: `Deploy a 24/7 intelligent customer care agent with knowledge base RAG, automatic escalation for unhappy customers, conversational memory, and integration into Zendesk/Slack webhooks.`,
    handoffPrompt: `# CUSTOMER SERVICE AGENT HANDOFF
cat << 'EOF' > support_agent_spec.md
# Customer Service Agent Spec:
- Knowledge Base: 5,000 vector chunks (Chroma/Pinecone)
- Persona: Empathetic, accurate technical troubleshooter
- Escalation: Auto-detect churn risk & route to human agent
- Multi-channel: Web chat widget + Email auto-responder
EOF`,
    suggestedTasks: [
      'Knowledge Base Ingestion & Vector Indexing',
      'Multi-turn Conversational Memory & Tone Guard',
      'Sentiment Analysis & Frustration Detector',
      'Automated Ticket Dispatch & CRM Integration',
      'Weekly Resolution Analytics & CSAT Scoring'
    ]
  },
  {
    id: 'common-automation',
    title: 'Common Automation & Document Parsing',
    shortDesc: 'PDF invoice extraction, table parsing, webhook sync, ledger entry reconciliation',
    icon: 'Zap',
    category: 'Common Automation Tasks',
    recommendedBudget: 5,
    strategy: 'free',
    promptDescription: `Automate repetitive office workflows: ingest incoming PDF invoices from an inbox, parse tables and line items into validated JSON, cross-check against QuickBooks balances, and trigger Slack notifications.`,
    handoffPrompt: `# COMMON AUTOMATION HANDOFF
cat << 'EOF' > automation_spec.md
# Document Automation Pipeline:
- Trigger: Inbound PDF webhook / S3 bucket notification
- OCR & Parse: Extract Vendor, Invoice Date, Line Items, Tax, Total
- Validation: Verify mathematical sums & duplicate detection
- Output: Push structured row to Google Sheets / Airtable
EOF`,
    suggestedTasks: [
      'Inbound Document Ingestion & Format Sanitization',
      'Structured OCR & Table Extraction (LLM Vision/Text)',
      'Mathematical Verification & Duplicate Checker',
      'Accounting Ledger Webhook Synchronization',
      'Slack/Teams Digest & Error Notification'
    ]
  },
  {
    id: 'codebase-refactoring',
    title: 'Local-First Codebase Migration & Refactor',
    shortDesc: 'AST parser, legacy JavaScript to TypeScript migration, automated unit test generation',
    icon: 'Code2',
    category: 'Developer Tooling',
    recommendedBudget: 0,
    strategy: 'local',
    promptDescription: `Refactor a legacy JavaScript monolith to modern strict TypeScript 5.8 using local offline models (Ollama Qwen 2.5 Coder / Llama 3.3). Zero code leaves the company workstation.`,
    handoffPrompt: `# LOCAL REFACTOR HANDOFF (Strict Offline)
cat << 'EOF' > refactor_plan.md
# Monolith Migration Spec:
- Target: Convert 80 CommonJS modules to ESM TypeScript
- Model: Ollama localhost:11434 (Qwen 2.5 Coder 32B)
- Budget: $0.00 cloud spend (Self-hosted RTX 4090/A100)
- Guard: Run 'npm test' automatically after each file rewrite
EOF`,
    suggestedTasks: [
      'Dependency Graph & AST Dependency Sorting',
      'TypeScript Type Inference & Interface Generation',
      'ESM Import/Export Modernization Engine',
      'Automated Jest/Vitest Suite Synthesizer',
      'Git Commit & Pull Request Diff Summarizer'
    ]
  }
];

export const INITIAL_COMMUNITY_SUBMISSIONS = [
  {
    id: 'comm-1',
    projectName: 'Viral Growth Campaign Suite',
    category: 'Marketing',
    description: 'Auth + Imagen 3 + Veo 2 + React Dashboard with dynamic budget allocation.',
    budget: 12.0,
    totalCost: 6.84,
    strategy: 'mixed' as const,
    modelsUsed: [
      { modelName: 'DeepSeek-V3', taskTitle: 'User Auth & Sessions', provider: 'DeepSeek', cost: 0.12 },
      { modelName: 'Gemini 2.5 Flash', taskTitle: 'Prompt Tuning & Images', provider: 'Google', cost: 1.45 },
      { modelName: 'GLM-5.3 Frontier', taskTitle: 'Video Generation Scripting', provider: 'Zhipu GLM', cost: 2.10 },
      { modelName: 'Claude 3.5 Haiku', taskTitle: 'Live Dashboard UI', provider: 'Anthropic', cost: 1.80 },
      { modelName: 'DeepSeek-V3', taskTitle: 'Email Webhooks', provider: 'DeepSeek', cost: 0.37 }
    ],
    timestamp: '12 minutes ago',
    views: 412,
    likes: 38
  },
  {
    id: 'comm-2',
    projectName: 'E-commerce Support & Return Agent',
    category: 'Customer Service',
    description: 'Autonomous customer refund validator and 24/7 chat with Kimi long-context memory.',
    budget: 20.0,
    totalCost: 11.20,
    strategy: 'mixed' as const,
    modelsUsed: [
      { modelName: 'Kimi Moonshot k1.5', taskTitle: 'Multi-turn Chat & RAG', provider: 'Moonshot Kimi', cost: 4.80 },
      { modelName: 'DeepSeek-V3', taskTitle: 'Order DB Verification', provider: 'DeepSeek', cost: 1.10 },
      { modelName: 'Gemini 2.5 Flash', taskTitle: 'Receipt OCR', provider: 'Google', cost: 1.90 },
      { modelName: 'GLM-5.3 Frontier', taskTitle: 'Dispute Arbitration', provider: 'Zhipu GLM', cost: 3.40 }
    ],
    timestamp: '45 minutes ago',
    views: 689,
    likes: 74
  },
  {
    id: 'comm-3',
    projectName: 'Autonomous Finance Ledger Auditor',
    category: 'Common Automation',
    description: 'Zero-cloud local processing for confidential bank statements using Ollama.',
    budget: 0.0,
    totalCost: 0.0,
    strategy: 'local' as const,
    modelsUsed: [
      { modelName: 'Ollama Llama 3.3 70B', taskTitle: 'Statement Parsing', provider: 'Local / Ollama', cost: 0.0 },
      { modelName: 'Ollama Qwen 2.5 Coder', taskTitle: 'Tax Code Validator', provider: 'Local / Ollama', cost: 0.0 },
      { modelName: 'Ollama Llama 3.3 70B', taskTitle: 'Fraud Anomaly Flagging', provider: 'Local / Ollama', cost: 0.0 }
    ],
    timestamp: '2 hours ago',
    views: 940,
    likes: 112
  },
  {
    id: 'comm-4',
    projectName: 'Real-time Crypto Arbitrage Dashboard',
    category: 'Dashboards & Analytics',
    recommendedBudget: 15.0,
    description: 'Sub-second orderbook summarizer and multi-exchange visualization.',
    budget: 15.0,
    totalCost: 5.60,
    strategy: 'mixed' as const,
    modelsUsed: [
      { modelName: 'Groq LPU (Llama 3.3)', taskTitle: '100ms Signal Classifier', provider: 'Groq', cost: 0.0 },
      { modelName: 'Gemini 2.5 Flash', taskTitle: 'Orderbook Pattern Parser', provider: 'Google', cost: 2.10 },
      { modelName: 'DeepSeek-V3', taskTitle: 'Risk Execution Engine', provider: 'DeepSeek', cost: 3.50 }
    ],
    timestamp: '3 hours ago',
    views: 520,
    likes: 49
  }
];
