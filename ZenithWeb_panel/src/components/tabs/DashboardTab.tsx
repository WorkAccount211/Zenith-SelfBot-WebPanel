import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Server,
  Users,
  Clock,
  Cpu,
  Zap,
  Terminal,
  ShieldAlert,
  Sparkles,
  Play,
  BarChart2,
  TrendingUp,
  LineChart
} from 'lucide-react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController
} from 'chart.js';
import { DashboardStats } from '../../types/bot';
import { soundFX } from '../../utils/sound';
import { CopyButton } from '../common/CopyButton';
import { DashboardSkeleton } from '../common/Skeleton';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController
);

interface DashboardTabProps {
  stats: DashboardStats;
  onExecuteQuickCommand: (cmd: string) => void;
  isLoading?: boolean;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  onExecuteQuickCommand,
  isLoading = false
}) => {
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [metricMode, setMetricMode] = useState<'commands' | 'messages' | 'both'>('commands');

  const formatUptime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days}д ${hours}ч ${minutes}м`;
    return `${hours}ч ${minutes}м`;
  };

  const dailyData = stats.dailyCommandUsage || [
    { day: 'Пн', date: '12 Авг', commands: 42, messages: 1820 },
    { day: 'Вт', date: '13 Авг', commands: 58, messages: 2140 },
    { day: 'Ср', date: '14 Авг', commands: 85, messages: 2890 },
    { day: 'Чт', date: '15 Авг', commands: 64, messages: 2430 },
    { day: 'Пт', date: '16 Авг', commands: 112, messages: 3650 },
    { day: 'Сб', date: '17 Авг', commands: 145, messages: 4120 },
    { day: 'Вс', date: '18 Авг', commands: 98, messages: 3290 }
  ];

  const totalWeeklyCommands = dailyData.reduce((acc, curr) => acc + curr.commands, 0);

  // Initialize and update Chart.js
  useEffect(() => {
    if (!chartCanvasRef.current || isLoading) return;

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart instance before re-creating
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = dailyData.map((d) => `${d.day} (${d.date || ''})`);
    const commandsCounts = dailyData.map((d) => d.commands);
    const messagesCounts = dailyData.map((d) => Math.round(d.messages / 25)); // Scaled for multi-metric view

    // Create custom gradient fills
    const purpleGradient = ctx.createLinearGradient(0, 0, 0, 260);
    purpleGradient.addColorStop(0, 'rgba(168, 85, 247, 0.85)');
    purpleGradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.45)');
    purpleGradient.addColorStop(1, 'rgba(124, 58, 237, 0.05)');

    const blueGradient = ctx.createLinearGradient(0, 0, 0, 260);
    blueGradient.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
    blueGradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

    const datasets: any[] = [];

    if (metricMode === 'commands' || metricMode === 'both') {
      datasets.push({
        label: 'Исполнено команд',
        data: commandsCounts,
        backgroundColor: chartType === 'bar' ? purpleGradient : 'rgba(168, 85, 247, 0.2)',
        borderColor: '#a855f7',
        borderWidth: 2,
        borderRadius: chartType === 'bar' ? 8 : 0,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#c084fc',
        pointBorderColor: '#090812',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      });
    }

    if (metricMode === 'messages' || metricMode === 'both') {
      datasets.push({
        label: metricMode === 'both' ? 'Сообщения (масштаб 1:25)' : 'Сообщения в каналах',
        data: metricMode === 'both' ? messagesCounts : dailyData.map((d) => d.messages),
        backgroundColor: chartType === 'bar' ? blueGradient : 'rgba(59, 130, 246, 0.15)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: chartType === 'bar' ? 8 : 0,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#60a5fa',
        pointBorderColor: '#090812',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      });
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
          easing: 'easeOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: datasets.length > 1,
            position: 'top',
            labels: {
              color: '#c084fc',
              font: { family: 'inherit', size: 12, weight: 600 },
              boxWidth: 12,
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: 'rgba(13, 11, 26, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#e9d5ff',
            borderColor: 'rgba(168, 85, 247, 0.4)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            cornerRadius: 12,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const val = context.parsed.y;
                return ` ${label}: ${val.toLocaleString('ru-RU')} вызовов`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(168, 85, 247, 0.08)'
            },
            ticks: {
              color: 'rgba(216, 180, 254, 0.7)',
              font: { size: 11, family: 'inherit' }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(168, 85, 247, 0.08)'
            },
            ticks: {
              color: 'rgba(216, 180, 254, 0.7)',
              font: { size: 11, family: 'monospace' }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [dailyData, chartType, metricMode, isLoading]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 4 Major Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latency card */}
        <div className="p-5 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-300/70 uppercase tracking-wider">
              Задержка (Ping)
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {stats.ping}
            </span>
            <span className="text-sm font-medium text-purple-300/60">ms</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-emerald-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Gateway WebSocket
            </span>
            <span className="text-purple-300/40">Оптимально</span>
          </div>
        </div>

        {/* Servers card */}
        <div className="p-5 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-300/70 uppercase tracking-wider">
              Серверы
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {stats.serversCount}
            </span>
            <span className="text-sm font-medium text-purple-300/60">гильдий</span>
          </div>
          <div className="mt-3 text-xs text-purple-300/60">
            Активные соединения с ботом
          </div>
        </div>

        {/* Members card */}
        <div className="p-5 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-300/70 uppercase tracking-wider">
              Участники
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {stats.membersCount.toLocaleString('ru-RU')}
            </span>
            <span className="text-sm font-medium text-purple-300/60">чел.</span>
          </div>
          <div className="mt-3 text-xs text-purple-300/60">
            В видимости кэша клиента
          </div>
        </div>

        {/* Uptime card */}
        <div className="p-5 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-300/70 uppercase tracking-wider">
              Время работы (Uptime)
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {formatUptime(stats.uptimeSeconds)}
            </span>
          </div>
          <div className="mt-3 text-xs text-purple-300/60">
            Синхронизировано: {stats.lastSyncTime}
          </div>
        </div>
      </div>

      {/* Bot Hero & Status Details */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#17122b]/90 via-[#130f24]/90 to-[#100d1e]/90 border border-purple-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Avatar and Identity */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={stats.botUser.avatar}
                alt={stats.botUser.username}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-600 text-white ring-2 ring-[#130f24]">
                DND
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white">{stats.botUser.username}</h2>
                <span className="px-2 py-0.5 rounded-md bg-[#5865F2] text-white text-[10px] font-bold tracking-wider">
                  SELF-BOT
                </span>
                {stats.botUser.nitro && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold shadow-md">
                    <Sparkles className="w-3 h-3" /> Nitro
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-purple-200/80 font-mono">
                {stats.botUser.customStatus || 'Управление через REST API'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <CopyButton
                  textToCopy={stats.botUser.id}
                  itemName={stats.botUser.username}
                  prefix="Bot ID:"
                  size="sm"
                  tooltip="Скопировать Discord ID бота"
                />

                {stats.botUser.badges.map((b, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Triggers */}
          <div className="w-full lg:w-auto p-4 rounded-xl bg-black/30 border border-purple-500/20 space-y-2">
            <span className="text-xs font-semibold text-purple-300/70 uppercase tracking-wider block">
              Быстрые команды
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex gap-2">
              <button
                onClick={() => {
                  soundFX.playClick();
                  onExecuteQuickCommand('.ping');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-xs font-mono font-medium border border-purple-500/30 transition-all hover:scale-105"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>.ping</span>
              </button>

              <button
                onClick={() => {
                  soundFX.playClick();
                  onExecuteQuickCommand('.purge 5');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-xs font-mono font-medium border border-purple-500/30 transition-all hover:scale-105"
              >
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>.purge 5</span>
              </button>

              <button
                onClick={() => {
                  soundFX.playClick();
                  onExecuteQuickCommand('.afk on');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-xs font-mono font-medium border border-purple-500/30 transition-all hover:scale-105"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                <span>.afk on</span>
              </button>

              <button
                onClick={() => {
                  soundFX.playClick();
                  onExecuteQuickCommand('.help');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-xs font-mono font-medium border border-purple-500/30 transition-all hover:scale-105"
              >
                <Play className="w-3.5 h-3.5 text-purple-400" />
                <span>.help</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart.js Daily Statistics Module */}
      <div className="p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-base">Ежедневная статистика использования команд</h3>
            </div>
            <p className="text-xs text-purple-300/60">
              График динамики вызовов команд и сообщений за последние 7 дней (Всего: {totalWeeklyCommands} команд)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-purple-500/20 text-xs">
              <button
                onClick={() => {
                  soundFX.playClick();
                  setMetricMode('commands');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  metricMode === 'commands'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-purple-300/60 hover:text-purple-200'
                }`}
              >
                Команды
              </button>
              <button
                onClick={() => {
                  soundFX.playClick();
                  setMetricMode('messages');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  metricMode === 'messages'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-purple-300/60 hover:text-purple-200'
                }`}
              >
                Сообщения
              </button>
              <button
                onClick={() => {
                  soundFX.playClick();
                  setMetricMode('both');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  metricMode === 'both'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-purple-300/60 hover:text-purple-200'
                }`}
              >
                Оба
              </button>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-purple-500/20 text-xs">
              <button
                onClick={() => {
                  soundFX.playClick();
                  setChartType('bar');
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  chartType === 'bar' ? 'bg-purple-600 text-white' : 'text-purple-300/60 hover:text-purple-200'
                }`}
                title="Столбчатый график"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  soundFX.playClick();
                  setChartType('line');
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  chartType === 'line' ? 'bg-purple-600 text-white' : 'text-purple-300/60 hover:text-purple-200'
                }`}
                title="Линейный график"
              >
                <LineChart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="relative h-64 w-full pt-2">
          <canvas ref={chartCanvasRef} id="dashboard-daily-chart" />
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#110e20]/60 border border-purple-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-purple-400" />
            <div>
              <span className="text-xs text-purple-300/60 block">RAM Память бота</span>
              <span className="text-base font-bold text-white font-mono">{stats.ramUsageMB} MB</span>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-medium">Стабильно</span>
        </div>

        <div className="p-4 rounded-xl bg-[#110e20]/60 border border-purple-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs text-purple-300/60 block">Обработано событий</span>
              <span className="text-base font-bold text-white font-mono">
                {stats.messagesProcessed.toLocaleString('ru-RU')}
              </span>
            </div>
          </div>
          <span className="text-xs text-purple-300/60">Gateway</span>
        </div>

        <div className="p-4 rounded-xl bg-[#110e20]/60 border border-purple-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs text-purple-300/60 block">Команд выполнено</span>
              <span className="text-base font-bold text-white font-mono">{stats.commandsExecuted}</span>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-medium">100% Успех</span>
        </div>
      </div>
    </div>
  );
};

