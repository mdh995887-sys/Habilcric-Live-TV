import React, { useState } from 'react';
import { adminLogin } from '../../utils/api';
import { Shield, Lock, User, KeyRound, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Please enter the admin password');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const res = await adminLogin(username, password);
    setIsLoading(false);

    if (res.authenticated) {
      onLoginSuccess();
      onClose();
    } else {
      setErrorMessage(res.error || res.message || 'Invalid username or password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        id="admin-login-modal"
        className="bg-[#0b1222] border border-cyan-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-cyan-950/40"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-[#0d162b] to-slate-900 border-b border-slate-800 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Admin Control Panel</h2>
          <p className="text-xs text-slate-400 mt-1">Authenticate to manage channels, stream URLs, logo & database</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Admin Credentials Quick Access Box */}
          <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                অ্যাডমিন লগইন তথ্য (Admin Credentials)
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
                DEFAULT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#070b14] p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Username / ইউজার:</span>
                <strong className="text-white">admin</strong>
              </div>
              <div className="bg-[#070b14] p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Password / পাসওয়ার্ড:</span>
                <strong className="text-cyan-400">admin123</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                }}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                ⚡ Auto-Fill (অটো পূরণ)
              </button>
              <button
                type="button"
                onClick={async () => {
                  setUsername('admin');
                  setPassword('admin123');
                  setIsLoading(true);
                  setErrorMessage('');
                  const res = await adminLogin('admin', 'admin123');
                  setIsLoading(false);
                  if (res.authenticated) {
                    onLoginSuccess();
                    onClose();
                  } else {
                    setErrorMessage(res.error || 'Invalid credentials');
                  }
                }}
                className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
              >
                🚀 1-Click Login (সরাসরি প্রবেশ)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                id="admin-username-input"
                className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="admin-password-input"
                className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                placeholder="••••••••"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Default credentials: <code className="text-cyan-400">admin</code> / <code className="text-cyan-400">admin123</code> (or <code className="text-slate-400">habil123</code>)</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            id="admin-submit-btn"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In to Admin Panel</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
