export type CatalogKind = 'llm' | 'image' | 'video' | 'audio' | 'coding' | 'design' | 'hosting' | 'local';

export interface CatalogItem {
  id: string;
  name: string;
  provider: string;
  kind: CatalogKind;
  tasks: string[];
  priceLabel: string;
  unitCostUsd?: number;
  freeTier?: boolean;
  subscription?: boolean;
  api?: boolean;
  local?: boolean;
  regionNote?: string;
  quality: 'tested' | 'reviewed' | 'not-tested';
  qualityNote: string;
  lastVerified: string;
  source: string;
  tags: string[];
}

export const CATALOG: CatalogItem[] = [
  {
    id: 'qwen-image-2-1',
    name: 'Qwen Image 2.1',
    provider: 'Alibaba / Qwen',
    kind: 'image',
    tasks: ['product image', 'ad creative', 'illustration', 'text in image'],
    priceLabel: 'Low-cost image generation',
    unitCostUsd: 0.015,
    api: true,
    quality: 'reviewed',
    qualityNote: 'Strong value route when image cost matters.',
    lastVerified: '2026-10-04',
    source: 'Official provider / routing source',
    tags: ['chinese-model', 'budget', 'api']
  },
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    provider: 'Google',
    kind: 'image',
    tasks: ['product image', 'creative edit', 'image generation'],
    priceLabel: 'Low-cost premium image route',
    unitCostUsd: 0.03,
    api: true,
    quality: 'reviewed',
    qualityNote: 'Useful upgrade when consistency matters more than minimum cost.',
    lastVerified: '2026-10-04',
    source: 'Official provider',
    tags: ['quality', 'api']
  },
  {
    id: 'deepseek-v3-2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    kind: 'llm',
    tasks: ['planning', 'research', 'writing', 'coding'],
    priceLabel: 'Very low-cost reasoning/writing',
    unitCostUsd: 0.00035,
    api: true,
    quality: 'reviewed',
    qualityNote: 'Excellent price-performance for structured planning and text-heavy work.',
    lastVerified: '2026-10-04',
    source: 'Official provider / OpenRouter',
    tags: ['chinese-model', 'budget', 'reasoning']
  },
  {
    id: 'glm-5-3',
    name: 'GLM 5.3',
    provider: 'Zhipu / Z.ai',
    kind: 'llm',
    tasks: ['planning', 'coding', 'agent handoff', 'analysis'],
    priceLabel: 'Frontier-value reasoning route',
    unitCostUsd: 0.0005,
    api: true,
    quality: 'reviewed',
    qualityNote: 'Strong candidate for project decomposition and agent-ready handoffs.',
    lastVerified: '2026-10-04',
    source: 'Official provider / OpenRouter',
    tags: ['chinese-model', 'planner', 'reasoning']
  },
  {
    id: 'qwen3-coder',
    name: 'Qwen3 Coder',
    provider: 'Alibaba / Qwen',
    kind: 'coding',
    tasks: ['coding', 'repo work', 'automation', 'debugging'],
    priceLabel: 'Low-cost coding model',
    unitCostUsd: 0.0004,
    api: true,
    quality: 'reviewed',
    qualityNote: 'Good option for implementation tasks where cost is constrained.',
    lastVerified: '2026-10-04',
    source: 'Official provider / OpenRouter',
    tags: ['chinese-model', 'coding', 'budget']
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    provider: 'Anthropic',
    kind: 'coding',
    tasks: ['coding', 'architecture', 'review', 'agent work'],
    priceLabel: 'Premium coding/reasoning route',
    subscription: true,
    api: true,
    quality: 'tested',
    qualityNote: 'High-quality option when the user already has access or quality is prioritized.',
    lastVerified: '2026-10-04',
    source: 'Official provider',
    tags: ['premium', 'coding']
  },
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    provider: 'OpenAI',
    kind: 'llm',
    tasks: ['planning', 'writing', 'analysis', 'review'],
    priceLabel: 'Subscription',
    subscription: true,
    api: false,
    quality: 'tested',
    qualityNote: 'Useful when already owned; does not imply API credits.',
    lastVerified: '2026-10-04',
    source: 'Official provider',
    tags: ['subscription', 'owned-tool']
  },
  {
    id: 'kling',
    name: 'Kling',
    provider: 'Kuaishou',
    kind: 'video',
    tasks: ['text to video', 'image to video', 'short video'],
    priceLabel: 'Usage-based / credits',
    api: true,
    quality: 'reviewed',
    qualityNote: 'Strong value option for generated clips and social video workflows.',
    lastVerified: '2026-10-04',
    source: 'Official provider / routing source',
    tags: ['chinese-model', 'video']
  },
  {
    id: 'capcut',
    name: 'CapCut',
    provider: 'ByteDance',
    kind: 'design',
    tasks: ['video edit', 'captions', 'short-form publishing'],
    priceLabel: 'Free tier + paid plans',
    freeTier: true,
    subscription: true,
    quality: 'tested',
    qualityNote: 'Practical editing route for social content.',
    lastVerified: '2026-10-04',
    source: 'Official provider',
    tags: ['editing', 'free-tier']
  },
  {
    id: 'canva',
    name: 'Canva',
    provider: 'Canva',
    kind: 'design',
    tasks: ['ad creative', 'presentation', 'thumbnail', 'social post'],
    priceLabel: 'Free tier + subscription',
    freeTier: true,
    subscription: true,
    quality: 'tested',
    qualityNote: 'Useful when a lightweight design/editor step is enough.',
    lastVerified: '2026-10-04',
    source: 'Official provider',
    tags: ['design', 'free-tier']
  },
  {
    id: 'davinci',
    name: 'DaVinci Resolve',
    provider: 'Blackmagic Design',
    kind: 'design',
    tasks: ['video edit', 'color', 'audio'],
    priceLabel: 'Free desktop app',
    freeTier: true,
    local: true,
    quality: 'tested',
    qualityNote: 'Good local fallback when users want to avoid recurring subscriptions.',
    lastVerified: '2026-10-04',
    source: 'Official provider',
    tags: ['local', 'editing', 'free']
  },
  {
    id: 'cloudflare-pages',
    name: 'Cloudflare Pages',
    provider: 'Cloudflare',
    kind: 'hosting',
    tasks: ['deploy website', 'static hosting', 'frontend hosting'],
    priceLabel: 'Free tier available',
    freeTier: true,
    api: true,
    quality: 'tested',
    qualityNote: 'Good default for inexpensive static/frontend deployment.',
    lastVerified: '2026-10-04',
    source: 'Official provider',
    tags: ['hosting', 'free-tier']
  }
];

export const CATALOG_LAST_REFRESH = '2026-10-04T00:00:00Z';
