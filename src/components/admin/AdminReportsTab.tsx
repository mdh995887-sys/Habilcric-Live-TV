import React, { useState, useEffect } from 'react';
import { ChannelIssueReport, IssueType, Channel } from '../../types';
import { 
  apiGetReports, apiUpdateReportStatus, apiDeleteReport, 
  apiClearResolvedReports, apiCheckSingleStream 
} from '../../utils/api';
import { 
  Flag, AlertCircle, RefreshCw, FileText, VolumeX, Sparkles, 
  HelpCircle, Trash2, CheckCircle2, Search, Filter, Play, 
  ExternalLink, Check, Clock, ShieldCheck, Activity, Smartphone
} from 'lucide-react';

interface AdminReportsTabProps {
  channels: Channel[];
  onDataChange: () => void;
  showToast: (msg: string) => void;
}

const ISSUE_TYPE_META: Record<IssueType, { label: string; labelBn: string; color: string; icon: React.ElementType }> = {
  dead_stream: {
    label: 'Dead / Broken Stream',
    labelBn: 'স্ট্রিম অচল / কাজ করছে না',
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: AlertCircle
  },
  buffering: {
    label: 'Buffering & Lag',
    labelBn: 'বারবার বাফারিং হচ্ছে',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: RefreshCw
  },
  metadata: {
    label: 'Incorrect Metadata / EPG',
    labelBn: 'নাম, লোগো বা তথ্য ভুল',
    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    icon: FileText
  },
  audio_sync: {
    label: 'Audio / Video Sync Issue',
    labelBn: 'অডিও ও ভিডিও অমিল',
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    icon: VolumeX
  },
  low_quality: {
    label: 'Low Video Quality',
    labelBn: 'ভিডিও কোয়ালিটি খারাপ',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: Sparkles
  },
  other: {
    label: 'Other Problem',
    labelBn: 'অন্যান্য সমস্যা',
    color: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
    icon: HelpCircle
  }
};

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  channels,
  showToast
}) => {
  const [reports, setReports] = useState<ChannelIssueReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [testingStreamId, setTestingStreamId] = useState<string | null>(null);
  const [streamTestResult, setStreamTestResult] = useState<Record<string, { online: boolean; latency: number }>>({});

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetReports();
      if (res.success && Array.isArray(res.reports)) {
        setReports(res.reports);
      }
    } catch (e) {
      console.warn('Error loading reports:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'investigating' | 'resolved' | 'dismissed') => {
    const res = await apiUpdateReportStatus(id, newStatus);
    if (res.success) {
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      showToast(`Report status updated to ${newStatus}`);
    } else {
      showToast(`Error: ${res.error || 'Failed to update report'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this issue report permanently?')) return;
    const res = await apiDeleteReport(id);
    if (res.success) {
      setReports(prev => prev.filter(r => r.id !== id));
      showToast('Report deleted successfully');
    } else {
      showToast(`Error: ${res.error || 'Failed to delete report'}`);
    }
  };

  const handleClearResolved = async () => {
    if (!window.confirm('Clear all resolved and dismissed reports?')) return;
    const res = await apiClearResolvedReports();
    if (res.success) {
      showToast(`Cleared ${res.removedCount || 0} resolved reports`);
      loadReports();
    } else {
      showToast(`Error: ${res.error || 'Failed to clear reports'}`);
    }
  };

  const handleTestStream = async (report: ChannelIssueReport) => {
    setTestingStreamId(report.id);
    try {
      const channel = channels.find(c => c.id === report.channelId);
      const urlToTest = report.streamUrl || channel?.streamUrl;
      if (!urlToTest) {
        showToast('No stream URL available to test');
        return;
      }

      const res = await apiCheckSingleStream(urlToTest, channel?.backupStreamUrl);
      if (res.success) {
        const isOnline = res.status === 'online';
        setStreamTestResult(prev => ({
          ...prev,
          [report.id]: { online: isOnline, latency: res.latencyMs || 0 }
        }));
        showToast(isOnline ? `✅ Stream is ONLINE (${res.latencyMs || 0}ms)` : `❌ Stream is OFFLINE (${res.primary?.error || 'unreachable'})`);
      }
    } catch (e: any) {
      showToast(`Stream test error: ${e.message}`);
    } finally {
      setTestingStreamId(null);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.issueType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.channelName || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchNum = String(r.channelNumber || '').includes(q);
      return matchName || matchDesc || matchNum;
    }
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const investigatingCount = reports.filter(r => r.status === 'investigating').length;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">Stream Issue Reports</h2>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              User-submitted reports for dead channels, buffering lags, and audio/video issues
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadReports}
            disabled={isLoading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleClearResolved}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700 hover:border-rose-500/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Resolved</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channel name, number or description..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['all', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {st} {st === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
            </button>
          ))}
        </div>

        {/* Issue Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none w-full md:w-auto"
        >
          <option value="all">All Issue Types</option>
          <option value="dead_stream">Dead Stream (অচল)</option>
          <option value="buffering">Buffering / Lag (বাফারিং)</option>
          <option value="metadata">Wrong Metadata (তথ্য ভুল)</option>
          <option value="audio_sync">Audio Sync (শব্দ সমস্যা)</option>
          <option value="low_quality">Low Quality (খারাপ মান)</option>
          <option value="other">Other (অন্যান্য)</option>
        </select>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="py-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-white font-bold text-base">No Issue Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-md">
            {reports.length === 0 
              ? 'All channels are streaming smoothly. When users report stream issues from the video player, they will appear here.' 
              : 'No reports match your current filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredReports.map((report) => {
            const meta = ISSUE_TYPE_META[report.issueType] || ISSUE_TYPE_META.other;
            const Icon = meta.icon;
            const channel = channels.find(c => c.id === report.channelId);
            const testRes = streamTestResult[report.id];

            return (
              <div 
                key={report.id}
                className={`p-4 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  report.status === 'pending'
                    ? 'bg-slate-900/90 border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : report.status === 'investigating'
                    ? 'bg-slate-900/90 border-cyan-500/40'
                    : 'bg-slate-900/50 border-slate-800 opacity-80'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700 shrink-0 text-slate-200 mt-1">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-cyan-400 px-2 py-0.5 rounded-lg bg-cyan-950 border border-cyan-800/60">
                        CH {report.channelNumber}
                      </span>
                      <h4 className="text-sm font-black text-white truncate max-w-xs">
                        {report.channelName}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.color}`}>
                        {meta.label}
                      </span>
                      {report.activeServer && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          Server {report.activeServer}
                        </span>
                      )}
                    </div>

                    {report.description && (
                      <p className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        "{report.description}"
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> {report.timestamp || new Date(report.createdAt || Date.now()).toLocaleTimeString()}
                      </span>
                      {report.userDeviceInfo && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]" title={report.userDeviceInfo}>
                          <Smartphone className="w-3 h-3 text-slate-500" /> {report.userDeviceInfo}
                        </span>
                      )}
                      {testRes && (
                        <span className={`font-bold flex items-center gap-1 ${testRes.online ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {testRes.online ? `Live (${testRes.latency}ms)` : 'Stream Failed'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions & Status Changer */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {/* Test Stream Button */}
                  <button
                    onClick={() => handleTestStream(report)}
                    disabled={testingStreamId === report.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
                    title="Probe and test if stream URL is active"
                  >
                    <Activity className={`w-3.5 h-3.5 ${testingStreamId === report.id ? 'animate-spin' : ''}`} />
                    <span>{testingStreamId === report.id ? 'Testing...' : 'Test Stream'}</span>
                  </button>

                  {/* Status Dropdown/Pills */}
                  <select
                    value={report.status || 'pending'}
                    onChange={(e) => handleStatusChange(report.id, e.target.value as any)}
                    className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border outline-none cursor-pointer transition ${
                      report.status === 'pending'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : report.status === 'investigating'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : report.status === 'resolved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <option value="pending" className="bg-slate-900 text-rose-300">Pending</option>
                    <option value="investigating" className="bg-slate-900 text-cyan-300">Investigating</option>
                    <option value="resolved" className="bg-slate-900 text-emerald-300">Resolved</option>
                    <option value="dismissed" className="bg-slate-900 text-slate-400">Dismissed</option>
                  </select>

                  {/* Quick Delete */}
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition border border-transparent hover:border-rose-500/40"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
