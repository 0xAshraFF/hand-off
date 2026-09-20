export type ModelStrategy = 'free' | 'mixed' | 'frontier' | 'local';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'Zhipu GLM' | 'DeepSeek' | 'Moonshot Kimi' | 'Google' | 'Anthropic' | 'OpenAI' | 'Local / Ollama' | 'Groq';
  tier: ModelStrategy;
  inputCostPer1M: number; // in USD
  outputCostPer1M: number; // in USD
  avgLatencyMs: number;
  tokensPerSec: number;
  reliabilityPercent: number; // e.g. 99.8
  contextWindow: string; // e.g. "128k"
  description: string;
  badgeColor: string;
  bestFor: string;
}

export interface TaskModelCost {
  modelId: string;
  modelName: string;
  provider: string;
  tier: ModelStrategy;
  projectedCost: number; // in USD
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  tokensPerSec: number;
  reliabilityPercent: number;
  highlights: string;
}

export interface TaskPlan {
  id: string;
  taskNumber: number;
  title: string;
  description: string;
  category: 'auth' | 'multimodal' | 'video' | 'dashboard' | 'messaging' | 'core_logic' | 'database';
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  selectedModelId: string;
  availableModels: TaskModelCost[];
  deliverables: string[];
}

export interface ProjectPlan {
  id: string;
  projectName: string;
  projectDescription: string;
  budget: number;
  preferredStrategy: ModelStrategy;
  totalCost: number;
  totalTokens: number;
  budgetUtilizationPercent: number;
  feasibilityScore: number; // 0-100
  plannerModelUsed: string; // e.g., "GLM-5.3 Fast Frontier Optimizer"
  phases: {
    phase: string;
    duration: string;
    tasks: string[];
  }[];
  tasks: TaskPlan[];
  handoffSummary?: string;
  specDocMarkdown: string;
  createdAt: string;
}

export interface CachedSetup {
  id: string;
  title: string;
  shortDesc: string;
  icon: string;
  category: string;
  recommendedBudget: number;
  strategy: ModelStrategy;
  promptDescription: string;
  handoffPrompt: string;
  suggestedTasks: string[];
}

export interface CommunitySubmission {
  id: string;
  projectName: string;
  category: string;
  description: string;
  budget: number;
  totalCost: number;
  strategy: ModelStrategy;
  modelsUsed: {
    modelName: string;
    taskTitle: string;
    provider: string;
    cost: number;
  }[];
  timestamp: string;
  views: number;
  likes: number;
}
