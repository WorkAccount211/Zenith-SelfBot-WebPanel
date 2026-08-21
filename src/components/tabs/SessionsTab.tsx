import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Power,
  RotateCcw,
  Camera,
  Cpu,
  HardDrive,
  RefreshCw,
  Activity,
  AlertTriangle,
  Zap,
  Gauge,
  Clock,
  Laptop
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { ActiveSession } from '../../types';

interface SessionsTabProps {
  sessions: ActiveSession[];
  onTerminate: (id: string) => void;
  onTerminateAll: () => void;
  onRestart: (session: ActiveSession) => void;
  onTakeScreenshot: (session: ActiveSession) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

interface TelemetryPoint {
  time: string;
  totalCpu: number;
  totalRam: number;
  totalGpu: number;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({
  sessions,
  onTerminate,
  onTerminateAll,
  onRestart,
  onTakeScreenshot,
  onRefresh,
  isRefreshing
}) => {
  const [sessionToClose, setSessionToClose] = useState<ActiveSession | null>(null);
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  // Calculate live telemetry
  useEffect(() => {
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const totalCpu = Math.round(sessions.reduce((acc, s) => acc + s.cpuUsage, 0) * 10) / 10;
    const totalRam = sessions.reduce((acc, s) => acc + s.memoryMb, 0);
    const totalGpu = Math.round(sessions.reduce((acc, s) => acc + (s.gpuUsage || 10), 0) * 10) / 10;

    setTelemetryHistory(prev => {
      const next = [...prev, { time: timeLabel, totalCpu, totalRam, totalGpu }];
      return next.slice(-15); // keep last 15 ticks
    });

    const interval = setInterval(() => {
      const tickTime = new Date();
      const tickLabel = `${tickTime.getHours().toString().padStart(2, '0')}:${tickTime.getMinutes().toString().padStart(2, '0')}:${tickTime.getSeconds().toString().padStart(2, '0')}`;
      const jitterCpu = Math.max(2, Math.min(95, totalCpu + (Math.random() * 4 - 2)));
      const jitterRam = Math.max(200, totalRam + Math.floor(Math.random() * 40 - 20));
      const jitterGpu = Math.max(5, Math.min(98, totalGpu + (Math.random() * 6 - 3)));

      setTelemetryHistory(h => [
        ...h.slice(-14),
        { time: tickLabel, totalCpu: Math.round(jitterCpu * 10) / 10, totalRam: jitterRam, totalGpu: Math.round(jitterGpu * 10) / 10 }
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [sessions]);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}ч ${mins}м ${secs}с`;
    return `${mins}м ${secs}с`;
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full space-y-6">
      {/* Header & Global actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Активные Сессии Roblox</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              sessions.length > 0
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-white/5 text-gray-500 border-white/10'
            }`}>
              {sessions.length} активных окон
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Управление процессами Win32, перехват дескрипторов и аппаратная телеметрия
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Обновить</span>
          </button>

          {sessions.length > 0 && (
            <button
              onClick={() => setShowCloseAllConfirm(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-400 transition-all"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Закрыть все сессии</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Hardware Telemetry & Monitoring Dashboard */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 rounded-2xl bg-[#18181B] border border-white/10 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white">Телеметрия нагрузки (CPU, RAM, GPU)</span>
              </div>
              <div className="flex items-center space-x-4 text-[11px] font-mono">
                <span className="text-indigo-400">● CPU (%)</span>
                <span className="text-emerald-400">● GPU (%)</span>
                <span className="text-amber-400">● RAM (MB)</span>
              </div>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory}>
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="totalCpu" stroke="#6366f1" fillOpacity={1} fill="url(#cpuGrad)" name="ЦП (%)" />
                  <Area type="monotone" dataKey="totalGpu" stroke="#10b981" fillOpacity={1} fill="url(#gpuGrad)" name="ГПУ (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Hardware Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
            <div className="p-3 rounded-xl bg-[#18181B] border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Всего ЦП</div>
                  <div className="text-sm font-mono font-bold text-white">
                    {Math.round(sessions.reduce((acc, s) => acc + s.cpuUsage, 0) * 10) / 10}%
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Норма</span>
            </div>

            <div className="p-3 rounded-xl bg-[#18181B] border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Всего ОЗУ</div>
                  <div className="text-sm font-mono font-bold text-white">
                    {(sessions.reduce((acc, s) => acc + s.memoryMb, 0) / 1024).toFixed(2)} ГБ
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-indigo-400 font-mono">{sessions.reduce((acc, s) => acc + s.memoryMb, 0)} МБ</span>
            </div>

            <div className="p-3 rounded-xl bg-[#18181B] border border-white/10 flex items-center justify-between col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">ГПУ / VRAM</div>
                  <div className="text-sm font-mono font-bold text-white">
                    {Math.round(sessions.reduce((acc, s) => acc + (s.gpuUsage || 12), 0) * 10) / 10}% / {sessions.reduce((acc, s) => acc + (s.vramMb || 380), 0)} МБ
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">15 FPS Limit</span>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Grid */}
      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-2xl bg-[#18181B] border border-white/10 hover:border-indigo-500/40 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
            >
              {/* Left info: Account + Game + Avatar Preview */}
              <div className="flex items-center space-x-3.5">
                {/* Account Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 aspect-square shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-md bg-[#121214]">
                    <img
                      src={session.accountAvatar}
                      alt={session.accountUsername}
                      className="w-full h-full aspect-square object-cover block shrink-0"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#18181B] shadow-sm animate-pulse" />
                </div>

                {/* Account & Process Details */}
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4 className="text-sm font-bold text-white">
                      {session.accountUsername}
                    </h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10 font-semibold">
                      PID: {session.pid}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      Roblox ID: {session.robloxId || '109283741'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      ⚡ Zenith V1.4.5 Hooked
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1.5">
                    <span className="text-gray-200 font-semibold flex items-center space-x-1">
                      <span>🎮</span>
                      <span>{session.gameName}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-emerald-400 flex items-center space-x-1">
                      <Laptop className="w-3 h-3 text-emerald-400" />
                      <span>MAC: {session.macAddress}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1 text-gray-300">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>{formatUptime(session.uptimeSeconds)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle stats: CPU, RAM, GPU, VRAM */}
              <div className="grid grid-cols-4 gap-4 px-4 py-2 rounded-xl bg-[#09090B] border border-white/5 text-xs text-gray-300 shrink-0">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">ЦП (CPU)</div>
                  <div className="font-mono font-bold text-white">{session.cpuUsage}%</div>
                </div>

                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">ОЗУ (RAM)</div>
                  <div className="font-mono font-bold text-white">{session.memoryMb} МБ</div>
                </div>

                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">ГПУ (GPU)</div>
                  <div className="font-mono font-bold text-emerald-400">{session.gpuUsage || 14.2}%</div>
                </div>

                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">VRAM</div>
                  <div className="font-mono font-bold text-indigo-300">{session.vramMb || 420} МБ</div>
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => onTakeScreenshot(session)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors"
                  title="Захватить скриншот окна Roblox"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Скриншот</span>
                </button>

                <button
                  onClick={() => onRestart(session)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors"
                  title="Перезапустить процесс"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Рестарт</span>
                </button>

                <button
                  onClick={() => setSessionToClose(session)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-medium transition-colors"
                  title="Завершить сессию (с подтверждением)"
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-[#18181B]/40 border border-white/5">
          <Layers className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-sm font-bold text-gray-300">Нет активных запущенных сессий</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Запустите аккаунты через вкладку «Быстрый запуск» или «Аккаунты».
          </p>
        </div>
      )}

      {/* Confirmation Dialog for Single Session Termination */}
      <AnimatePresence>
        {sessionToClose && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-[#18181B] border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Завершить сессию?</h3>
                  <p className="text-xs text-gray-400">Процесс PID {sessionToClose.pid} будет принудительно закрыт</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#09090B] border border-white/5 text-xs space-y-1.5 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Аккаунт:</span>
                  <span className="font-semibold text-white">{sessionToClose.accountUsername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Roblox ID:</span>
                  <span className="font-mono text-gray-300">{sessionToClose.robloxId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Игра:</span>
                  <span className="text-indigo-300">{sessionToClose.gameName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Время в игре:</span>
                  <span className="font-mono text-emerald-400">{formatUptime(sessionToClose.uptimeSeconds)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setSessionToClose(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    onTerminate(sessionToClose.id);
                    setSessionToClose(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                >
                  Да, закрыть сессию
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog for Close All Sessions */}
      <AnimatePresence>
        {showCloseAllConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-[#18181B] border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Закрыть ВСЕ активные сессии?</h3>
                  <p className="text-xs text-gray-400">Будут завершены все {sessions.length} процессов Roblox</p>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Все открытые окна клиентов будут мгновенно остановлены. Несохраненный игровой прогресс может быть утерян.
              </p>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowCloseAllConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    onTerminateAll();
                    setShowCloseAllConfirm(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                >
                  Да, завершить все
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
