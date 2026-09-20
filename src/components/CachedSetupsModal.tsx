import React from 'react';
import { X, Sparkles, ArrowRight, DollarSign, Layers } from 'lucide-react';
import { CachedSetup } from '../types';
import { CACHED_SETUPS } from '../data/presets';

interface CachedSetupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSetup: (setup: CachedSetup) => void;
}

export const CachedSetupsModal: React.FC<CachedSetupsModalProps> = ({
  isOpen,
  onClose,
  onSelectSetup
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="cached-setups-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        id="cached-setups-modal-card"
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Cached Architecture Setups</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select an industry standard blueprint (Dashboards, Customer Service, Automation, Marketing) with pre-calibrated token budgets.
            </p>
          </div>
          <button
            id="close-cached-setups-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-3 pr-1">
          {CACHED_SETUPS.map((setup) => (
            <div
              key={setup.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                    {setup.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {setup.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  {setup.shortDesc}
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Target Budget: ${setup.recommendedBudget}.00 USD • Preferred: {setup.strategy.toUpperCase()}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectSetup(setup);
                  onClose();
                }}
                className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-1 transition shadow-xs cursor-pointer"
              >
                <span>Load Blueprint</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
