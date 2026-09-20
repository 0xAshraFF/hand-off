import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  ArrowDown,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { ProjectPlan, TaskPlan, TaskModelCost } from '../types';

interface RoadmapViewProps {
  plan: ProjectPlan;
  onUpdateTaskModel: (taskId: string, modelId: string) => void;
  onPublishToCommunity: () => void;
  onViewSpecDoc: () => void;
  isPublishing?: boolean;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  plan,
  onUpdateTaskModel,
  onPublishToCommunity,
  onViewSpecDoc,
  isPublishing = false
}) => {
  const [copiedHandoff, setCopiedHandoff] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Dynamic live total cost based on active selections
  const currentTotalCost = Number(
    plan.tasks
      .reduce((sum, task) => {
        const active = task.availableModels.find((m) => m.modelId === task.selectedModelId);
        return sum + (active ? active.projectedCost : 0);
      }, 0)
      .toFixed(2)
  );

  const budgetDelta = Number((plan.budget - currentTotalCost).toFixed(2));
  const isOverBudget = currentTotalCost > plan.budget;

  // Generate clean handoff text
  const handoffText =
    plan.handoffSummary ||
    `# PROJECT HANDOFF: ${plan.projectName}
Budget: $${plan.budget.toFixed(2)} USD | Allocated Spend: $${currentTotalCost.toFixed(2)} USD

## Tasks & Model Routing:
${plan.tasks
  .map((t) => {
    const chosen = t.availableModels.find((m) => m.modelId === t.selectedModelId);
    return `- Task ${t.taskNumber} [${t.title}]: ${chosen?.modelName || 'DeepSeek-V3'} ($${chosen?.projectedCost.toFixed(3)} USD, ${chosen?.latencyMs}ms, ${chosen?.reliabilityPercent}% SLA)`;
  })
  .join('\n')}

## Deliverables:
${plan.tasks.flatMap((t) => t.deliverables.map((d) => `- ${d} (${t.title})`)).join('\n')}`;

  const handleCopyHandoff = () => {
    navigator.clipboard.writeText(handoffText);
    setCopiedHandoff(true);
    setTimeout(() => setCopiedHandoff(false), 2500);
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div id="project-map-section" className="space-y-6">
      {/* Top Cost & Budget Summary Card (Uber Receipt style) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 dark:border-neutral-800 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Project Map & Allocation
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
              {plan.projectName}
            </h2>
          </div>

          {/* Large Cost Numbers */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase text-neutral-400">Target Budget</div>
              <div className="text-lg font-mono font-bold text-neutral-600 dark:text-neutral-300">
                ${plan.budget.toFixed(2)}
              </div>
            </div>
            <div className="text-right pl-4 border-l border-neutral-200 dark:border-neutral-800">
              <div className="text-[11px] font-bold uppercase text-neutral-400">Total Estimated Cost</div>
              <div className="text-2xl font-mono font-black text-black dark:text-white">
                ${currentTotalCost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Status */}
        <div className="mt-4 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2">
            {isOverBudget ? (
              <span className="flex items-center space-x-1 text-rose-600 dark:text-rose-400 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Over budget by ${Math.abs(budgetDelta).toFixed(2)} USD</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <TrendingDown className="w-4 h-4" />
                <span>Within budget (${budgetDelta.toFixed(2)} USD remaining buffer)</span>
              </span>
            )}
          </div>
          <span className="text-neutral-400 font-mono text-[11px]">
            {plan.tasks.length} tasks allocated
          </span>
        </div>
      </div>

      {/* Project Handoff Box (User Priority Request) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 transition-colors">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">
              Generated Project Handoff
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Ready to copy and paste into your project codebase or team documentation.
            </p>
          </div>

          <button
            id="copy-project-handoff-btn"
            type="button"
            onClick={handleCopyHandoff}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              copiedHandoff
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                : 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200'
            }`}
          >
            {copiedHandoff ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>Handoff Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Project Handoff</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-800 dark:text-neutral-200 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap selection:bg-neutral-300 dark:selection:bg-neutral-700">
          {handoffText}
        </pre>
      </div>

      {/* Task by Task Model Comparison (One-page layout) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-black dark:text-white">
            Task Model Breakdown & Comparison
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Click any model to reallocate that task. Total price, latency SLA, and reliability update in real time.
          </p>
        </div>

        {plan.tasks.map((task: TaskPlan) => {
          const activeChoice = task.availableModels.find((m) => m.modelId === task.selectedModelId);

          // Focus on top relevant comparison choices (e.g., DeepSeek, Kimi, Gemini Flash, Claude Haiku, Local)
          const displayedModels = task.availableModels.filter((m) =>
            ['deepseek-v3', 'kimi-moonshot-k1.5', 'gemini-2.5-flash', 'claude-3-5-haiku', 'ollama-llama-3.3-70b'].includes(m.modelId)
          );

          return (
            <div
              key={task.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 transition-colors"
            >
              {/* Task Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-md bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center justify-center">
                    {task.taskNumber}
                  </span>
                  <h4 className="font-bold text-sm text-black dark:text-white">
                    {task.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-neutral-400">Active:</span>
                  <span className="font-bold text-black dark:text-white">
                    {activeChoice?.modelName}
                  </span>
                  <span className="font-mono font-bold text-black dark:text-white px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                    ${activeChoice?.projectedCost.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Model Choice Pills (Uber Ride Style Horizontal Selector) */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                {displayedModels.map((opt: TaskModelCost) => {
                  const isSelected = task.selectedModelId === opt.modelId;

                  return (
                    <button
                      key={opt.modelId}
                      type="button"
                      onClick={() => onUpdateTaskModel(task.id, opt.modelId)}
                      className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-black bg-neutral-50 dark:border-white dark:bg-neutral-800 ring-1 ring-black dark:ring-white'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <div className="text-xs font-bold text-black dark:text-white truncate">
                            {opt.modelName}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {opt.provider}
                          </div>
                        </div>

                        <div className="font-mono font-bold text-xs text-black dark:text-white">
                          ${opt.projectedCost.toFixed(2)}
                        </div>
                      </div>

                      {/* Latency and Reliability */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 mt-1 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{opt.latencyMs}ms</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Shield className="w-3 h-3" />
                          <span>{opt.reliabilityPercent}%</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-black dark:text-white">
            {isConfirmed ? '✓ Allocation Confirmed' : 'Ready to confirm this project allocation?'}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Total project spend locked at ${currentTotalCost.toFixed(2)} USD.
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onViewSpecDoc}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-black dark:text-white transition cursor-pointer"
          >
            View Spec Document
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white text-xs font-bold transition cursor-pointer"
          >
            {isConfirmed ? 'Locked & Ready' : 'Confirm Allocation'}
          </button>
        </div>
      </div>
    </div>
  );
};
