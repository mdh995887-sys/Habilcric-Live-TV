import React, { useState } from 'react';
import { 
  X, Copy, Check, Share2, MessageCircle, 
  Send, QrCode, Sparkles, ExternalLink, Globe
} from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  version?: string;
  language?: Language;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  appName = 'BD LIVE SPORTS TV',
  version = '4.2.0',
  language = 'bn',
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const t = translations[language];

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://bdlivesportstv.app';
  const shareTitle = `${appName} - 500+ Live Sports & Bangla TV Channels`;
  const shareText = `🔥 Watch live cricket, football, movies and 500+ HD TV channels on ${appName}! Direct link: ${currentUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl,
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank');
  };

  // Generate a clean inline SVG QR code mockup for quick visual representation
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}&bgcolor=0a0f1d&color=38bdf8`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#0c1424] text-slate-900 dark:text-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-cyan-500 to-blue-600" />

        {/* Modal Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {t.shareModalTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                v{version} • Pro Ultra HD Build
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

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-sm">
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
            {t.shareModalSubtitle}
          </p>

          {/* Copy Link Input Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.copyLink}
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-2xl">
              <input 
                type="text" 
                readOnly 
                value={currentUrl} 
                className="flex-1 bg-transparent px-3 text-xs font-mono text-slate-700 dark:text-slate-200 outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
                  copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> {t.copiedToClipboard}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Grid */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Direct Sharing
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={handleTelegramShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-bold text-xs transition cursor-pointer"
              >
                <Send className="w-4 h-4 text-sky-500" />
                <span>Telegram</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleFacebookShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold text-xs transition cursor-pointer"
              >
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Facebook</span>
              </button>

              {/* Native Web Share */}
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold text-xs transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-purple-500" />
                <span>More Options</span>
              </button>
            </div>
          </div>

          {/* QR Code Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-500" />
                <span>Smart TV / Mobile QR Code Scan</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono">
                {showQr ? 'Hide QR' : 'Show QR'}
              </span>
            </button>

            {showQr && (
              <div className="mt-3 p-4 bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-slate-800 animate-fadeIn">
                <img 
                  src={qrSvgUrl} 
                  alt="App QR Code" 
                  className="w-36 h-36 rounded-lg bg-slate-950 p-2 border border-cyan-500/30 shadow-inner"
                />
                <p className="mt-2 text-[11px] text-slate-400 text-center">
                  Scan with your phone camera or Android TV to open immediately
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#070d18] border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            BD Live Sports TV • Ultra HD Cricket & Sports Streaming
          </p>
        </div>
      </div>
    </div>
  );
};
