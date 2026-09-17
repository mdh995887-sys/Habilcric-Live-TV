import React, { useState, useRef, useEffect } from 'react';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { AppSettings } from '../../types';
import { apiUpdateAppSettings } from '../../utils/api';
import { applyDynamicAppBranding } from '../../utils/pwaHelper';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  Upload, Image as ImageIcon, Link2, Check, RefreshCw, 
  Smartphone, Monitor, Tv, Eye, Sparkles, AlertCircle,
  CheckCircle2, ArrowRight, ShieldCheck, Download
} from 'lucide-react';

interface AppLogoManagerProps {
  appSettings: AppSettings;
  onSettingsUpdated?: (updated: AppSettings) => void;
  showToast?: (msg: string) => void;
}

// Curated high quality vector / web-ready sports platform logos for instant selection
const LOGO_PRESETS = [
  {
    id: 'default',
    name: 'BD LIVE SPORTS TV (Default SVG)',
    category: 'Official Vector',
    url: '/icon.svg',
    description: 'Crisp SVG vector with high-contrast stadium gradient'
  },
  {
    id: 'bd-sports-gold',
    name: 'BD SPORTS HD (Gold & Cyan)',
    category: 'Premium Broadcast',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=256&auto=format&fit=crop&q=80',
    description: 'Modern sports stadium crest with gold accent'
  },
  {
    id: 'bangla-tv-red',
    name: 'BANGLA LIVE TV (Red & Green)',
    category: 'National Edition',
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=256&auto=format&fit=crop&q=80',
    description: 'Dynamic sports football & cricket broadcast emblem'
  },
  {
    id: 't-sports-hd',
    name: 'T SPORTS HD Live',
    category: 'Sports Network',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=256&auto=format&fit=crop&q=80',
    description: 'Bold sports network emblem with high visibility'
  },
  {
    id: 'sky-sports-style',
    name: 'SKY SPORTS PRO (Ultra Blue)',
    category: 'International',
    url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=256&auto=format&fit=crop&q=80',
    description: 'Clean stadium floodlight visual for international tournaments'
  },
  {
    id: 'ptv-sports-style',
    name: 'CRICKET LIVE 24/7',
    category: 'Cricket Special',
    url: 'https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?w=256&auto=format&fit=crop&q=80',
    description: 'High contrast leather ball and stadium light aesthetic'
  }
];

export const AppLogoManager: React.FC<AppLogoManagerProps> = ({
  appSettings,
  onSettingsUpdated,
  showToast = (msg) => console.log(msg),
}) => {
  const { language } = useTranslation();
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url' | 'presets'>('upload');
  
  // Current active logo in form/preview
  const [currentLogo, setCurrentLogo] = useState<string>(appSettings.appLogo || '/icon.svg');
  const [urlInput, setUrlInput] = useState<string>(appSettings.appLogo || '/icon.svg');
  const [appNameInput, setAppNameInput] = useState<string>(appSettings.appName || 'BD LIVE SPORTS TV');
  const [taglineInput, setTaglineInput] = useState<string>(appSettings.tagline || 'High performance Live Sports & TV streaming platform');

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessUrl, setUploadSuccessUrl] = useState<string | null>(null);

  // Validation state
  const [isValidatingUrl, setIsValidatingUrl] = useState<boolean>(false);
  const [urlValidationStatus, setUrlValidationStatus] = useState<'valid' | 'invalid' | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; isSquare: boolean } | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // File drag & drop
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When props change, update local state
  useEffect(() => {
    if (appSettings.appLogo) {
      setCurrentLogo(appSettings.appLogo);
      setUrlInput(appSettings.appLogo);
    }
    if (appSettings.appName) {
      setAppNameInput(appSettings.appName);
    }
    if (appSettings.tagline) {
      setTaglineInput(appSettings.tagline);
    }
  }, [appSettings]);

  // Inspect image dimensions whenever currentLogo changes
  useEffect(() => {
    if (!currentLogo) return;
    const img = new Image();
    img.src = currentLogo;
    img.onload = () => {
      setImageMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        isSquare: Math.abs(img.naturalWidth - img.naturalHeight) < 10
      });
      setUrlValidationStatus('valid');
    };
    img.onerror = () => {
      setImageMeta(null);
      setUrlValidationStatus('invalid');
    };
  }, [currentLogo]);

  // Validate URL
  const handleValidateUrl = () => {
    if (!urlInput.trim()) return;
    setIsValidatingUrl(true);
    const img = new Image();
    img.src = urlInput.trim();
    img.onload = () => {
      setIsValidatingUrl(false);
      setUrlValidationStatus('valid');
      setCurrentLogo(urlInput.trim());
      showToast(language === 'bn' ? '✓ লোগো লিঙ্কটি সঠিক ও কার্যকর!' : '✓ Logo URL successfully verified!');
    };
    img.onerror = () => {
      setIsValidatingUrl(false);
      setUrlValidationStatus('invalid');
      showToast(language === 'bn' ? '⚠️ লোগো ইমেজটি লোড করা যাচ্ছে না, সঠিক URL দিন' : '⚠️ Unable to load image from URL');
    };
  };

  // Upload file to Firebase Storage with Fallback
  const handleUploadFile = async (file: File) => {
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(language === 'bn' ? 'ফাইলের আকার ১০ মেগাবাইটের বেশি হতে পারবে না' : 'File size must be under 10MB');
      return;
    }

    // Check mime type
    if (!file.type.startsWith('image/')) {
      setUploadError(language === 'bn' ? 'শুধুমাত্র ছবি ফাইল (PNG, JPG, SVG, WebP) আপলোড করুন' : 'Please upload an image file (PNG, JPG, SVG, WebP)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    const fileExt = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const storagePath = `app-branding/app-logo-${timestamp}.${fileExt}`;

    try {
      // 1. Try Firebase Storage upload
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000'
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(Math.max(15, progress));
        },
        async (error) => {
          console.warn('[Firebase Storage] Upload failed, activating resilient local fallback:', error.message);
          // Graceful fallback to client-side data URL
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            setCurrentLogo(dataUrl);
            setUploadSuccessUrl(dataUrl);
            setIsUploading(false);
            setUploadProgress(100);
            showToast(language === 'bn' ? '✓ লোগো সফলভাবে লোড হয়েছে (লোকাল মোড)' : '✓ Logo loaded successfully (Local/Fallback mode)');
          };
          reader.readAsDataURL(file);
        },
        async () => {
          // Successfully uploaded to Firebase Storage!
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadProgress(100);
          setIsUploading(false);
          setCurrentLogo(downloadUrl);
          setUploadSuccessUrl(downloadUrl);
          setUrlInput(downloadUrl);
          showToast(language === 'bn' ? '✓ ফায়ারবেজ স্টোরেজে লোগো আপলোড সম্পন্ন হয়েছে!' : '✓ Logo uploaded to Firebase Storage successfully!');
        }
      );
    } catch (err: any) {
      console.warn('[Firebase Storage] Direct initialization error, using Base64:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCurrentLogo(dataUrl);
        setUploadSuccessUrl(dataUrl);
        setIsUploading(false);
        setUploadProgress(100);
        showToast(language === 'bn' ? '✓ লোগো লোড হয়েছে (Base64)' : '✓ Logo processed via Base64');
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Save Settings Globally & Broadcast to Header, Footer, and PWA Manifest
  const handleSaveAndApplyGlobally = async () => {
    if (!currentLogo) {
      showToast(language === 'bn' ? '⚠️ অনুগ্রহ করে একটি লোগো নির্বাচন করুন' : '⚠️ Please select or upload a logo first');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    const updatedSettings: AppSettings = {
      ...appSettings,
      appName: appNameInput.trim() || appSettings.appName,
      appLogo: currentLogo,
      tagline: taglineInput.trim() || appSettings.tagline,
      lastUpdated: new Date().toISOString()
    };

    try {
      const res = await apiUpdateAppSettings(updatedSettings);

      // Also persist to Firestore collection 'appSettings'
      try {
        await setDoc(doc(db, 'appSettings', 'general'), {
          appName: updatedSettings.appName,
          appLogo: updatedSettings.appLogo,
          tagline: updatedSettings.tagline,
          lastUpdated: updatedSettings.lastUpdated
        }, { merge: true });
      } catch (firestoreError) {
        console.warn('Firestore optional sync notice:', firestoreError);
      }

      if (res.success || res.appSettings) {
        // 1. Dynamically apply branding to Document title, favicon, apple-touch-icon, and PWA manifest
        applyDynamicAppBranding(updatedSettings);

        if (onSettingsUpdated) {
          onSettingsUpdated(updatedSettings);
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);

        showToast(
          language === 'bn' 
            ? '🚀 অ্যাপ লোগো ও ব্র্যান্ডিং সফলভাবে হেডার, ফুটার ও PWA ম্যানিফেস্টে যুক্ত হয়েছে!' 
            : '🚀 App Logo dynamically applied across Header, Footer & PWA manifest!'
        );
      } else {
        showToast(`⚠️ Failed to save: ${res.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error('Error saving app branding:', e);
      showToast(`⚠️ Error: ${e.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="app-logo-manager-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d172e] via-[#091020] to-[#0d172e] border border-cyan-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] uppercase tracking-wider border border-cyan-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Firebase Storage & PWA Dynamic Sync
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <span>{language === 'bn' ? 'অ্যাপ লোগো ও ব্র্যান্ডিং ম্যানেজার' : 'App Logo & Platform Branding Manager'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {language === 'bn' 
                ? 'ফায়ারবেজ স্টোরেজে লোগো আপলোড করুন বা সরাসরি লিঙ্ক দিন। এটি স্বয়ংক্রিয়ভাবে হেডার, ফুটার, ফুলস্ক্রিন প্লেয়ার এবং PWA ম্যানিফেস্টে কার্যকর হবে।' 
                : 'Upload or link high-resolution logos via Firebase Storage. Changes propagate dynamically across Header, Footer, Fullscreen Video Player, and PWA manifest.'}
            </p>
          </div>

          <button
            onClick={handleSaveAndApplyGlobally}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Applying Globally...'}</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                <span>{language === 'bn' ? 'সফলভাবে যুক্ত হয়েছে!' : 'Applied Successfully!'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{language === 'bn' ? 'লোগো সেভ ও অ্যাপ্লাই করুন' : 'Save & Apply Globally'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls & Right Live Multi-Surface Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload / URL / Presets Input Tabs */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Platform Identity Metadata (Name & Tagline) */}
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl p-4.5 space-y-4 shadow-lg">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{language === 'bn' ? 'প্ল্যাটফর্মের নাম ও বিবরণ' : 'Platform Identity & Titles'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {language === 'bn' ? 'অ্যাপের নাম (Application Name)' : 'Application Name'} *
                </label>
                <input
                  type="text"
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  placeholder="BD LIVE SPORTS TV"
                  className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 px-3.5 py-2 rounded-xl text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {language === 'bn' ? 'স্লোগান / ট্যাগলাইন' : 'Header Tagline'}
                </label>
                <input
                  type="text"
                  value={taglineInput}
                  onChange={(e) => setTaglineInput(e.target.value)}
                  placeholder="Live Sports Streaming in Ultra HD"
                  className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 px-3.5 py-2 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Logo Source Selection Tab Bar */}
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl p-4.5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>{language === 'bn' ? 'লোগো নির্বাচন ও আপলোড মাধ্যম' : 'Logo Source Selection'}</span>
              </h3>

              <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLogoInputType('upload')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    logoInputType === 'upload' 
                      ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogoInputType('url')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    logoInputType === 'url' 
                      ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Image URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogoInputType('presets')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    logoInputType === 'presets' 
                      ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preset Badges</span>
                </button>
              </div>
            </div>

            {/* TAB 1: UPLOAD TO FIREBASE STORAGE */}
            {logoInputType === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]' 
                      : 'border-slate-700/80 hover:border-cyan-500/60 bg-[#070b14]/70 hover:bg-[#070b14]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                    <Upload className="w-7 h-7" />
                  </div>

                  <p className="text-sm font-bold text-white mb-1">
                    {language === 'bn' ? 'ফাইল ড্রপ করুন অথবা ক্লিক করে পছন্দ করুন' : 'Click to upload or drag & drop logo'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    {language === 'bn' 
                      ? 'SVG, PNG, WebP অথবা JPG (প্রস্তাবিত আকার: ৫১২x৫১২ পিক্সেল, সর্বোচ্চ ১০MB)' 
                      : 'PNG, SVG, WebP or JPG (Recommended: 512x512 square transparent PNG/SVG, max 10MB)'}
                  </p>
                </div>

                {/* Progress bar if uploading */}
                {isUploading && (
                  <div className="bg-[#070b14] border border-cyan-500/40 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Uploading to Firebase Storage...
                      </span>
                      <span className="font-mono text-white font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload Success URL indicator */}
                {uploadSuccessUrl && !isUploading && (
                  <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      Uploaded & ready to save!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(uploadSuccessUrl);
                        showToast('Link copied to clipboard');
                      }}
                      className="text-[10px] text-emerald-400 hover:underline font-mono"
                    >
                      Copy URL
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DIRECT IMAGE URL */}
            {logoInputType === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    {language === 'bn' ? 'সরাসরি ইমেজ লিঙ্ক (HTTPS URL)' : 'Direct Web Image URL (HTTPS)'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setUrlValidationStatus(null);
                      }}
                      placeholder="https://example.com/assets/logo.png"
                      className="flex-1 bg-[#070b14] border border-slate-700 focus:border-cyan-500 px-3.5 py-2.5 rounded-xl text-xs text-white font-mono placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={handleValidateUrl}
                      disabled={isValidatingUrl || !urlInput.trim()}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isValidatingUrl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>Verify URL</span>
                    </button>
                  </div>
                </div>

                {urlValidationStatus === 'valid' && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Image verified and loaded cleanly into active preview.</span>
                  </div>
                )}

                {urlValidationStatus === 'invalid' && (
                  <div className="text-[11px] text-rose-400 flex items-center gap-1.5 bg-rose-950/30 p-2 rounded-lg border border-rose-900/40">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Image failed to load. Check that the URL is public and CORS-enabled.</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PRESET BRAND BADGES */}
            {logoInputType === 'presets' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  {language === 'bn' ? 'দ্রুত ব্যবহারের জন্য যেকোনো প্রিসেট বেছে নিন:' : 'Click any preset below to test with one click:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {LOGO_PRESETS.map((preset) => {
                    const isSelected = currentLogo === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setCurrentLogo(preset.url);
                          setUrlInput(preset.url);
                          showToast(`Selected ${preset.name}`);
                        }}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                          isSelected 
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-md ring-1 ring-cyan-500/30' 
                            : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img 
                            src={preset.url} 
                            alt={preset.name} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{preset.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reset to Default Button */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Current active source: <span className="text-slate-200 font-mono truncate max-w-[200px] inline-block align-bottom">{currentLogo}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setCurrentLogo('/icon.svg');
                  setUrlInput('/icon.svg');
                  showToast('Reset to default /icon.svg');
                }}
                className="text-[11px] text-cyan-400 hover:underline font-bold"
              >
                Reset Default SVG
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Surface Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl p-4.5 space-y-4 shadow-lg sticky top-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>{language === 'bn' ? 'রিয়েল-টাইম প্রিভিউ' : 'Multi-Surface Live Preview'}</span>
              </h3>
              {imageMeta && (
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
                  {imageMeta.width}x{imageMeta.height} px
                </span>
              )}
            </div>

            {/* 1. Header Navigation Bar Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3 h-3 text-cyan-400" />
                1. Top Header Bar (Desktop & Mobile)
              </span>
              <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    <img 
                      src={currentLogo} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="text-sm font-black text-white flex items-center gap-1.5 truncate">
                      <span>{appNameInput || 'BD LIVE SPORTS'}</span>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    </div>
                    <span className="text-[9px] text-slate-400 truncate">{taglineInput}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700" />
                  <div className="w-6 h-6 rounded-lg bg-cyan-600/60 border border-cyan-500/40" />
                </div>
              </div>
            </div>

            {/* 2. PWA Mobile App Icon & Home Screen Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3 h-3 text-purple-400" />
                2. PWA Mobile Home Screen & Splash
              </span>
              <div className="bg-[#070b14] border border-slate-800 rounded-xl p-3.5 flex items-center gap-4">
                {/* iOS Squircle App Icon Mockup */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-13 h-13 rounded-2xl bg-[#090f1d] border-2 border-cyan-400/40 shadow-xl shadow-cyan-500/20 p-2 flex items-center justify-center relative overflow-hidden group">
                    <img 
                      src={currentLogo} 
                      alt="PWA Icon" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 font-mono">
                    {appNameInput.slice(0, 10)}
                  </span>
                </div>

                <div className="flex-1 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-200">Web App Manifest Icon</div>
                  <div>Applied to <code className="text-cyan-400 text-[10px]">/manifest.json</code> icons (192x192 & 512x512) and browser touch icon.</div>
                </div>
              </div>
            </div>

            {/* 3. Fullscreen Video Player Live Watermark Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-3 h-3 text-red-400" />
                3. Fullscreen Video Player Watermark
              </span>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
                {/* Simulated video background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-950 to-cyan-950/40 opacity-90" />
                <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-cyan-500/50" />
                  <span>1080p Full HD Stream Canvas</span>
                </div>

                {/* Top-Right Channel & App Logo Watermark */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 border border-white/20 p-0.5 flex items-center justify-center overflow-hidden">
                    <img 
                      src={currentLogo} 
                      alt="Watermark" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-red-500 leading-none">LIVE</span>
                    <span className="text-[9px] font-mono font-black text-cyan-300">CH 01</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Footer Bar Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                4. Footer Bar
              </span>
              <div className="bg-[#060a12] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-bold text-slate-300 text-[11px]">{appNameInput}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">© 2026</span>
              </div>
            </div>

            {/* Big Apply Button */}
            <button
              onClick={handleSaveAndApplyGlobally}
              disabled={isSaving}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving & Updating PWA...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply Changes Everywhere</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
