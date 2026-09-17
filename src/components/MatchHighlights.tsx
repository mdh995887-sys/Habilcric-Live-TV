import React, { useState, useMemo } from 'react';
import { Match, MatchHighlight, Channel } from '../types';
import { 
  Play, Film, Trophy, Award, Flame, CheckCircle2, 
  Clock, Calendar, Sparkles, X, Share2, Volume2, Video, ExternalLink
} from 'lucide-react';
import { getTeamLogo } from '../utils/teamLogos';
import { useTranslation } from '../contexts/LanguageContext';
import { toast } from '../utils/toast';

interface MatchHighlightsProps {
  matches: Match[];
  channels: Channel[];
  onSelectChannel?: (channel: Channel) => void;
}

export const MatchHighlights: React.FC<MatchHighlightsProps> = ({
  matches = [],
  channels = [],
  onSelectChannel
}) => {
  const { language } = useTranslation();
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeHighlight, setActiveHighlight] = useState<MatchHighlight | null>(null);
  const [activeMatchForModal, setActiveMatchForModal] = useState<Match | null>(null);

  // Helper to parse match teams and logos
  const getTeams = (match: Match) => {
    let t1 = match.team1Name;
    let t2 = match.team2Name;

    if (!t1 || !t2) {
      const parts = match.title.split(/\s+(?:vs|VS|v)\s+/i);
      t1 = parts[0]?.trim() || match.title;
      t2 = parts[1]?.trim() || 'Opponent';
    }

    const logo1 = match.team1Logo || getTeamLogo(t1);
    const logo2 = match.team2Logo || getTeamLogo(t2);

    return { team1: t2 ? `${t1} vs ${t2}` : t1, logo1, logo2, team1Name: t1, team2Name: t2 };
  };

  // Filter finished matches using existing status or time check
  const finishedMatches = useMemo(() => {
    return matches.filter(m => {
      // Check explicit status
      const isFinished = m.status === 'finished';
      if (!isFinished) return false;

      // Sport filter
      if (selectedSport !== 'ALL' && m.sport.toLowerCase() !== selectedSport.toLowerCase()) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = m.title.toLowerCase().includes(q);
        const tourMatch = m.tournament?.toLowerCase().includes(q) || false;
        const sportMatch = m.sport.toLowerCase().includes(q);
        if (!titleMatch && !tourMatch && !sportMatch) return false;
      }

      return true;
    });
  }, [matches, selectedSport, searchQuery]);

  // Generate or extract highlights for each finished match
  const getMatchHighlightsList = (match: Match): MatchHighlight[] => {
    if (match.highlights && match.highlights.length > 0) {
      return match.highlights;
    }

    // Default sample goal/wicket/highlight clips for finished matches based on sport
    const isCricket = match.sport.toLowerCase().includes('cricket');
    const isFootball = match.sport.toLowerCase().includes('football') || match.sport.toLowerCase().includes('soccer');
    const defaultThumb = match.logo || (isCricket ? '🏏' : isFootball ? '⚽' : '🏆');

    if (isCricket) {
      return [
        {
          id: `${match.id}-h1`,
          matchId: match.id,
          title: language === 'bn' ? 'স্টানিং উইকেট ও বোলিং হাইলাইট (১৮তম ওভার)' : 'Stunning Wicket & Bowling Breakdown (18th Over)',
          type: 'wicket',
          videoUrl: channels[0]?.streamUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          thumbnail: match.team1Logo || match.team2Logo,
          duration: '0:45',
          timestamp: '18.2 Overs'
        },
        {
          id: `${match.id}-h2`,
          matchId: match.id,
          title: language === 'bn' ? 'ম্যাচ উইনিং সিক্স ও বাউন্ডারি হাইলাইটস' : 'Match Winning Sixes & Boundary Highlights',
          type: 'boundary',
          videoUrl: channels[1]?.streamUrl || channels[0]?.streamUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          thumbnail: match.team2Logo || match.team1Logo,
          duration: '1:12',
          timestamp: '20th Over'
        }
      ];
    } else if (isFootball) {
      return [
        {
          id: `${match.id}-h1`,
          matchId: match.id,
          title: language === 'bn' ? 'মাস্টারপিস গোল ও সেলিব্রেশন (৭৮ মিনিট)' : 'Masterclass Goal & Celebration (78th Min)',
          type: 'goal',
          videoUrl: channels[0]?.streamUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          thumbnail: match.team1Logo,
          duration: '0:55',
          timestamp: '78\''
        },
        {
          id: `${match.id}-h2`,
          matchId: match.id,
          title: language === 'bn' ? 'দারুণ সেভ ও কাউন্টার অ্যাটাক হাইলাইটস' : 'Stunning Goalkeeper Saves & Highlights',
          type: 'highlight',
          videoUrl: channels[1]?.streamUrl || channels[0]?.streamUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          thumbnail: match.team2Logo,
          duration: '1:30',
          timestamp: 'Full Match'
        }
      ];
    } else {
      return [
        {
          id: `${match.id}-h1`,
          matchId: match.id,
          title: language === 'bn' ? 'ম্যাচের সেরা মুহূর্ত ও হাইলাইটস' : 'Full Match Key Highlights & Analysis',
          type: 'highlight',
          videoUrl: channels[0]?.streamUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          thumbnail: match.logo,
          duration: '1:45',
          timestamp: 'Highlights'
        }
      ];
    }
  };

  const sportsList = [
    { id: 'ALL', name: language === 'bn' ? 'সকল খেলা' : 'All Sports' },
    { id: 'Cricket', name: language === 'bn' ? 'ক্রিকেট' : 'Cricket' },
    { id: 'Football', name: language === 'bn' ? 'ফুটবল' : 'Football' },
    { id: 'Tennis', name: language === 'bn' ? 'টেনিস' : 'Tennis' },
    { id: 'Motorsport', name: language === 'bn' ? 'মোটরস্পোর্ট' : 'Motorsport' }
  ];

  return (
    <section className="my-6 bg-[#0a0f1d] border border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
              <Film className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>{language === 'bn' ? 'ম্যাচ হাইলাইটস (গোল ও উইকেট ক্লিপস)' : 'Match Highlights & Replays'}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-black">
                  {finishedMatches.length} Finished
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'bn' ? 'সমাপ্ত ম্যাচসমূহের এক্সক্লুসিভ গোল, উইকেট এবং রিক্যাপ ভিডিও ক্লিপস' : 'Recent goal & wicket video clips for finished matches automatically identified from fixtures'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Input for Highlights */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder={language === 'bn' ? 'হাইলাইটস খুঁজুন...' : 'Search highlights...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111a2e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 shadow-inner"
          />
        </div>
      </div>

      {/* Sport Filter Chips */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
        {sportsList.map(sport => {
          const isSelected = selectedSport.toLowerCase() === sport.id.toLowerCase();
          return (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                  : 'bg-[#111a2e] text-slate-400 hover:text-white border border-slate-700/80 hover:border-slate-500'
              }`}
            >
              {sport.name}
            </button>
          );
        })}
      </div>

      {/* Finished Matches & Highlights Grid */}
      {finishedMatches.length === 0 ? (
        <div className="py-16 text-center bg-[#0d1527] border border-slate-800/80 rounded-2xl p-6">
          <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">
            {language === 'bn' ? 'কোনো সমাপ্ত ম্যাচের হাইলাইটস পাওয়া যায়নি' : 'No Finished Match Highlights Available'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {language === 'bn' 
              ? 'অ্যাডমিন প্যানেল থেকে কোনো ম্যাচকে "Finished" হিসেবে চিহ্নিত করলে এখানে স্বয়ংক্রিয়ভাবে গোল ও উইকেটের ভিডিও ক্লিপ প্রদর্শিত হবে।' 
              : 'Matches marked with "Finished" status in the admin dashboard will automatically appear here with highlight clips.'}
          </p>
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {finishedMatches.map(match => {
            const { team1, team2Name, logo1, logo2 } = getTeams(match);
            const highlights = getMatchHighlightsList(match);

            return (
              <div 
                key={match.id}
                className="bg-[#111a2e]/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-xl hover:border-cyan-500/40 transition group"
              >
                <div>
                  {/* Match Header Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {language === 'bn' ? 'সমাপ্ত ম্যাচ' : 'Finished'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {match.date} • {match.sport}
                    </span>
                  </div>

                  {/* Teams Matchup */}
                  <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-3 mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                        <img src={logo1} alt={match.team1Name || 'Team 1'} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-xs font-bold text-white truncate">{match.team1Name || 'Team 1'}</span>
                    </div>

                    <span className="text-xs font-black text-slate-500 px-1.5">vs</span>

                    <div className="flex items-center justify-end gap-2.5 overflow-hidden text-right">
                      <span className="text-xs font-bold text-white truncate">{match.team2Name || 'Team 2'}</span>
                      <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                        <img src={logo2} alt={match.team2Name || 'Team 2'} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-white mb-3 line-clamp-1 group-hover:text-cyan-400 transition">
                    {match.title}
                  </h3>

                  {/* Highlights Clips List */}
                  <div className="space-y-2 mb-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'bn' ? '📹 গোল ও উইকেট ক্লিপস (' + highlights.length + ')' : `📹 Highlight Clips (${highlights.length})`}
                    </p>
                    {highlights.map(hl => (
                      <button
                        key={hl.id}
                        onClick={() => {
                          setActiveHighlight(hl);
                          setActiveMatchForModal(match);
                        }}
                        className="w-full text-left bg-[#0a0f1d]/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-2.5 flex items-center justify-between gap-3 transition group/clip cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover/clip:scale-110 transition shrink-0">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-200 group-hover/clip:text-cyan-300 truncate">{hl.title}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="text-cyan-400 font-mono font-bold">{hl.timestamp}</span>
                              <span>•</span>
                              <span>{hl.duration}</span>
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold shrink-0 uppercase">
                          {hl.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {match.broadcastChannel && (
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{language === 'bn' ? 'ব্রডকাস্ট:' : 'Broadcast:'} <strong className="text-slate-300">{match.broadcastChannel}</strong></span>
                    {onSelectChannel && (
                      <button
                        onClick={() => {
                          const target = channels.find(c => c.name.toLowerCase().includes(match.broadcastChannel?.toLowerCase() || ''));
                          if (target && onSelectChannel) {
                            onSelectChannel(target);
                            toast.success(`Playing ${target.name}`);
                          } else if (channels[0] && onSelectChannel) {
                            onSelectChannel(channels[0]);
                          }
                        }}
                        className="text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{language === 'bn' ? 'চ্যানেল দেখুন' : 'Watch Live'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Video Clip Player Modal */}
      {activeHighlight && activeMatchForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-slate-700/80 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95">
            {/* Close Button */}
            <button
              onClick={() => {
                setActiveHighlight(null);
                setActiveMatchForModal(null);
              }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider">
                {activeHighlight.type} Replay
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {activeMatchForModal.tournament || activeMatchForModal.sport}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white mb-4">
              {activeHighlight.title}
            </h3>

            {/* Video Player Box */}
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner mb-4 flex items-center justify-center">
              <video
                src={activeHighlight.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Match: <strong className="text-white">{activeMatchForModal.title}</strong></span>
              <span className="text-cyan-400 font-mono">Timestamp: {activeHighlight.timestamp}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
