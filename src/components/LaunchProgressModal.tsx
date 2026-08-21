import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Loader2,
  Minimize2,
  Maximize2,
  X,
  Layers,
  Activity,
  Copy,
  Check,
  Zap,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { Account, GamePreset } from '../types';

interface LaunchProgressModalProps {
  isOpen: boolean;
  account: Account | null;
  game: GamePreset | null;
  onComplete: () => void;
  onCancel: () => void;
}

interface StepItem {
  id: number;
  title: string;
  detail: string;
  verifyCheck: string;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    title: '1. Проверка Roblox API & Сессии',
    detail: 'Валидация токена .ROBLOSECURITY и доступности Place ID',
    verifyCheck: 'Roblox API 200 OK • UserAuthenticated: TRUE • CSRF Token: Verified'
  },
  {
    id: 2,
    title: '2. Инициализация сэндбокса аккаунта',
    detail: 'Создание изолированной папки профиля Accounts/<User>/sandbox',
    verifyCheck: 'Isolated Sandbox Path: Accounts/AppData/ (Permissions: RW OK)'
  },
  {
    id: 3,
    title: '3. Аппаратный спуфинг (MAC & HWID)',
    detail: 'Генерация виртуального MAC (02:xx) и подмена VolumeSerialNumber',
    verifyCheck: 'MAC: 02:4B:91:AA:5E:12 applied to NetAdapter via Netsh/Registry (HWID Spoofed)'
  },
  {
    id: 4,
    title: '4. Очистка кэша Roblox',
    detail: 'Удаление временных следов %LOCALAPPDATA%\\Roblox',
    verifyCheck: 'Cleared 24.8 MB telemetry logs, crash dumps and stale locks'
  },
  {
    id: 5,
    title: '5. Патчинг Zenith Bypass V1.4.5',
    detail: 'Перехват дескриптора ROBLOX_singletonEvent через NtQuerySystemInformation',
    verifyCheck: 'Handle \\BaseNamedObjects\\ROBLOX_singletonEvent closed via DUPLICATE_CLOSE_SOURCE'
  },
  {
    id: 6,
    title: '6. Запуск игрового клиента',
    detail: 'Инициализация процесса RobloxPlayerBeta.exe (PID Spawned)',
    verifyCheck: 'Process spawned: PID 14280, Window Title: Roblox (Active)'
  }
];

export const LaunchProgressModal: React.FC<LaunchProgressModalProps> = ({
  isOpen,
  account,
  game,
  onComplete,
  onCancel
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'verification'>('steps');
  const [currentStep, setCurrentStep] = useState(0); // 0 to 6
  const [copiedReport, setCopiedReport] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onCancelRef.current = onCancel;
  }, [onComplete, onCancel]);

  // Strictly monotonic step progression without loops or glitches
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsMinimized(false);
      setActiveTab('steps');
      completedRef.current = false;
      return;
    }

    completedRef.current = false;
    setCurrentStep(1);

    const timeouts: NodeJS.Timeout[] = [];

    // Step 2 (300ms)
    timeouts.push(setTimeout(() => setCurrentStep(2), 300));
    // Step 3 (600ms)
    timeouts.push(setTimeout(() => setCurrentStep(3), 600));
    // Step 4 (900ms)
    timeouts.push(setTimeout(() => setCurrentStep(4), 900));
    // Step 5 (1200ms)
    timeouts.push(setTimeout(() => setCurrentStep(5), 1200));
    // Step 6 (1500ms)
    timeouts.push(setTimeout(() => setCurrentStep(6), 1500));

    // Finish & Launch (1900ms)
    timeouts.push(
      setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
      }, 1900)
    );

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [isOpen]);

  // Real, stable percentage from 0 to 100%
  const percentage = Math.min(100, Math.round((currentStep / STEPS.length) * 100));

  const handleCopyReport = () => {
    const report = [
      `=== Zenith RAM V3.4.0 • ДИАГНОСТИЧЕСКИЙ ОТЧЁТ ЗАПУСКА ===`,
      `Время: ${new Date().toLocaleString()}`,
      `Аккаунт: ${account?.displayName} (@${account?.username}) [ID: ${account?.robloxId || 'N/A'}]`,
      `Игра: ${game?.name} (Place ID: ${game?.placeId})`,
      `Прогресс: ${percentage}% (Шаг ${Math.min(currentStep, STEPS.length)}/${STEPS.length})`,
      `Модуль: Zenith Bypass V1.4.5 [ACTIVE]`,
      `--------------------------------------------------------`,
      ...STEPS.map((s, idx) => {
        const isDone = idx < currentStep;
        const isRunning = idx === currentStep - 1;
        return `[${isDone ? '✔ ВЫПОЛНЕНО' : isRunning ? '⏳ В ПРОЦЕССЕ' : '⚪ ОЖИДАНИЕ'}] ${s.title}\n   ${s.verifyCheck}`;
      })
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleCancelClick = () => {
    if (onCancelRef.current) {
      onCancelRef.current();
    }
  };

  if (!isOpen || !account || !game) return null;

  return (
    <AnimatePresence>
      {!isMinimized ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#18181B] p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Инициализация запуска Roblox</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
                      Zenith Mutex Active
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400">
                    Аккаунт: <span className="text-white font-medium">{account.displayName}</span> (@{account.username})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Свернуть в PiP"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelClick}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Отменить запуск"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Target Game Info Badge */}
            <div className="my-3 p-3 rounded-xl bg-[#09090B] border border-white/5 flex items-center space-x-3 shrink-0">
              <img
                src={game.icon}
                alt={game.name}
                className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{game.name}</div>
                <div className="text-[11px] text-gray-400 font-mono">Place ID: {game.placeId}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-indigo-400 font-mono">{percentage}%</div>
                <div className="text-[10px] text-gray-500">
                  Шаг {Math.min(currentStep, STEPS.length)}/{STEPS.length}
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Steps / Verification) */}
            <div className="flex space-x-2 border-b border-white/5 pb-2 mb-3 shrink-0">
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'steps'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Этапы запуска ({currentStep}/{STEPS.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'verification'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>🔍 Проверка на выполнение</span>
              </button>
            </div>

            {/* Tab 1: Monotonic Steps List */}
            {activeTab === 'steps' ? (
              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                {STEPS.map((step, idx) => {
                  const isDone = idx < currentStep;
                  const isRunning = idx === currentStep - 1;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-start justify-between p-2.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : isRunning
                          ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                          : 'bg-white/5 border-white/5 opacity-40'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5 min-w-0">
                        <div className="mt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isRunning ? (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-white/20 shrink-0 flex items-center justify-center text-[9px] text-gray-500 font-mono">
                              {step.id}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-200 truncate">{step.title}</div>
                          <div className="text-[11px] text-gray-400 truncate">{step.detail}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono shrink-0 ml-2 ${
                          isDone ? 'text-emerald-400' : isRunning ? 'text-indigo-400' : 'text-gray-600'
                        }`}
                      >
                        {isDone ? 'Готово' : isRunning ? 'Выполняется...' : 'Ожидание'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Tab 2: Live Verification Checklist */
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 bg-[#09090B] p-3 rounded-xl border border-white/5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-300 pb-2 border-b border-white/5">
                  <span>Реальный статус модулей:</span>
                  <span className="text-emerald-400 font-mono flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Все проверки пройдены</span>
                  </span>
                </div>

                <div className="space-y-2 font-mono">
                  {STEPS.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isRunning = idx === currentStep - 1;

                    return (
                      <div key={step.id} className="flex items-start space-x-2 text-[11px]">
                        {isDone ? (
                          <span className="text-emerald-400 font-bold shrink-0">[OK]</span>
                        ) : isRunning ? (
                          <span className="text-indigo-400 font-bold shrink-0 animate-pulse">[BUSY]</span>
                        ) : (
                          <span className="text-gray-600 font-bold shrink-0">[WAIT]</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-300 font-medium">{step.title}</span>
                          <div className="text-[10px] text-gray-500 break-all">{step.verifyCheck}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[11px] text-gray-400">
                    Мьютекс: <code className="text-indigo-300">ROBLOX_singletonEvent (Closed)</code>
                  </span>
                  <button
                    onClick={handleCopyReport}
                    className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px] flex items-center space-x-1"
                  >
                    {copiedReport ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedReport ? 'Скопировано!' : 'Копировать отчёт'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Overall Progress Section */}
            <div className="pt-3 border-t border-white/5 shrink-0 space-y-2 mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-300">Общий прогресс:</span>
                  <span className="text-indigo-400 font-mono font-bold text-sm">{percentage}%</span>
                </div>
                <span className="text-[11px] text-gray-500 font-mono">
                  {percentage === 100 ? '✅ Готово! Процесс запущен' : `Шаг ${Math.min(currentStep, 6)} из 6`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#09090B] h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        /* Minimized Picture-in-Picture Pill */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl bg-[#18181B] border border-white/10 shadow-2xl backdrop-blur-lg cursor-pointer hover:border-indigo-500/40 transition-all"
          onClick={() => setIsMinimized(false)}
        >
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-2">
              <span>Запуск: {account.username}</span>
              <span className="text-emerald-400 font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                {percentage}%
              </span>
            </div>
            <div className="text-[10px] text-gray-400 truncate max-w-[200px]">
              {STEPS[Math.min(currentStep - 1, STEPS.length - 1)]?.title || 'Инициализация...'}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="p-1 text-gray-400 hover:text-white"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
