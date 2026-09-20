import React, { useState } from 'react';
import { Copy, Check, Terminal, X, Sparkles } from 'lucide-react';

interface HandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippet?: string;
}

export const HandoffModal: React.FC<HandoffModalProps> = ({ isOpen, onClose, snippet }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const defaultSnippet = snippet || `# Run this 1-line script in your terminal inside your project folder:
# It extracts file trees & requirements within token limits (< 1000 tokens)
cat << 'EOF' > project_context.md
# Project Architecture Handoff
Project: My AI App
Budget: $10.00 USD
Directory Overview:
- src/auth: User login, API keys
- src/media: Prompts, Image & Video processing
- src/dashboard: Real-time UI charts
- src/notifications: Webhook dispatchers
Target Models: Cheap frontier planner (GLM 5.3 / DeepSeek / Gemini)
EOF`;

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="handoff-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        id="handoff-modal-card"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Project Folder Handoff Prompt
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Run this in your project directory, then paste the generated summary into Project Description.
              </p>
            </div>
          </div>
          <button
            id="close-handoff-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This compact prompt template fits strictly within token limits, extracting key folders, dependencies, and target budget so the planner generates an exact, cost-optimized roadmap.
          </p>

          <div className="relative group">
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 selection:bg-indigo-500 selection:text-white">
              {defaultSnippet}
            </pre>
            <button
              id="copy-handoff-snippet-btn"
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Fits within Cursor, Claude Code, and terminal character limits</span>
          </div>
          <button
            id="done-handoff-modal-btn"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
