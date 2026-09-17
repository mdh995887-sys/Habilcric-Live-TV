import React from 'react';
import { Category } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  Radio, Award, Trophy, Flame, Tv, Film, 
  Clapperboard, Sparkles, Globe, Layers, Music, Theater,
  Dribbble, Zap, Shield, Flag, Compass, Circle, Activity,
  Heart, CheckCircle2, SlidersHorizontal
} from 'lucide-react';

interface SportsSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  channelCounts: Record<string, number>;
  favoritesCount: number;
  isFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  onlyActive: boolean;
  onToggleOnlyActive: () => void;
  totalChannelsCount: number;
}

export const SportsSidebar: React.FC<SportsSidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  channelCounts,
  favoritesCount,
  isFavoritesOnly,
  onToggleFavorites,
  onlyActive,
  onToggleOnlyActive,
  totalChannelsCount,
}) => {
  const { language } = useTranslation();

  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'radio': return <Radio className="w-4 h-4" />;
      case 'award': return <Award className="w-4 h-4" />;
      case 'trophy': return <Trophy className="w-4 h-4" />;
      case 'flame': return <Flame className="w-4 h-4" />;
      case 'tv': return <Tv className="w-4 h-4" />;
      case 'film': return <Film className="w-4 h-4" />;
      case 'clapperboard': return <Clapperboard className="w-4 h-4" />;
      case 'sparkles': return <Sparkles className="w-4 h-4" />;
      case 'globe': return <Globe className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      case 'dribbble': return <Dribbble className="w-4 h-4" />;
      case 'zap': return <Zap className="w-4 h-4" />;
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'flag': return <Flag className="w-4 h-4" />;
      case 'compass': return <Compass className="w-4 h-4" />;
      case 'circle': return <Circle className="w-4 h-4" />;
      case 'activity': return <Activity className="w-4 h-4" />;
      case 'theater': case 'drama': case 'mask': return <Theater className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  const getTranslatedCategory = (name: string): { primary: string; secondary?: string } => {
    const upper = name.toUpperCase();
    const bnDict: Record<string, string> = {
      'ALL': 'সব চ্যানেল',
      'LIVE NOW': '🔴 লাইভ চলছে',
      'MOST WATCHED': 'জনপ্রিয় স্পোর্টস',
      'FOOTBALL': 'ফুটবল',
      'CRICKET': 'ক্রিকেট',
      'BASKETBALL': 'বাস্কেটবল',
      'TENNIS': 'টেনিস',
      'MOTORSPORTS': 'মোটরস্পোর্টস',
      'MOTORSPORT': 'মোটরস্পোর্ট',
      'COMBAT': 'কম্ব্যাট ও বক্সিং',
      'AMERICAN SPORTS': 'আমেরিকান স্পোর্টস',
      'GOLF & EXTREME': 'গলফ ও এক্সট্রিম',
      'INTERNATIONAL': 'আন্তর্জাতিক ফিড',
      'REGIONAL': 'আঞ্চলিক চ্যানেল',
      'SPORTS': 'স্পোর্টস নেটওয়ার্ক',
      'SPORTS & ENTERTAINMENT': 'স্পোর্টস ও বিনোদন',
      'BANGLA ENTERTAINMENT': 'বাংলা বিনোদন',
      'NEWS': 'সংবাদ চ্যানেল',
      'BANGLA NEWS': 'বাংলা সংবাদ',
      'GOVERNMENT': 'সরকারি / বিটিভি জাতীয়',
      'KIDS': 'শিশুতোষ / দুরন্ত কিডস',
      'INDIAN BANGLA': 'ভারতীয় বাংলা',
      'MOVIES': 'সিনেমা / মুভিজ',
      'ENTERTAINMENT': 'বিনোদন নেটওয়ার্ক',
      'INTERNATIONAL CRICKET': 'আন্তর্জাতিক ক্রিকেট',
      'SPORTS NEWS': 'স্পোর্টস বুলেটিন',
    };

    const bn = bnDict[upper];
    if (language === 'bn' && bn) {
      return { primary: bn, secondary: name };
    } else if (bn) {
      return { primary: name, secondary: bn };
    }
    return { primary: name };
  };

  const sortedCategories = [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-3">
      {/* Category Navigation Card */}
      <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-3 shadow-xl space-y-1.5 sticky top-20">
        <div className="flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-slate-400 tracking-wider uppercase">
          <span>{language === 'bn' ? 'স্পোর্টস ক্যাটাগরি' : 'Sports Categories'}</span>
          <span className="text-[11px] text-cyan-400 font-mono font-semibold">{totalChannelsCount} Ch</span>
        </div>

        {/* Quick Filter: All Channels */}
        <button
          onClick={() => onSelectCategory('ALL')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            !isFavoritesOnly && selectedCategory === 'ALL'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>{language === 'bn' ? 'সব চ্যানেল (All)' : 'All Sports Channels'}</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-bold ${
            !isFavoritesOnly && selectedCategory === 'ALL' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}>
            {totalChannelsCount}
          </span>
        </button>

        {/* Quick Filter: Favorites */}
        <button
          onClick={onToggleFavorites}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isFavoritesOnly
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Heart className={`w-4 h-4 ${isFavoritesOnly ? 'fill-white text-white' : 'text-rose-400'}`} />
            <span>{language === 'bn' ? 'পছন্দের চ্যানেল' : 'Favorite Channels'}</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-bold ${
            isFavoritesOnly ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {favoritesCount}
          </span>
        </button>

        {/* Divider */}
        <div className="h-px bg-slate-800/70 my-1" />

        {/* Scrollable list of categories */}
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto no-scrollbar space-y-1 pr-0.5">
          {sortedCategories.map((cat) => {
            const isSelected = !isFavoritesOnly && selectedCategory.toUpperCase() === cat.name.toUpperCase();
            const count = channelCounts[cat.name.toUpperCase()] || 0;
            const { primary, secondary } = getTranslatedCategory(cat.name);

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isSelected ? 'text-slate-950' : 'text-cyan-400 shrink-0'}>
                    {getIcon(cat.icon)}
                  </span>
                  <span className="truncate">
                    {primary}
                    {secondary && <span className="opacity-70 font-normal ml-1 text-[10px]">({secondary})</span>}
                  </span>
                </div>
                {count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0 ml-1.5 ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800/90 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Filter: Online status toggle */}
        <div className="pt-2 border-t border-slate-800/70">
          <button
            onClick={onToggleOnlyActive}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              onlyActive 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 ${onlyActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{language === 'bn' ? 'শুধুমাত্র লাইভ চ্যানেল' : 'Online Only'}</span>
            </div>
            <span className={`w-2 h-2 rounded-full ${onlyActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
          </button>
        </div>
      </div>
    </aside>
  );
};
