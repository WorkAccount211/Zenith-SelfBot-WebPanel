import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ScrollText,
  Search,
  Filter,
  Trash2,
  Download,
  Copy,
  Check,
  BarChart3,
  AlertTriangle,
  Info,
  Bug,
  AlertCircle
} from 'lucide-react';
import { LogEntry } from '../../types';

interface LogsTabProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs, onClearLogs }) => {
  const [activeView, setActiveView] = useState<'stream' | 'analytics'>('stream');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
    if (selectedModule !== 'all' && log.module !== selectedModule) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        log.timestamp.includes(q)
      );
    }
    return true;
  });

  const handleCopy = (log: LogEntry) => {
    const text = `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.module}]: ${log.message}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = (format: 'txt' | 'csv') => {
    let content = '';
    if (format === 'txt') {
      content = logs
        .map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.module}] ${l.message} ${l.repeatCount ? `(x${l.repeatCount})` : ''}`)
        .join('\n');
    } else {
      content = 'Timestamp,Level,Module,Message,RepeatCount\n' +
        logs
          .map(l => `"${l.timestamp}","${l.level}","${l.module}","${l.message.replace(/"/g, '""')}",${l.repeatCount || 1}`)
          .join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zenithram_logs_${Date.now()}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warningCount = logs.filter(l => l.level === 'warning').length;
  const infoCount = logs.filter(l => l.level === 'info').length;
  const debugCount = logs.filter(l => l.level === 'debug').length;

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full space-y-6 flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Журнал Логирования & Аналитика</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
              {logs.length} записей
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Реал-тайм логи ядра, API, спуферов и патчера Mutex с автоматической группировкой
          </p>
        </div>

        {/* View mode toggle & Export */}
        <div className="flex items-center space-x-2">
          <div className="flex p-1 rounded-xl bg-[#18181B] border border-white/5">
            <button
              onClick={() => setActiveView('stream')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                activeView === 'stream' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Поток логов</span>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                activeView === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Аналитика</span>
            </button>
          </div>

          <button
            onClick={() => handleExport('txt')}
            className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium flex items-center space-x-1.5 transition-all"
            title="Экспорт в TXT"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Экспорт TXT</span>
          </button>

          {confirmClear ? (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => {
                  onClearLogs();
                  setConfirmClear(false);
                }}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
              >
                Очистить
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 text-xs transition-colors"
              title="Очистить журнал логов"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {activeView === 'stream' ? (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#18181B] border border-white/5 shrink-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по тексту или дате..."
                className="w-full rounded-lg bg-[#09090B] border border-white/10 pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Level selector */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="rounded-lg bg-[#09090B] border border-white/10 px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Все уровни</option>
              <option value="error">Errors ({errorCount})</option>
              <option value="warning">Warnings ({warningCount})</option>
              <option value="info">Info ({infoCount})</option>
              <option value="debug">Debug ({debugCount})</option>
            </select>

            {/* Module selector */}
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="rounded-lg bg-[#09090B] border border-white/10 px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Все модули</option>
              <option value="CORE">CORE (Ядро)</option>
              <option value="MUTEX">MUTEX (Патчер)</option>
              <option value="SPOOFER">SPOOFER (Спуфер)</option>
              <option value="API">API (Roblox)</option>
              <option value="SERVER">SERVER (Локальный сервер)</option>
            </select>
          </div>

          {/* Log Stream Box */}
          <div className="flex-1 rounded-xl bg-[#09090B] border border-white/5 p-4 font-mono text-xs overflow-y-auto space-y-1.5">
            {filteredLogs.map((log) => {
              const isError = log.level === 'error';
              const isWarning = log.level === 'warning';
              const isDebug = log.level === 'debug';

              return (
                <div
                  key={log.id}
                  className={`group flex items-start justify-between p-2 rounded-lg transition-colors ${
                    isError
                      ? 'bg-rose-950/30 text-rose-300 border border-rose-900/30'
                      : isWarning
                      ? 'bg-amber-950/20 text-amber-300 border border-amber-900/20'
                      : isDebug
                      ? 'bg-blue-950/20 text-blue-300'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start space-x-2.5 overflow-hidden">
                    <span className="text-[10px] text-gray-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${
                        isError
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : isDebug
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/10 text-gray-300 border border-white/10'
                      }`}
                    >
                      {log.level}
                    </span>

                    <span className="text-indigo-400 font-semibold text-[11px] shrink-0">
                      [{log.module}]
                    </span>

                    <span className="break-all text-gray-300">{log.message}</span>

                    {log.repeatCount && log.repeatCount > 1 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold shrink-0">
                        x{log.repeatCount}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(log)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-opacity shrink-0 ml-2"
                    title="Копировать строку лога"
                  >
                    {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Записи логов отсутствуют или отфильтрованы
              </div>
            )}
          </div>
        </>
      ) : (
        /* Analytics View */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#18181B] border border-white/5 text-center">
              <span className="text-xs text-gray-400 block">Всего записей</span>
              <span className="text-2xl font-bold text-white mt-1 block">{logs.length}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#18181B] border border-rose-500/20 text-center">
              <span className="text-xs text-rose-400 block">Ошибки (Errors)</span>
              <span className="text-2xl font-bold text-rose-400 mt-1 block">{errorCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#18181B] border border-amber-500/20 text-center">
              <span className="text-xs text-amber-400 block">Предупреждения</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">{warningCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#18181B] border border-emerald-500/20 text-center">
              <span className="text-xs text-emerald-400 block">Информация</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">{infoCount}</span>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#18181B] border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Распределение событий по модулям</h3>
            <div className="space-y-3">
              {['CORE', 'MUTEX', 'SPOOFER', 'API', 'SERVER'].map((mod) => {
                const count = logs.filter(l => l.module === mod).length;
                const percent = logs.length > 0 ? (count / logs.length) * 100 : 0;
                return (
                  <div key={mod} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Модуль {mod}</span>
                      <span className="font-mono">{count} ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full bg-[#09090B] h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
