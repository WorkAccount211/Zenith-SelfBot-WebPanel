import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ShieldCheck, Cpu, HardDrive, Network, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BootSplashScreenProps {
  onComplete: () => void;
  userName?: string;
}

interface BootStep {
  id: string;
  name: string;
  detail: string;
  icon: any;
  status: 'pending' | 'running' | 'done';
}

export const BootSplashScreen: React.FC<BootSplashScreenProps> = ({ onComplete, userName }) => {
  const [steps, setSteps] = useState<BootStep[]>([
    { id: '1', name: 'Проверка доступности Roblox API', detail: 'HTTPS 200 OK • CSRF Token Ready', icon: Network, status: 'running' },
    { id: '2', name: 'Инициализация базы данных SQLite (server.db)', detail: 'Синхронизировано 6 профилей и таблица сессий', icon: HardDrive, status: 'pending' },
    { id: '3', name: 'Активация Zenith Bypass V1.4.5', detail: 'Перехват ROBLOX_singletonEvent активен', icon: Cpu, status: 'pending' },
    { id: '4', name: 'Калибровка аппаратного спуфера (MAC/HWID)', detail: 'Драйвер Netsh & Virtual HWID загружен', icon: ShieldCheck, status: 'pending' },
  ]);
  const [progress, setProgress] = useState(25);
  const [isFinished, setIsFinished] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    let t3: NodeJS.Timeout;
    let tDone: NodeJS.Timeout;

    // Step 2: SQLite database (300ms)
    t1 = setTimeout(() => {
      setSteps(prev => [
        { ...prev[0], status: 'done' },
        { ...prev[1], status: 'running' },
        prev[2],
        prev[3]
      ]);
      setProgress(50);
    }, 280);

    // Step 3: Zenith Bypass Mutex (580ms)
    t2 = setTimeout(() => {
      setSteps(prev => [
        { ...prev[0], status: 'done' },
        { ...prev[1], status: 'done' },
        { ...prev[2], status: 'running' },
        prev[3]
      ]);
      setProgress(75);
    }, 580);

    // Step 4: Spoofer calibration (880ms)
    t3 = setTimeout(() => {
      setSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
      setProgress(100);
      setIsFinished(true);
      try {
        confetti({
          particleCount: 35,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#6366f1', '#10b981']
        });
      } catch {
        // ignore
      }
    }, 880);

    // Auto complete (1250ms)
    tDone = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 1300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tDone);
    };
  }, []);

  const handleSkip = () => {
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#18181B] p-7 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          title="Пропустить инициализацию"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-3.5">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">ZenithRAM v3.4.0</h1>
          <p className="text-xs text-gray-400 mt-1">Инициализация модулей ядра и локального сервера</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
            <span>Проверка окружения Windows</span>
            <span className="font-bold text-indigo-400">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#09090B] rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-600 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-2.5 mb-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                  step.status === 'done'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : step.status === 'running'
                    ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                    : 'bg-white/5 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${step.status === 'done' ? 'text-emerald-400' : 'text-indigo-400'}`} />
                  <div className="min-w-0">
                    <div className="text-gray-200 text-xs sm:text-sm font-medium truncate">{step.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono truncate">{step.detail}</div>
                  </div>
                </div>
                {step.status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : step.status === 'running' ? (
                  <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Greeting Banner */}
        <AnimatePresence>
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center"
            >
              <div className="flex items-center justify-center space-x-2 text-emerald-300 font-semibold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>С возвращением, {userName || 'Командир'}!</span>
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">Все системы активны. Мульти-клиент готов к запуску.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
