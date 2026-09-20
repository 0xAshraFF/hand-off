import { ModelOption } from '../types';

export const AI_MODELS_CATALOG: ModelOption[] = [
  // Frontier / High
  {
    id: 'glm-5.3-frontier',
    name: 'GLM-5.3 Frontier',
    provider: 'Zhipu GLM',
    tier: 'frontier',
    inputCostPer1M: 0.60,
    outputCostPer1M: 1.80,
    avgLatencyMs: 380,
    tokensPerSec: 105,
    reliabilityPercent: 99.85,
    contextWindow: '128k',
    description: 'High-speed Chinese & English reasoning, cost-efficient frontier planning, tool use.',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    bestFor: 'Complex reasoning, task decomposition, agentic coordination'
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    tier: 'frontier',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    avgLatencyMs: 740,
    tokensPerSec: 68,
    reliabilityPercent: 99.92,
    contextWindow: '200k',
    description: 'Premier coding engine, hybrid reasoning, flawless multi-step instruction following.',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    bestFor: 'Full-stack architecture, precision code generation, complex refactoring'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: 'OpenAI',
    tier: 'frontier',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    avgLatencyMs: 620,
    tokensPerSec: 82,
    reliabilityPercent: 99.88,
    contextWindow: '128k',
    description: 'Omni-modal text/vision flagship with broad ecosystem tool compatibility.',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    bestFor: 'General multimodal tasks, structured outputs, enterprise compliance'
  },

  // Mixed / Balanced
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    provider: 'DeepSeek',
    tier: 'mixed',
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.10,
    avgLatencyMs: 420,
    tokensPerSec: 92,
    reliabilityPercent: 99.70,
    contextWindow: '64k',
    description: 'Massive MoE open-weight frontier rival with ultra-competitive token pricing.',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    bestFor: 'High-volume logic, API orchestration, cost-sensitive automation'
  },
  {
    id: 'kimi-moonshot-k1.5',
    name: 'Kimi Moonshot k1.5',
    provider: 'Moonshot Kimi',
    tier: 'mixed',
    inputCostPer1M: 1.20,
    outputCostPer1M: 2.40,
    avgLatencyMs: 510,
    tokensPerSec: 76,
    reliabilityPercent: 99.75,
    contextWindow: '256k',
    description: 'Ultra-long context specialist with deep document comprehension and high consistency.',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    bestFor: 'Long context ingestion, customer chat transcripts, multi-doc synthesis'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    tier: 'mixed',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    avgLatencyMs: 240,
    tokensPerSec: 145,
    reliabilityPercent: 99.95,
    contextWindow: '1M',
    description: 'Sub-second multimodal model with 1M context window and rock-solid Google infrastructure.',
    badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    bestFor: 'Real-time dashboards, quick API triggers, massive context queries'
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    tier: 'mixed',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    avgLatencyMs: 310,
    tokensPerSec: 120,
    reliabilityPercent: 99.90,
    contextWindow: '200k',
    description: 'Fast, crisp lightweight model from Anthropic with robust agentic tool calling.',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    bestFor: 'Prompt classification, real-time guards, lightweight refactoring'
  },

  // Free Tier
  {
    id: 'gemini-flash-free',
    name: 'Gemini 2.5 Flash (Free Tier)',
    provider: 'Google',
    tier: 'free',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    avgLatencyMs: 290,
    tokensPerSec: 130,
    reliabilityPercent: 99.60,
    contextWindow: '1M',
    description: '15 RPM free tier on Google AI Studio for prototypes and student developers.',
    badgeColor: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    bestFor: 'Free experimentation, MVP scaffolding, student projects'
  },
  {
    id: 'groq-llama-3.3-70b-free',
    name: 'Groq LPU (Llama 3.3 70B)',
    provider: 'Groq',
    tier: 'free',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    avgLatencyMs: 140,
    tokensPerSec: 310,
    reliabilityPercent: 99.50,
    contextWindow: '128k',
    description: 'Blistering fast LPU hardware inference with a generous free community quota.',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    bestFor: 'Ultra-low latency streaming, immediate interactive responses'
  },

  // Local / Self-Hosted
  {
    id: 'ollama-llama-3.3-70b',
    name: 'Ollama Llama 3.3 70B',
    provider: 'Local / Ollama',
    tier: 'local',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    avgLatencyMs: 890,
    tokensPerSec: 32,
    reliabilityPercent: 99.99,
    contextWindow: '128k',
    description: 'Zero marginal token cost, 100% data privacy, runs completely on local workstation / vLLM.',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    bestFor: 'Strict privacy requirements, offline development, zero-cloud data compliance'
  },
  {
    id: 'ollama-qwen-coder-32b',
    name: 'Ollama Qwen 2.5 Coder 32B',
    provider: 'Local / Ollama',
    tier: 'local',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    avgLatencyMs: 620,
    tokensPerSec: 48,
    reliabilityPercent: 99.99,
    contextWindow: '128k',
    description: 'Lightweight local coding powerhouse that fits on standard 16GB-24GB VRAM GPUs.',
    badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    bestFor: 'Local code completions, internal scripts, offline test writing'
  }
];

export function calculateCost(model: ModelOption, inputTokens: number, outputTokens: number): number {
  if (model.tier === 'free' || model.tier === 'local') return 0.00;
  const inCost = (inputTokens / 1_000_000) * model.inputCostPer1M;
  const outCost = (outputTokens / 1_000_000) * model.outputCostPer1M;
  return Number((inCost + outCost).toFixed(4));
}
