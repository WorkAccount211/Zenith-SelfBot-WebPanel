import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, KeyRound, AlertTriangle } from 'lucide-react';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onUnlock: (password: string) => boolean;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({ isOpen, onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onUnlock(password);
    if (!success) {
      setError(true);
      setPassword('');
    } else {
      setError(false);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#18181B] p-6 shadow-2xl text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-indigo-400" />
        </div>

        <h3 className="text-lg font-bold text-white">ZenithRAM Заблокирован</h3>
        <p className="text-xs text-gray-400 mt-1 mb-5">
          Введите мастер-пароль для получения доступа к аккаунтам и управлению сессиями
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Мастер-пароль"
              autoFocus
              className={`w-full rounded-lg bg-[#09090B] border pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none ${
                error ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/10 focus:border-indigo-500'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Неверный пароль. Попробуйте снова.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            Разблокировать приложение
          </button>
        </form>
      </motion.div>
    </div>
  );
};
