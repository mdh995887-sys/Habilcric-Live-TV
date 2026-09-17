import React, { useState } from 'react';
import { Match, Channel } from '../../types';
import { 
  Calendar, Clock, Plus, Edit3, Trash2, Bell, BellRing, 
  Tv, Play, CheckCircle2, Volume2, ShieldAlert, Sparkles, Filter, X
} from 'lucide-react';
import { apiAddMatch, apiUpdateMatch, apiDeleteMatch } from '../../utils/api';
import { notificationManager } from '../../utils/notificationManager';

interface AdminMatchesTabProps {
  matches: Match[];
  channels: Channel[];
  onDataChange: () => void;
  showToast: (msg: string) => void;
}

export const AdminMatchesTab: React.FC<AdminMatchesTabProps> = ({
  matches = [],
  channels = [],
  onDataChange,
  showToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [filterSport, setFilterSport] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState<Partial<Match>>({
    title: '',
    sport: 'Cricket',
    tournament: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '20:00',
    channelId: '',
    broadcastChannel: 'T Sports HD',
    logo: '🏏',
    notify30: true,
    notify15: true,
    notify5: true,
    notifyLive: true,
    isUserNotified: true,
    status: 'upcoming'
  });

  const sportsList = ['Cricket', 'Football', 'Tennis', 'Basketball', 'Motorsport', 'Hockey', 'Badminton'];

  const handleOpenAdd = () => {
    setEditingMatch(null);
    setForm({
      title: '',
      sport: 'Cricket',
      tournament: '',
      date: new Date().toISOString().split('T')[0],
      startTime: `${String(new Date(Date.now() + 30 * 60000).getHours()).padStart(2, '0')}:${String(new Date(Date.now() + 30 * 60000).getMinutes()).padStart(2, '0')}`,
      channelId: channels[0]?.id || 'ch-1',
      broadcastChannel: channels[0]?.name || 'T Sports HD',
      logo: '🏏',
      notify30: true,
      notify15: true,
      notify5: true,
      notifyLive: true,
      isUserNotified: true,
      status: 'upcoming'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Match) => {
    setEditingMatch(m);
    setForm({ ...m });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchTimeVal = (form.matchTime || form.startTime || '').trim();
    if (!form.title || !form.date || !matchTimeVal) {
      showToast('⚠️ Title, Date, and Match Time are required');
      return;
    }

    const payload: Partial<Match> = {
      ...form,
      startTime: matchTimeVal,
      matchTime: matchTimeVal
    };

    try {
      if (editingMatch) {
        const res = await apiUpdateMatch(editingMatch.id, payload);
        if (res.success) {
          showToast('✅ Match updated successfully');
          setIsModalOpen(false);
          onDataChange();
        } else {
          showToast(`⚠️ Error: ${res.error || 'Failed to update'}`);
        }
      } else {
        const res = await apiAddMatch(payload);
        if (res.success) {
          showToast('✅ Match created and scheduled successfully');
          setIsModalOpen(false);
          onDataChange();
        } else {
          showToast(`⚠️ Error: ${res.error || 'Failed to add'}`);
        }
      }
    } catch (err: any) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove match "${title}"?`)) return;
    try {
      const res = await apiDeleteMatch(id);
      if (res.success) {
        showToast('🗑️ Match removed');
        onDataChange();
      } else {
        showToast(`⚠️ Error: ${res.error || 'Failed to delete'}`);
      }
    } catch (err: any) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleTestChime = (m: Match) => {
    notificationManager.testNotification();
    showToast(`🔔 Test notification sent for: ${m.title}`);
  };

  const filtered = matches.filter(m => {
    const matchesSport = filterSport === 'ALL' || m.sport.toLowerCase() === filterSport.toLowerCase();
    const matchesSearch = !searchQuery || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.tournament && m.tournament.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.broadcastChannel && m.broadcastChannel.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSport && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d162b] border border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Live Sports Matches & Notification Scheduler
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage upcoming fixtures, broadcast channels, and automated alert timing (30m, 15m, 5m, LIVE)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => notificationManager.testNotification()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            title="Test alert audio chime and banner"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Test Chime</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Match</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {['ALL', ...sportsList].map(s => (
            <button
              key={s}
              onClick={() => setFilterSport(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterSport === s
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {s === 'ALL' ? 'All Sports' : s}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search matches or tournaments..."
          className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full sm:w-64"
        />
      </div>

      {/* Matches Table / Cards */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No scheduled matches found</p>
            <p className="text-xs text-slate-500 mt-1">Click "Add Match" to schedule a live fixture</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Match / Teams</th>
                  <th className="py-3 px-3">Sport & Tournament</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Broadcast Channel</th>
                  <th className="py-3 px-3">Alert Schedule</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{m.logo || '🏏'}</span>
                        <div className="font-bold text-white text-sm">
                          {m.title}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{m.sport}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{m.tournament}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className="text-slate-200">{m.date}</div>
                      <div className="text-cyan-400 font-bold">{m.startTime}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-medium text-slate-200 text-[11px]">
                        <Tv className="w-3 h-3 text-red-400" />
                        {m.broadcastChannel || 'T Sports HD'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-mono ${m.notify30 !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>30m</span>
                        <span className={`px-1.5 py-0.5 rounded font-mono ${m.notify15 !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>15m</span>
                        <span className={`px-1.5 py-0.5 rounded font-mono ${m.notify5 !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>5m</span>
                        <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${m.notifyLive !== false ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-500'}`}>LIVE</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'live'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                          : m.status === 'finished'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      }`}>
                        {m.status === 'live' ? '🔴 LIVE' : m.status === 'finished' ? 'Finished' : 'Upcoming'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleTestChime(m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition"
                          title="Test Notification Chime"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Edit Match"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.title)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                          title="Delete Match"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h4 className="text-lg font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span>{editingMatch ? 'Edit Match' : 'Add New Match'}</span>
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Match Title / Teams *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. India vs Australia or Real Madrid vs Barcelona"
                  value={form.title || ''}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Sport
                  </label>
                  <select
                    value={form.sport || 'Cricket'}
                    onChange={e => {
                      const s = e.target.value;
                      const icon = s === 'Football' ? '⚽' : s === 'Tennis' ? '🎾' : s === 'Basketball' ? '🏀' : s === 'Motorsport' ? '🏎️' : '🏏';
                      setForm({ ...form, sport: s, logo: icon });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {sportsList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Sport Emoji / Logo
                  </label>
                  <input
                    type="text"
                    value={form.logo || '🏏'}
                    onChange={e => setForm({ ...form, logo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tournament / League
                </label>
                <input
                  type="text"
                  placeholder="e.g. ICC Champions Trophy 2026, Premier League"
                  value={form.tournament || ''}
                  onChange={e => setForm({ ...form, tournament: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Start Date (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date || ''}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Start Time (24h HH:mm) *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.startTime || '20:00'}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Broadcast Channel Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. T Sports HD, beIN Sports"
                    value={form.broadcastChannel || ''}
                    onChange={e => setForm({ ...form, broadcastChannel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Linked Live Channel
                  </label>
                  <select
                    value={form.channelId || ''}
                    onChange={e => {
                      const id = e.target.value;
                      const ch = channels.find(c => c.id === id);
                      setForm({
                        ...form,
                        channelId: id,
                        broadcastChannel: ch?.name || form.broadcastChannel
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">-- Select Channel --</option>
                    {channels.slice(0, 50).map(c => (
                      <option key={c.id} value={c.id}>CH {c.channelNumber} - {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Notification Schedule Triggers</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notify30 !== false}
                      onChange={e => setForm({ ...form, notify30: e.target.checked })}
                      className="rounded accent-cyan-400"
                    />
                    <span>30 Minutes Before</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notify15 !== false}
                      onChange={e => setForm({ ...form, notify15: e.target.checked })}
                      className="rounded accent-cyan-400"
                    />
                    <span>15 Minutes Before</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notify5 !== false}
                      onChange={e => setForm({ ...form, notify5: e.target.checked })}
                      className="rounded accent-cyan-400"
                    />
                    <span>5 Minutes Before</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notifyLive !== false}
                      onChange={e => setForm({ ...form, notifyLive: e.target.checked })}
                      className="rounded accent-cyan-400"
                    />
                    <span>🔴 LIVE NOW Alert</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20"
                >
                  {editingMatch ? 'Save Changes' : 'Create Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
