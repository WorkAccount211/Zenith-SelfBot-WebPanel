import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { soundFX } from '../utils/sound';
import { toast as toastEmitter, ToastItem, ToastType } from '../utils/toastEmitter';

export type { ToastType, ToastItem };

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3800) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (type === 'success') soundFX.playSuccess();
    else if (type === 'error') soundFX.playError();
    else soundFX.playClick();

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    const unsubscribe = toastEmitter.subscribe((t) => {
      addToast(t.message, t.type, t.duration);
    });
    return unsubscribe;
  }, [addToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl transition-all animate-slide-in ${
              toast.type === 'success'
                ? 'bg-[#102419]/90 border-emerald-500/40 text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.2)]'
                : toast.type === 'error'
                ? 'bg-[#260f15]/90 border-rose-500/40 text-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.2)]'
                : toast.type === 'warning'
                ? 'bg-[#261f0f]/90 border-amber-500/40 text-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.2)]'
                : 'bg-[#18132e]/90 border-purple-500/40 text-purple-100 shadow-[0_10px_30px_rgba(168,85,247,0.2)]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-purple-400 shrink-0" />}
              <span className="text-xs font-medium leading-snug break-words">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
