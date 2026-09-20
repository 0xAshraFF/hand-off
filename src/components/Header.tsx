import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'planner' | 'community' | 'spec';
  setActiveTab: (tab: 'planner' | 'community' | 'spec') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  communityCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  communityCount
}) => {
  return (
    <header
      id="main-app-header"
      className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black transition-colors"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('planner')}
            className="flex items-center space-x-2 text-left cursor-pointer"
          >
            <span className="font-black text-xl tracking-tighter text-black dark:text-white">
              Handoff<span className="text-neutral-400">.</span>
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-tab-planner"
              onClick={() => setActiveTab('planner')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              Planner
            </button>
            <button
              id="nav-tab-community"
              onClick={() => setActiveTab('community')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'community'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              <span>Trends</span>
              {communityCount > 0 && (
                <span className="text-[10px] font-mono px-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                  {communityCount}
                </span>
              )}
            </button>
            <button
              id="nav-tab-spec"
              onClick={() => setActiveTab('spec')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'spec'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              Spec
            </button>
          </nav>
        </div>

        {/* Right Action: Dark Mode */}
        <div className="flex items-center space-x-2">
          <button
            id="dark-mode-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
