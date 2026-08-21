import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Bot } from 'lucide-react';
import { soundFX } from '../utils/sound';

interface LoginModalProps {
  onLogin: (password: string) => Promise<boolean>;
  isOpen: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, isOpen }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError('');

    const success = await onLogin(password.trim());
    setIsLoading(false);

    if (success) {
      soundFX.playSuccess();
    } else {
      soundFX.playError();
      setError('Неверный ключ доступа. Проверьте правильность введенного значения.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const fillDefaultPassword = () => {
    setPassword('GGEZ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      {/* Background ambient lighting */}
      <div className="absolute w-96 h-96 rounded-full bg-purple-600/20 blur-[100px] pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none -bottom-20 -right-20" />

      <div
        className={`w-full max-w-md bg-[#120f24]/90 border border-purple-500/30 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(139,92,246,0.2)] backdrop-blur-2xl relative z-10 transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-purple-700 to-violet-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-purple-400/30">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Discord Self-Bot Panel</h2>
          <p className="text-sm text-purple-200/60 mt-1">
            Введите пароль доступа для авторизации в REST API
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-purple-200/70 uppercase tracking-wider">
              Ключ доступа
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите ключ доступа"
                required
                autoFocus
                className="w-full bg-[#0a0814]/80 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/30 text-sm outline-none transition-all pr-12 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1.5 text-purple-300/50 hover:text-purple-200 transition-colors"
                title={showPassword ? 'Скрыть ключ' : 'Показать ключ'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1.5 animate-fade-in">
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-purple-300/60 bg-purple-950/30 border border-purple-500/10 rounded-lg p-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Использовать ключ по умолчанию:</span>
            </div>
            <button
              type="button"
              onClick={fillDefaultPassword}
              className="font-mono text-purple-300 hover:text-purple-100 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30 transition-colors"
            >
              Использовать
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-500 hover:to-violet-500 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(147,51,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Войти в систему</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
