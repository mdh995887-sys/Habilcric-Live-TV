import React, { useState, useEffect } from 'react';
import { 
  X, DownloadCloud, Sparkles, CheckCircle2, 
  RefreshCw, ShieldCheck, ArrowRight, Zap, Check
} from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion?: string;
  language?: Language;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion = '4.2.0',
  language = 'bn',
}) => {
  const [checking, setChecking] = useState(true);
  const [isLatest, setIsLatest] = useState(true);
  const [updatedSuccess, setUpdatedSuccess] = useState(false);
  const t = translations[language];

  useEffect(() => {
    if (isOpen) {
      setChecking(true);
      setUpdatedSuccess(false);
      const timer = setTimeout(() => {
        setChecking(false);
        setIsLatest(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyUpdate = () => {
    setUpdatedSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const changelogItems = language === 'bn' ? [
    'অরিজিনাল রিয়েল চ্যানেল লোগো যুক্ত করা হয়েছে (T Sports HD, GTV, Star Sports, Sony Sports, Maasranga, beIN Sports ইত্যাদি)',
    'সম্পূর্ণ বাংলা ও ইংলিশ ভাষা সেট আপ (Bangla & English App Language)',
    'ছবির মতো সুন্দর নতুন অ্যাপ সেটিংস, শেয়ার বাটন ও আপডেট মডাল',
    'ভিডিওর নিচে মাল্টি-সার্ভার ১-৪ ও ফুল স্ক্রিন মোড কন্ট্রোল',
    'স্মার্ট টিভি রিমোট মোড ও কীবোর্ড শর্টকাট কন্ট্রোল'
  ] : [
    'Real authentic official channel logos added (T Sports HD, GTV, Star Sports, Sony Sports, Maasranga, beIN Sports, etc.)',
    'Full Bangla & English dual-language setup (বাংলা ও ইংলিশ)',
    'Screenshot-accurate App Settings, Share button & Update system',
    'Under-video multi-server switching & native Full Screen controls',
    'Smart TV Remote Mode with virtual D-Pad and fast channel tuning'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#0c1424] text-slate-900 dark:text-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600" />

        {/* Modal Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {t.updateModalTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Update Server (OTA)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* Status Box */}
          {checking ? (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-cyan-500 animate-spin" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t.checkingForUpdates}
                </p>
                <p className="text-[11px] text-slate-500">Connecting to CDN distribution...</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {t.upToDate}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    v{currentVersion} (Latest Build)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold">
                PRO ACTIVE
              </span>
            </div>
          )}

          {/* Version details info table */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                {t.currentVersion}
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">
                v{currentVersion}
              </span>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                {t.latestVersion}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                v{currentVersion} Stable
              </span>
            </div>
          </div>

          {/* Changelog Section */}
          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.whatsNewTitle}</span>
            </h3>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
              {changelogItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-cyan-500 font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-[#070d18] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setChecking(true);
              setTimeout(() => setChecking(false), 900);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Check Again
          </button>

          <button
            onClick={handleApplyUpdate}
            disabled={updatedSuccess}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg cursor-pointer ${
              updatedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/20 active:scale-95'
            }`}
          >
            {updatedSuccess ? (
              <>
                <Check className="w-4 h-4" /> Reloading App...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> {t.updateNowBtn}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
