import React, { useState } from 'react';
import { Search, ArrowUpRight, Heart, Eye } from 'lucide-react';
import { CommunitySubmission } from '../types';

interface CommunityDashboardProps {
  submissions: CommunitySubmission[];
  stats: {
    totalProjects: number;
    avgBudget: number;
    avgPlannedCost: number;
    avgCostSavings: number;
    topModels: { name: string; count: number }[];
  };
  onCloneProject: (submission: CommunitySubmission) => void;
}

export const CommunityDashboard: React.FC<CommunityDashboardProps> = ({
  submissions,
  stats,
  onCloneProject
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Marketing', 'Customer Service', 'Common Automation', 'Dashboards & Analytics'];

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesCat =
      selectedCategory === 'All' ||
      sub.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      sub.category === selectedCategory;
    const matchesSearch =
      sub.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.modelsUsed.some((m) => m.modelName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const toggleLike = (id: string) => {
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div id="community-dashboard-root" className="space-y-6">
      {/* Header & High-Level Metrics */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
              Community Architectures & Trends
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Live telemetry on what developers are building, models they route to, and cost efficiency.
            </p>
          </div>

          <div className="flex items-center space-x-6 text-xs">
            <div>
              <div className="text-[11px] font-bold uppercase text-neutral-400">Total Projects</div>
              <div className="text-lg font-mono font-black text-black dark:text-white">
                {stats.totalProjects}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-neutral-400">Avg Savings</div>
              <div className="text-lg font-mono font-black text-black dark:text-white">
                {stats.avgCostSavings}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-neutral-400">Avg Cost</div>
              <div className="text-lg font-mono font-black text-black dark:text-white">
                ${stats.avgPlannedCost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Top Models Bar */}
        <div className="pt-6">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
            Most Deployed Model Allocations
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.topModels.slice(0, 4).map((m) => (
              <div
                key={m.name}
                className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700"
              >
                <div className="text-xs font-bold text-black dark:text-white truncate">
                  {m.name}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Used in {m.count} architectures
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Categories */}
        <div className="flex items-center flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search projects or models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSubmissions.map((sub) => {
          const isLiked = likedIds[sub.id];

          return (
            <div
              key={sub.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                      {sub.category}
                    </span>
                    <h3 className="text-sm font-bold text-black dark:text-white mt-1.5">
                      {sub.projectName}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-black dark:text-white">
                      ${sub.totalCost.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Budget: ${sub.budget.toFixed(2)}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 mb-3">
                  {sub.description}
                </p>

                {/* Models tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {sub.modelsUsed.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    >
                      {m.modelName}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3 text-neutral-400 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{sub.views}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleLike(sub.id)}
                    className="flex items-center space-x-1 hover:text-black dark:hover:text-white transition cursor-pointer"
                  >
                    <Heart
                      className={`w-3 h-3 ${
                        isLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'
                      }`}
                    />
                    <span>{sub.likes + (isLiked ? 1 : 0)}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onCloneProject(sub)}
                  className="px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>Load Plan</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
