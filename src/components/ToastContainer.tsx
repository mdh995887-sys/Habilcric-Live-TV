// Toast Notification Container Component
// File: src/components/ToastContainer.tsx

import React from 'react';
import { useToast, ToastItem } from '../utils/toast';
import { 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  X 
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div 
      id="app-toast-container" 
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const getStyle = () => {
    switch (toast.type) {
      case 'online':
        return {
          bg: 'bg-emerald-950/95 border-emerald-500/70 text-emerald-100 shadow-emerald-900/40',
          iconBg: 'bg-emerald-500 text-white',
          Icon: Wifi,
        };
      case 'offline':
        return {
          bg: 'bg-rose-950/95 border-rose-500/70 text-rose-100 shadow-rose-900/40',
          iconBg: 'bg-rose-600 text-white',
          Icon: WifiOff,
        };
      case 'success':
        return {
          bg: 'bg-emerald-950/95 border-emerald-500/70 text-emerald-100 shadow-emerald-900/40',
          iconBg: 'bg-emerald-500 text-white',
          Icon: CheckCircle2,
        };
      case 'error':
        return {
          bg: 'bg-rose-950/95 border-rose-500/70 text-rose-100 shadow-rose-900/40',
          iconBg: 'bg-rose-600 text-white',
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/95 border-amber-500/70 text-amber-100 shadow-amber-900/40',
          iconBg: 'bg-amber-500 text-slate-900',
          Icon: AlertTriangle,
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/95 border-sky-500/70 text-sky-100 shadow-sky-900/40',
          iconBg: 'bg-sky-500 text-white',
          Icon: Info,
        };
    }
  };

  const style = getStyle();
  const IconComponent = style.Icon;

  return (
    <div
      className={`pointer-events-auto rounded-xl p-3.5 shadow-2xl border backdrop-blur-md flex items-start gap-3 transition-all transform duration-300 animate-in slide-in-from-bottom-5 ${style.bg}`}
      role="alert"
    >
      <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${style.iconBg}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h5 className="text-xs font-bold text-white tracking-tight leading-snug">
            {toast.title}
          </h5>
        )}
        <p className="text-xs text-slate-200 mt-0.5 leading-relaxed break-words">
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="mt-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
