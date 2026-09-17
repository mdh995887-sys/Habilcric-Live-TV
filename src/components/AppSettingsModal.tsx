import React, { useState } from 'react';
import { AppSettings, UserSettings } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  X, ChevronRight, ExternalLink, Globe, Sparkles,
  Share2, DownloadCloud, Check, Sun, Moon, Laptop, Compass, Shield
} from 'lucide-react';
import { requestUserLocationCoordinates, getSolarTimes, getCachedUserCoordinates } from '../utils/solarTheme';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appSettings: AppSettings;
  userSettings: UserSettings;
  onUpdateUserSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenShareModal?: () => void;
  onOpenUpdateModal?: () => void;
  onOpenAdmin?: () => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  appSettings,
  userSettings,
  onUpdateUserSettings,
  onOpenShareModal,
  onOpenUpdateModal,
  onOpenAdmin,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [otherAppsOpen, setOtherAppsOpen] = useState(false);

  if (!isOpen) return null;

  

  const handleShareLink = () => {
    if (onOpenShareModal) {
      onOpenShareModal();
    } else {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckVersion = () => {
    if (onOpenUpdateModal) {
      onOpenUpdateModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white text-slate-800 dark:bg-[#0c1424] dark:text-slate-100 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-cyan-500 to-blue-600" />

        {/* Modal Header */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#0c1424]/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">
              {t.settingsTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold border border-cyan-500/30">
              v{appSettings.version || '4.2.0'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Switcher Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {language === 'bn' ? 'অ্যাপের ভাষা (App Language)' : 'App Language'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                language === 'bn'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇧🇩</span>
              <span>বাংলা</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                language === 'en'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Settings List (Exactly as in Screenshot 1) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
          {/* Section 1: Core App Toggles */}
          <div className="space-y-3.5 pt-1">
            {/* Night Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-amber-500">🌙</span>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{t.nightMode}</span>
                  {userSettings.autoTheme && (
                    <span className="text-[11px] text-cyan-600 dark:text-cyan-400">
                      {userSettings.autoThemeMode === 'solar' ? 'Auto-managed by Sun times' : 'Auto-managed by Device OS'}
                    </span>
                  )}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.nightMode}
                  onChange={(e) => {
                    onUpdateUserSettings({ 
                      nightMode: e.target.checked,
                      // If user manually changes night mode, disable autoTheme to respect their explicit choice
                      autoTheme: false 
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Auto-Theme Toggle */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-cyan-500">🌓</span>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t.autoTheme}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {t.autoThemeDesc}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={!!userSettings.autoTheme}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      onUpdateUserSettings({ 
                        autoTheme: enabled,
                        autoThemeMode: userSettings.autoThemeMode || 'system'
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              {/* Sub-options when Auto-Theme is enabled */}
              {userSettings.autoTheme && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateUserSettings({ autoThemeMode: 'system' })}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                        userSettings.autoThemeMode !== 'solar'
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>{t.autoThemeSystem}</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        onUpdateUserSettings({ autoThemeMode: 'solar' });
                        await requestUserLocationCoordinates();
                      }}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                        userSettings.autoThemeMode === 'solar'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>{t.autoThemeSolar}</span>
                    </button>
                  </div>

                  <div className="text-[11px] px-2 py-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      {userSettings.autoThemeMode === 'solar'
                        ? 'Solar Mode: Automatically shifts to Light at sunrise and Dark at sunset'
                        : 'System Mode: Follows your device dark/light theme setting'}
                    </span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 ml-2 shrink-0">
                      {userSettings.nightMode ? '🌙 Dark' : '☀️ Light'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Data Saving Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-amber-500">📶</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.dataSaving}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.dataSaving}
                  onChange={(e) => onUpdateUserSettings({ dataSaving: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Only Active Channels */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-emerald-500">✅</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.onlyActive}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.onlyActive}
                  onChange={(e) => onUpdateUserSettings({ onlyActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Show Channel Status Dots */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">🟢</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.showStatusDots}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.showStatusDots}
                  onChange={(e) => onUpdateUserSettings({ showStatusDots: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Auto-Reconnect on Error */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-blue-400">🔄</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.autoReconnect}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.autoReconnect}
                  onChange={(e) => onUpdateUserSettings({ autoReconnect: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Auto-play on Startup */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-amber-500">▶️</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.autoPlay}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.autoPlay}
                  onChange={(e) => onUpdateUserSettings({ autoPlay: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Auto Fullscreen on Channel Tap */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-blue-400">📱</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.autoFullscreen}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.autoFullscreen}
                  onChange={(e) => onUpdateUserSettings({ autoFullscreen: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* HEVC / H.265 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">🎬</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.hevc}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.hevcEnabled}
                  onChange={(e) => onUpdateUserSettings({ hevcEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* HW Acceleration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-amber-400">⚡</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.hwAcceleration}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.hwAcceleration}
                  onChange={(e) => onUpdateUserSettings({ hwAcceleration: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Retry Delay: 1s */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <span className="text-amber-500">⏳</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.retryDelay}</span>
              </div>
              <select 
                value={userSettings.retryDelay}
                onChange={(e) => onUpdateUserSettings({ retryDelay: Number(e.target.value) })}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value={1}>1s</option>
                <option value={2}>2s</option>
                <option value={3}>3s</option>
                <option value={5}>5s</option>
              </select>
            </div>
          </div>

          {/* Section 2: Links & Utilities (Matching Screenshot 1 exactly) */}
          <div className="space-y-3.5 pt-3">
            {/* Our others apps */}
            <button 
              onClick={() => setOtherAppsOpen(true)}
              className="w-full flex items-center justify-between text-left py-1 group hover:text-cyan-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-amber-400">⭐</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-400">
                  {t.ourOtherApps}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* About app */}
            <button 
              onClick={() => setAboutOpen(true)}
              className="w-full flex items-center justify-between text-left py-1 group hover:text-cyan-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400">ℹ️</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-400">
                  {t.aboutApp}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Contact Developer */}
            <a 
              href={`mailto:${appSettings.contactEmail || 'mohammadhabilmia@gmail.com'}?subject=BD%20Live%20Sports%20TV%20Feedback`}
              className="w-full flex items-center justify-between text-left py-1 group hover:text-cyan-500 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400">✉️</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-400">
                  {t.contactDeveloper}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>

            {/* Join Telegram Group */}
            <a 
              href={appSettings.telegramLink || 'https://t.me/bdlivesportstv'}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between text-left py-1 group hover:text-cyan-500 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-red-500">📢</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-400">
                  {t.joinTelegram}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>

            {/* Check Latest Version (Triggers Update Modal) */}
            <button 
              onClick={handleCheckVersion}
              className="w-full flex items-center justify-between text-left py-1 group hover:text-cyan-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-500">⬇️</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-400">
                  {t.checkLatestVersion}
                </span>
              </div>
              <span className="text-xs text-emerald-500 font-mono font-bold flex items-center gap-1">
                v{appSettings.version || '4.2.0'}
              </span>
            </button>

            {/* Share & Copy App Link (Triggers Share Modal) */}
            <button 
              onClick={handleShareLink}
              className="w-full flex items-center justify-between text-left py-1 group hover:text-cyan-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-red-400">📤</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-400">
                  {t.shareCopyAppLink}
                </span>
              </div>
              {copied ? (
                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Copied!
                </span>
              ) : (
                <Share2 className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Show EPG (TV Guide) */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">📺</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{t.showEpg}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={userSettings.showEpg}
                  onChange={(e) => onUpdateUserSettings({ showEpg: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Admin Control Panel Access (Secure) */}
            {onOpenAdmin && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  id="btn-settings-open-admin"
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 transition cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'এডমিন কন্ট্রোল প্যানেল' : 'Admin Control Panel'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#070d18] border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 font-mono">
            {appSettings.appName || 'BD LIVE SPORTS TV'} • Build 2026.09 PRO
          </p>
        </div>
      </div>

      {/* About App Submodal */}
      {aboutOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1424] text-slate-900 dark:text-white max-w-sm w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-black flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">ℹ️</span>
              <span>About {appSettings.appName || 'BD LIVE SPORTS TV'}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              BD LIVE SPORTS TV is an advanced high-speed sports streaming application engineered with zero-buffering multi-CDN architecture, Smart TV mode, and real-time live match alerts.
            </p>
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-1 text-xs font-mono text-slate-500 dark:text-slate-400">
              <div>Version: v{appSettings.version || '4.2.0'} Stable</div>
              <div>Build Date: September 2026</div>
              <div>Channels: 500+ Live HD Streams</div>
              <div>Engine: HLS + DASH + HEVC / H.265</div>
            </div>
            <button
              onClick={() => setAboutOpen(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Other Apps Submodal */}
      {otherAppsOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1424] text-slate-900 dark:text-white max-w-sm w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-black flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">⭐</span>
              <span>Our Other Streaming Apps</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">Cricket Live HD Pro</div>
                  <div className="text-[11px] text-slate-500">Ball-by-ball 4K live cricket feed</div>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-500 font-bold text-[10px]">Free</span>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">Bangla OTT & Cinema</div>
                  <div className="text-[11px] text-slate-500">Natok, cinema & Bangla news live</div>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-500 font-bold text-[10px]">Free</span>
              </div>
            </div>
            <button
              onClick={() => setOtherAppsOpen(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
