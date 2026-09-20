import React, { useState } from 'react';
import { Copy, Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { ModelStrategy, CachedSetup } from '../types';
import { CACHED_SETUPS } from '../data/presets';

interface ProjectFormProps {
  onSubmit: (data: {
    projectName: string;
    projectDescription: string;
    budget: number;
    preferredStrategy: ModelStrategy;
  }) => void;
  isLoading: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, isLoading }) => {
  const [projectName, setProjectName] = useState('Marketing Campaign & Content Studio');
  const [projectDescription, setProjectDescription] = useState(
    `Project Handoff:
1. User authentication and secure credential vault
2. Prompt expansion and high-resolution image generation
3. Automated short-form video clip synthesis
4. Real-time campaign tracking dashboard with conversion charts
5. Transactional email delivery and webhook notifications upon milestone completion`
  );
  const [budget, setBudget] = useState<number>(10);
  const [strategy, setStrategy] = useState<ModelStrategy>('mixed');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const HANDOFF_PROMPT = 'Give me a handoff of the project in key points.';

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(HANDOFF_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleApplyPreset = (preset: CachedSetup) => {
    setProjectName(preset.title);
    setProjectDescription(preset.promptDescription);
    setBudget(preset.recommendedBudget);
    setStrategy(preset.strategy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDescription.trim()) return;
    onSubmit({
      projectName: projectName.trim(),
      projectDescription: projectDescription.trim(),
      budget: Number(budget) || 10,
      preferredStrategy: strategy
    });
  };

  return (
    <div
      id="project-planner-card"
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
          Plan your project
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Decompose your workflow, compare model costs, and generate a structured project handoff.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label
            htmlFor="project-title-input"
            className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2"
          >
            Project Title
          </label>
          <input
            id="project-title-input"
            type="text"
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Where to? (e.g. Customer Support Agent, Marketing Campaign)"
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-black dark:text-white placeholder-neutral-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
          />
        </div>

        {/* Project Description with copyable prompt */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="project-desc-input"
              className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
            >
              Project Description / Handoff
            </label>
          </div>

          {/* Prompt copy callout box */}
          <div className="mb-3 p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Prompt to copy to Claude or ChatGPT:
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-black dark:text-white select-all">
                "{HANDOFF_PROMPT}"
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Copy this prompt, ask your AI where you have your project folder, then paste the response below.
              </div>
            </div>

            <button
              id="copy-handoff-prompt-btn"
              type="button"
              onClick={handleCopyPrompt}
              className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                copiedPrompt
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200'
              }`}
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>Prompt Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>

          <textarea
            id="project-desc-input"
            required
            rows={5}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Paste your project handoff here..."
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-black dark:text-white placeholder-neutral-400 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition resize-y"
          />

          {/* Quick preset chips */}
          <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] text-neutral-400 mr-1">Or load sample:</span>
            {CACHED_SETUPS.slice(0, 4).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Budget and Strategy in Uber Ride Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Budget */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="budget-amount-input"
                className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
              >
                Target Budget ($ USD)
              </label>
              <span className="text-xs font-mono font-bold text-black dark:text-white">
                ${budget.toFixed(2)}
              </span>
            </div>

            <div className="relative mb-2">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 font-mono font-bold">
                $
              </span>
              <input
                id="budget-amount-input"
                type="number"
                min="0"
                step="0.5"
                required
                value={budget}
                onChange={(e) => setBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-black dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              {[5, 10, 25, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBudget(val)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition cursor-pointer ${
                    budget === val
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          {/* Model Options (Uber ride tiers style) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
              Preferred Model Tier
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'free', label: 'Free Tier', sub: 'Flash Free & Groq ($0)' },
                { id: 'mixed', label: 'Balanced', sub: 'DeepSeek + Kimi + Flash' },
                { id: 'frontier', label: 'Frontier', sub: 'Claude 3.7 & GPT-4o' },
                { id: 'local', label: 'Local', sub: 'Private Ollama ($0)' }
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setStrategy(tier.id as ModelStrategy)}
                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                    strategy === tier.id
                      ? 'border-black bg-neutral-50 dark:border-white dark:bg-neutral-800 ring-1 ring-black dark:ring-white'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="text-xs font-bold text-black dark:text-white">
                    {tier.label}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                    {tier.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Big Solid Uber Button */}
        <div className="pt-2">
          <button
            id="generate-project-map-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white font-bold text-sm tracking-tight flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Project & Decomposing Tasks...</span>
              </>
            ) : (
              <>
                <span>Get Project Map & Cost Allocation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
