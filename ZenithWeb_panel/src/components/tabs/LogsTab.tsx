import React, { useState, useEffect, useRef } from 'react';
import { ScrollText, Trash2, Download, Search, RefreshCw, Pause, Play, ArrowDown, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { LogEntry } from '../../types/bot';
import { soundFX } from '../../utils/sound';
import { useToast } from '../ToastContainer';
import { LogsSkeleton } from '../common/Skeleton';

interface LogsTabProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onRefreshLogs: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: (val: boolean) => void;
  isRefreshing: boolean;
  wsConnected?: boolean;
  isLiveStream?: boolean;
  isLoading?: boolean;
}

export const LogsTab: React.FC<LogsTabProps> = ({
  logs,
  onClearLogs,
  onRefreshLogs,
  autoRefresh,
  onToggleAutoRefresh,
  isRefreshing,
  wsConnected = false,
  isLiveStream = true,
  isLoading = false
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('all');
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  const filterLevels = ['ALL', 'INFO', 'COMMAND', 'WARN', 'ERROR', 'DEBUG'];

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filteredLogs = safeLogs.filter((log) => {
    if (!log) return false;
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesSearch =
      (log.message && log.message.toLowerCase().includes(search.toLowerCase())) ||
      (log.source && log.source.toLowerCase().includes(search.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  // Auto scroll to bottom when new logs arrive if enabled
  useEffect(() => {
    if (autoScroll && !isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [safeLogs.length, autoScroll, isPaused]);

  if (isLoading) {
    return <LogsSkeleton />;
  }

  const getLevelBadgeClass = (level: LogEntry['level']) => {
    switch (level) {
      case 'INFO': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'COMMAND': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'WARN': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'ERROR': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'DEBUG': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default: return 'text-purple-300 bg-purple-500/10 border-purple-500/30';
    }
  };

  const handleExportLogs = (scope: 'filtered' | 'all' = 'all') => {
    const targetLogs = scope === 'filtered' ? filteredLogs : safeLogs;
    const now = new Date();
    const isoDate = now.toISOString();
    const dateFormatted = now.toLocaleString('ru-RU');
    const auditId = `AUDIT-${now.getTime().toString(36).toUpperCase()}`;

    const separator = '='.repeat(80);
    const lineSeparator = '-'.repeat(80);

    const header = [
      separator,
      '                      DISCORD SELF-BOT LOCAL AUDIT LOG',
      separator,
      `Audit ID:            ${auditId}`,
      `Export Timestamp:    ${isoDate} (${dateFormatted})`,
      `Total Buffer Size:   ${safeLogs.length} entries`,
      `Exported Records:    ${targetLogs.length} entries`,
      `Filter Level:        ${filterLevel}`,
      `Search Filter:       ${search || 'None'}`,
      `Export Scope:        ${scope === 'filtered' ? 'Filtered View Only' : 'Complete Log Buffer'}`,
      `Environment:         Discord Client Self-Bot Gateway & aiohttp.web Server`,
      separator,
      `[TIMESTAMP]             [LEVEL]     [SOURCE]        [MESSAGE]`,
      lineSeparator
    ].join('\n');

    const logLines = targetLogs.map((l) => {
      const padTimestamp = (l.timestamp || '').padEnd(21, ' ');
      const padLevel = `[${l.level}]`.padEnd(12, ' ');
      const padSource = `[${l.source || 'sys'}]`.padEnd(16, ' ');
      return `${padTimestamp} ${padLevel} ${padSource} ${l.message}`;
    }).join('\n');

    const footer = [
      '',
      lineSeparator,
      `Audit Summary: Successfully exported ${targetLogs.length} events for local security inspection.`,
      `Audit Completed At: ${dateFormatted}`,
      separator
    ].join('\n');

    const fullContent = `${header}\n${logLines}\n${footer}`;
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-buffer-${now.toISOString().slice(0, 10)}-${now.getHours()}${now.getMinutes()}${now.getSeconds()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    soundFX.playSuccess();
    showToast(`Аудит-лог (${targetLogs.length} записей) успешно скачан как .txt`, 'success');
  };

  const scrollToBottom = () => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Консоль и логи бота</h2>
            {/* Live WebSocket Status indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-purple-500/20 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-purple-400'}`} />
              <span className={wsConnected ? 'text-emerald-400 font-semibold' : 'text-purple-300'}>
                {wsConnected ? 'WebSocket Live' : 'Стрим симуляции'}
              </span>
            </div>
          </div>
          <p className="text-xs text-purple-300/60 mt-0.5">
            Журнал событий aiohttp и Discord клиента ({safeLogs.length} записей в буфере)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pause / Resume stream */}
          <button
            onClick={() => {
              soundFX.playClick();
              setIsPaused(!isPaused);
              showToast(isPaused ? 'Поток логов возобновлен' : 'Поток логов приостановлен', 'info');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:border-purple-400'
            }`}
            title={isPaused ? 'Возобновить прием' : 'Приостановить поток'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Пауза (Стрим)' : 'Активен'}</span>
          </button>

          {/* Auto scroll toggle */}
          <button
            onClick={() => {
              soundFX.playClick();
              setAutoScroll(!autoScroll);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              autoScroll
                ? 'bg-purple-600/30 text-purple-200 border-purple-500/40'
                : 'bg-[#131024]/80 text-purple-300/60 border-purple-500/20'
            }`}
            title="Автопрокрутка вниз"
          >
            <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? 'text-purple-400' : ''}`} />
            <span>Автопрокрутка</span>
          </button>

          {/* Refresh Manual Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              onRefreshLogs();
            }}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-purple-300 hover:text-white bg-[#131024]/80 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
            title="Обновить вручную"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          {/* Download Audit Log Button */}
          <div className="relative inline-flex items-center">
            <button
              onClick={() => handleExportLogs('all')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 hover:border-purple-400 transition-all shadow-[0_2px_10px_rgba(168,85,247,0.15)] group"
              title="Скачать полный буфер логов для аудита"
            >
              <Download className="w-4 h-4 text-purple-400 group-hover:translate-y-0.5 transition-transform" />
              <span>Скачать аудит (.txt)</span>
            </button>
          </div>

          {/* Clear Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              onClearLogs();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Очистить</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar with Quick Filter Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                soundFX.playClick();
                setFilterLevel(lvl);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterLevel === lvl
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'text-purple-300/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {filteredLogs.length !== safeLogs.length && (
            <button
              onClick={() => handleExportLogs('filtered')}
              className="text-[11px] font-medium text-purple-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 flex items-center gap-1.5 shrink-0 transition-colors"
              title="Скачать только отфильтрованные записи"
            >
              <FileText className="w-3 h-3 text-purple-400" />
              <span>Экспорт фильтра ({filteredLogs.length})</span>
            </button>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-purple-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по тексту лога..."
              className="w-full bg-[#0a0814]/90 border border-purple-500/20 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-purple-300/30 outline-none focus:border-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Terminal Console View */}
      <div className="rounded-2xl bg-[#080710] border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col min-h-[500px] relative">
        {/* Terminal Header */}
        <div className="px-5 py-3 bg-[#110e22] border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-xs font-mono font-semibold text-purple-300 ml-2">
              aiohttp.web & WebSocket Real-time Log Stream
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-purple-400/60">
              Отображено: {filteredLogs.length}
            </span>
            <button
              onClick={scrollToBottom}
              className="text-[10px] text-purple-400 hover:text-white px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 font-mono"
            >
              Вниз ↓
            </button>
          </div>
        </div>

        {/* Terminal Lines */}
        <div
          ref={logsContainerRef}
          className="flex-1 p-5 overflow-y-auto font-mono text-xs space-y-2 max-h-[550px]"
        >
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors leading-relaxed"
            >
              <span className="text-purple-400/50 shrink-0 select-none">
                [{log.timestamp}]
              </span>

              <span
                className={`px-1.5 py-0.2 rounded border text-[10px] font-bold uppercase shrink-0 ${getLevelBadgeClass(
                  log.level
                )}`}
              >
                {log.level}
              </span>

              {log.source && (
                <span className="text-purple-300/40 text-[11px] shrink-0">
                  [{log.source}]
                </span>
              )}

              <span className="text-purple-100 flex-1 break-all select-text">
                {log.message}
              </span>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-16 text-purple-400/40">
              <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Нет логов для отображения по заданным критериям.</p>
            </div>
          )}

          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};


