import React, { useState } from 'react';
import { Copy, Check, Download, ArrowLeft } from 'lucide-react';
import { ProjectPlan } from '../types';

interface SpecDocViewProps {
  plan: ProjectPlan | null;
  onBackToPlanner: () => void;
}

export const SpecDocView: React.FC<SpecDocViewProps> = ({ plan, onBackToPlanner }) => {
  const [copied, setCopied] = useState(false);

  const defaultSpec =
    plan?.specDocMarkdown ||
    `# Technical Specification & Resource Allocation Plan
**Project Name:** AI Workflow Architecture
**Status:** Ready for Implementation

## 1. Executive Summary
This document establishes the technical blueprint, token budget allocation, and model routing strategy. It is designed to achieve maximum performance and reliability while strictly maintaining budget targets.

## 2. Recommended Core Platform Capabilities (Discussion Features)
Based on our architectural review, the following platform components should be added to the production stack:

1. **Semantic Prompt Caching Layer:**
   - Ingests user system prompts and few-shot schemas into server-side cache.
   - Saves between 35% and 65% on recurring input tokens.

2. **Model Cascade & Circuit Breaker Pattern:**
   - Primary: Fast balanced model (DeepSeek-V3 or Kimi).
   - Secondary Fallback: Gemini 2.5 Flash for sub-300ms SLA and multimodal needs.
   - Local Fallback: Ollama / Llama 3.3 for guaranteed offline compliance.

3. **Multi-Tenant Token Quota & Budget Guardian:**
   - Hard budget ceilings per project environment.
   - Automated alerts at 80% and 95% spend thresholds.

4. **Streaming TTFT (Time-To-First-Token) Optimization:**
   - Server-Sent Events (SSE) pipe with client-side reactive render loops.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([defaultSpec], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(plan?.projectName || 'project-spec').toLowerCase().replace(/\s+/g, '-')}-spec.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="spec-doc-view-root" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToPlanner}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
              Architecture Spec Document
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Technical roadmap, task assignments, and budget governance recommendations.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-black dark:text-white transition flex items-center space-x-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      {/* Markdown Preview Area */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8">
        <pre className="font-mono text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
          {defaultSpec}
        </pre>
      </div>
    </div>
  );
};
