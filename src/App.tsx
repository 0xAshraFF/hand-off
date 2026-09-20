import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProjectForm } from './components/ProjectForm';
import { RoadmapView } from './components/RoadmapView';
import { CommunityDashboard } from './components/CommunityDashboard';
import { SpecDocView } from './components/SpecDocView';
import { ProjectPlan, ModelStrategy, CommunitySubmission } from './types';
import { INITIAL_COMMUNITY_SUBMISSIONS } from './data/presets';

export default function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'community' | 'spec'>('planner');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  const [currentPlan, setCurrentPlan] = useState<ProjectPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [communitySubmissions, setCommunitySubmissions] = useState<CommunitySubmission[]>(INITIAL_COMMUNITY_SUBMISSIONS);
  const [communityStats, setCommunityStats] = useState({
    totalProjects: INITIAL_COMMUNITY_SUBMISSIONS.length,
    avgBudget: 11.75,
    avgPlannedCost: 5.91,
    avgCostSavings: 50,
    topModels: [
      { name: 'DeepSeek-V3', count: 4 },
      { name: 'Gemini 2.5 Flash', count: 3 },
      { name: 'Kimi Moonshot', count: 2 },
      { name: 'Ollama Llama 3.3', count: 2 }
    ]
  });
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Sync dark mode class with html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Initial load
  useEffect(() => {
    fetchCommunityData();
    // Pre-populate with initial clean plan
    handleGeneratePlan({
      projectName: 'Marketing Campaign & Content Studio',
      projectDescription: `Project Handoff:
1. User authentication and secure credential vault
2. Prompt expansion and high-resolution image generation
3. Automated short-form video clip synthesis
4. Real-time campaign tracking dashboard with conversion charts
5. Transactional email delivery and webhook notifications upon milestone completion`,
      budget: 10,
      preferredStrategy: 'mixed'
    });
  }, []);

  const fetchCommunityData = async () => {
    try {
      const res = await fetch('/api/community');
      if (res.ok) {
        const data = await res.json();
        if (data.submissions) setCommunitySubmissions(data.submissions);
        if (data.stats) setCommunityStats(data.stats);
      }
    } catch (err) {
      console.warn('Could not fetch community data from server, using local store');
    }
  };

  const handleGeneratePlan = async (data: {
    projectName: string;
    projectDescription: string;
    budget: number;
    preferredStrategy: ModelStrategy;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const resJson = await res.json();
      if (resJson.plan) {
        setCurrentPlan(resJson.plan);
      }
    } catch (err) {
      console.error('Failed to generate plan from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamically update model for a task, immediately updating total cost and re-rendering
  const handleUpdateTaskModel = (taskId: string, modelId: string) => {
    if (!currentPlan) return;

    const updatedTasks = currentPlan.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          selectedModelId: modelId
        };
      }
      return task;
    });

    const newTotalCost = Number(
      updatedTasks
        .reduce((sum, task) => {
          const chosen = task.availableModels.find((m) => m.modelId === task.selectedModelId);
          return sum + (chosen ? chosen.projectedCost : 0);
        }, 0)
        .toFixed(2)
    );

    const newUtilization = currentPlan.budget > 0
      ? Math.min(100, Math.round((newTotalCost / currentPlan.budget) * 100))
      : 100;

    const newFeasibility = newTotalCost <= currentPlan.budget
      ? 96
      : Math.max(30, Math.round(95 - ((newTotalCost - currentPlan.budget) / currentPlan.budget) * 50));

    // Update handoff summary text as well
    const updatedHandoff = `# PROJECT HANDOFF: ${currentPlan.projectName}
Budget: $${currentPlan.budget.toFixed(2)} USD | Allocated Spend: $${newTotalCost.toFixed(2)} USD

## Tasks & Model Routing:
${updatedTasks
  .map((t) => {
    const chosen = t.availableModels.find((m) => m.modelId === t.selectedModelId);
    return `- Task ${t.taskNumber} [${t.title}]: ${chosen?.modelName || 'DeepSeek-V3'} ($${chosen?.projectedCost.toFixed(3)} USD, ${chosen?.latencyMs}ms, ${chosen?.reliabilityPercent}% SLA)`;
  })
  .join('\n')}

## Deliverables:
${updatedTasks.flatMap((t) => t.deliverables.map((d) => `- ${d} (${t.title})`)).join('\n')}`;

    setCurrentPlan({
      ...currentPlan,
      tasks: updatedTasks,
      totalCost: newTotalCost,
      budgetUtilizationPercent: newUtilization,
      feasibilityScore: newFeasibility,
      handoffSummary: updatedHandoff
    });
  };

  const handlePublishToCommunity = async () => {
    if (!currentPlan) return;
    setIsPublishing(true);

    const modelsUsed = currentPlan.tasks.map((t) => {
      const m = t.availableModels.find((opt) => opt.modelId === t.selectedModelId);
      return {
        modelName: m?.modelName || 'DeepSeek-V3',
        taskTitle: t.title,
        provider: m?.provider || 'DeepSeek',
        cost: m?.projectedCost || 0
      };
    });

    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: currentPlan.projectName,
          category: currentPlan.tasks[0]?.category === 'video' ? 'Creative' : 'Automation & Studio',
          description: currentPlan.projectDescription,
          budget: currentPlan.budget,
          totalCost: currentPlan.totalCost,
          strategy: currentPlan.preferredStrategy,
          modelsUsed
        })
      });

      if (res.ok) {
        await fetchCommunityData();
      }
    } catch (err) {
      console.error('Error publishing plan to community:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCloneProject = (sub: CommunitySubmission) => {
    handleGeneratePlan({
      projectName: sub.projectName,
      projectDescription: sub.description,
      budget: sub.budget,
      preferredStrategy: sub.strategy
    });
    setActiveTab('planner');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white transition-colors">
      {/* Uber Minimal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        communityCount={communitySubmissions.length}
      />

      {/* Main Single-Column Focused Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {activeTab === 'planner' && (
          <div className="space-y-8">
            {/* Input Form */}
            <ProjectForm
              onSubmit={handleGeneratePlan}
              isLoading={isLoading}
            />

            {/* Generated Implementation Roadmap & Handoff */}
            {currentPlan && (
              <RoadmapView
                plan={currentPlan}
                onUpdateTaskModel={handleUpdateTaskModel}
                onPublishToCommunity={handlePublishToCommunity}
                onViewSpecDoc={() => setActiveTab('spec')}
                isPublishing={isPublishing}
              />
            )}
          </div>
        )}

        {activeTab === 'community' && (
          <CommunityDashboard
            submissions={communitySubmissions}
            stats={communityStats}
            onCloneProject={handleCloneProject}
          />
        )}

        {activeTab === 'spec' && (
          <SpecDocView
            plan={currentPlan}
            onBackToPlanner={() => setActiveTab('planner')}
          />
        )}
      </main>

      {/* Uber Minimal Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-semibold text-black dark:text-white">
            Handoff.
          </div>
          <div className="text-neutral-500 dark:text-neutral-400">
            Task decomposition, dynamic model comparison & token budgeting.
          </div>
        </div>
      </footer>
    </div>
  );
}
