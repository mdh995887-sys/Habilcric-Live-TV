import React, { useState, useEffect } from 'react';
import { AppSettings, AppNotification } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  Heart, RefreshCw, Menu, LogIn, LogOut, Shield,
  Search, Sparkles, ChevronDown, Tv, Hash
} from 'lucide-react';

interface HeaderProps {
  appSettings: AppSettings;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenAdmin: () => void;
  onToggleTvMode: () => void;
  isTvMode: boolean;
  onRefreshData: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  favoritesCount?: number;
  onToggleFavoritesFilter?: () => void;
  isFavoritesOnly?: boolean;
  onOpenSettings?: () => void;
  isAdminLoggedIn?: boolean;
  onToggleDialpad?: () => void;
  isDialpadOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  appSettings,
  notifications,
  onOpenNotifications,
  onOpenAdmin,
  onToggleTvMode,
  isTvMode,
  onRefreshData,
  searchQuery,
  onSearchChange,
  favoritesCount = 0,
  onToggleFavoritesFilter,
  isFavoritesOnly = false,
  onOpenSettings,
  isAdminLoggedIn = false,
  onToggleDialpad,
  isDialpadOpen = false
}) => {
  const { language } = useTranslation();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0a0f1d] border-b border-slate-800/80 px-4 sm:px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Live TV Title matching Screenshot */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans select-none">
              Live TV
            </h1>
          </div>

          {/* Right: Exactly the 4 icons from the screenshot: Heart, Refresh, Menu, Door/Admin */}
          <div className="flex items-center gap-4 sm:gap-6 text-white">
            {/* 1. Favorites (Heart) */}
            <button
              onClick={onToggleFavoritesFilter}
              id="btn-favorites-header"
              className="p-1 text-white hover:text-rose-400 transition cursor-pointer relative"
              title="Favorites"
              aria-label="Favorites"
            >
              <Heart className={`w-6 h-6 stroke-[2.2] ${isFavoritesOnly ? 'fill-rose-500 text-rose-500' : 'fill-white text-white'}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* 2. Refresh */}
            <button
              onClick={onRefreshData}
              id="btn-refresh-header"
              className="p-1 text-white hover:text-cyan-400 transition cursor-pointer active:rotate-180 duration-300"
              title="Refresh Channels"
              aria-label="Refresh"
            >
              <RefreshCw className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* 3. Hamburger Menu */}
            <button
              onClick={onOpenSettings}
              id="btn-menu-header"
              className="p-1 text-white hover:text-slate-300 transition cursor-pointer"
              title="Menu & Settings"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* 4. Admin / LogIn / Door icon matching Screenshot */}
            <button
              onClick={onOpenAdmin}
              id="btn-admin-header"
              className="p-1 text-white hover:text-cyan-400 transition cursor-pointer"
              title={language === 'bn' ? 'এডমিন প্যানেল সেটআপ' : 'Admin Control Panel'}
              aria-label="Admin Panel"
            >
              <LogIn className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search Dropdown Input */}
      {isMobileSearchOpen && (
        <div className="md:hidden mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={language === 'bn' ? 'চ্যানেল খুঁজুন...' : 'Search channels...'}
              className="w-full pl-9 pr-8 py-2 bg-[#141b2a] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsMobileSearchOpen(false);
              onSearchChange('');
            }}
            className="text-xs text-slate-400 hover:text-white px-2 py-1.5"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
};
