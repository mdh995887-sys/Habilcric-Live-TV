import React from 'react';
import { Category } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  Radio, Award, Trophy, Flame, Tv, Film, 
  Clapperboard, Sparkles, Globe, Layers, Music, Theater, PlayCircle,
  Dribbble, Zap, Shield, Flag, Compass, Circle, Activity, Star,
  BookOpen, Smile, CloudSun, Laptop
} from 'lucide-react';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  channelCounts?: Record<string, number>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  channelCounts = {},
}) => {
  const { language, setLanguage, t } = useTranslation();

  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'radio': return <Radio className="w-3.5 h-3.5" />;
      case 'star': case 'favourite': case 'favourites': return <Star className="w-3.5 h-3.5" />;
      case 'award': return <Award className="w-3.5 h-3.5" />;
      case 'trophy': return <Trophy className="w-3.5 h-3.5" />;
      case 'flame': return <Flame className="w-3.5 h-3.5" />;
      case 'tv': return <Tv className="w-3.5 h-3.5" />;
      case 'film': return <Film className="w-3.5 h-3.5" />;
      case 'clapperboard': return <Clapperboard className="w-3.5 h-3.5" />;
      case 'sparkles': return <Sparkles className="w-3.5 h-3.5" />;
      case 'globe': return <Globe className="w-3.5 h-3.5" />;
      case 'music': return <Music className="w-3.5 h-3.5" />;
      case 'dribbble': return <Dribbble className="w-3.5 h-3.5" />;
      case 'zap': return <Zap className="w-3.5 h-3.5" />;
      case 'shield': return <Shield className="w-3.5 h-3.5" />;
      case 'flag': return <Flag className="w-3.5 h-3.5" />;
      case 'compass': return <Compass className="w-3.5 h-3.5" />;
      case 'circle': return <Circle className="w-3.5 h-3.5" />;
      case 'activity': return <Activity className="w-3.5 h-3.5" />;
      case 'theater': case 'drama': case 'mask': case 'culture': return <Theater className="w-3.5 h-3.5" />;
      case 'bookopen': case 'book': case 'education': return <BookOpen className="w-3.5 h-3.5" />;
      case 'smile': case 'kids': return <Smile className="w-3.5 h-3.5" />;
      case 'cloudsun': case 'cloud': case 'weather': return <CloudSun className="w-3.5 h-3.5" />;
      case 'laptop': case 'tech': case 'technology': return <Laptop className="w-3.5 h-3.5" />;
      default: return <Layers className="w-3.5 h-3.5" />;
    }
  };

  const getTranslatedCategory = (name: string): { primary: string; secondary?: string } => {
    const upper = name.toUpperCase();
    const bnDict: Record<string, string> = {
      'ALL': 'সব চ্যানেল',
      'LIVE NOW': '🔴 লাইভ চলছে',
      'FAVOURITES': '⭐ ফেভারিট',
      'FAVORITES': '⭐ ফেভারিট',
      'MOST WATCHED': 'জনপ্রিয়',
      'SPORTS': '🏆 স্পোর্টস',
      'FOOTBALL': '⚽ ফুটবল',
      'CRICKET': '🏏 ক্রিকেট',
      'NEWS': '📰 খবর ও সংবাদ',
      'BANGLADESH': '🇧🇩 বাংলাদেশ',
      'BANGLA': 'বাংলা',
      'INDIA': '🇮🇳 ভারত',
      'HINDI': 'हिन्दी হিন্দি',
      'MOVIES': '🎬 সিনেমা',
      'MUSIC': '🎵 গান ও মিউজিক',
      'INTERNATIONAL': '🌍 আন্তর্জাতিক',
      'WORLD': '🌎 বিশ্ব',
      'ARABIC': '🇦🇪 আরবি',
      'EDUCATION': '📚 শিক্ষা',
      'KIDS': '👶 শিশুতোষ',
      'WEATHER': '🌦 আবহাওয়া',
      'MOTORSPORT': '🏎 মোটরস্পোর্ট',
      'MOTORSPORTS': '🏎 মোটরস্পোর্টস',
      'TENNIS': '🎾 টেনিস',
      'BASKETBALL': '🏀 বাস্কেটবল',
      'COMBAT SPORTS': '🥊 কম্ব্যাট স্পোর্টস',
      'COMBAT': '🥊 কম্ব্যাট ও বক্সিং',
      'ENTERTAINMENT': '📺 বিনোদন',
      'CULTURE': '🎭 সংস্কৃতি',
      'TECHNOLOGY': '🧑💻 প্রযুক্তি',
      'REGIONAL': '🌐 আঞ্চলিক চ্যানেল',
      'AMERICAN SPORTS': 'আমেরিকান স্পোর্টস',
      'GOLF & EXTREME': 'গলফ ও এক্সট্রিম',
      'BANGLA ENTERTAINMENT': 'বাংলা বিনোদন',
      'GOVERNMENT': 'সরকারি / বিটিভি জাতীয়',
      'INDIAN BANGLA': 'ভারতীয় বাংলা',
      'SPORTS & ENTERTAINMENT': 'স্পোর্টস ও বিনোদন',
      'BANGLA NEWS': 'বাংলা খবর',
      'BANGLA MOVIES': 'বাংলা সিনেমা',
      'BANGLA MOVIE': 'বাংলা সিনেমা',
      'HINDI MOVIES': 'হিন্দি সিনেমা',
      'HINDI MOVIE': 'হিন্দি সিনেমা',
      'NATOK & DRAMA': 'নাটক ও ড্রামা',
      'DRAMA': 'নাটক',
      'SONGS': 'গান ও মিউজিক',
      'BANGLADESH SPORTS': 'বাংলাদেশ স্পোর্টস',
      'INDIA SPORTS': '🇮🇳 ইন্ডিয়া স্পোর্টস',
      'INDIA CRICKET': '🏏 ইন্ডিয়া ক্রিকেট',
      'USA SPORTS': 'ইউএসএ স্পোর্টস',
      'UK SPORTS': 'ইউকে স্পোর্টস',
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
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max px-1">
        {/* All Channels Pill */}
        <button
          onClick={() => onSelectCategory('ALL')}
          id="cat-pill-all"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-[#0d1527] text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'সব চ্যানেল (ALL)' : 'ALL CHANNELS'}</span>
        </button>

        {sortedCategories.map((cat) => {
          const isSelected = selectedCategory.toUpperCase() === cat.name.toUpperCase();
          const count = channelCounts[cat.name.toUpperCase()] || 0;
          const { primary, secondary } = getTranslatedCategory(cat.name);

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              id={`cat-pill-${cat.slug || cat.id}`}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-[#0d1527] text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/90'
              }`}
            >
              <span className={isSelected ? 'text-slate-950' : 'text-cyan-400'}>
                {getIcon(cat.icon)}
              </span>
              <span>
                {primary}
                {secondary && <span className="opacity-75 font-normal ml-1 text-[11px]">({secondary})</span>}
              </span>
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
