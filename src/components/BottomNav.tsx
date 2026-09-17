import React from 'react';

export type MainNavTab = 'livetv' | 'highlights' | 'series' | 'movies';

interface BottomNavProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050811] border-t border-slate-800/90 px-3 sm:px-6 py-2 shadow-2xl safe-area-inset-bottom">
      <div className="max-w-md mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {/* Tab 1: LiveTV */}
        <button
          onClick={() => onTabChange('livetv')}
          id="tab-livetv"
          className={`flex-1 flex items-center justify-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none ${
            activeTab === 'livetv'
              ? 'border-2 border-[#eab308] bg-[#1a1705] text-[#facc15] shadow-lg shadow-yellow-500/10'
              : 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-500/5'
          }`}
        >
          LiveTV
        </button>

        <div className="w-px h-7 bg-slate-800/90 shrink-0" />

        {/* Tab 2: Series */}
        <button
          onClick={() => onTabChange('series')}
          id="tab-series"
          className={`flex-1 flex items-center justify-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none ${
            activeTab === 'series'
              ? 'border-2 border-[#eab308] bg-[#1a1705] text-[#facc15] shadow-lg shadow-yellow-500/10'
              : 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-500/5'
          }`}
        >
          Series
        </button>

        <div className="w-px h-7 bg-slate-800/90 shrink-0" />

        {/* Tab 3: Movies */}
        <button
          onClick={() => onTabChange('movies')}
          id="tab-movies"
          className={`flex-1 flex items-center justify-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none ${
            activeTab === 'movies'
              ? 'border-2 border-[#eab308] bg-[#1a1705] text-[#facc15] shadow-lg shadow-yellow-500/10'
              : 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-500/5'
          }`}
        >
          Movies
        </button>
      </div>
    </nav>
  );
};


