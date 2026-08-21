import React from 'react';
import { Activity, RefreshCw, Volume2, VolumeX, Code2, Menu, Sparkles, Radio, Sun, Moon } from 'lucide-react';
import { soundFX } from '../utils/sound';

interface NavbarProps {
  currentTab: string;
  ping: number;
  apiUrl: string;
  isBotOnline: boolean;
  soundEnabled: boolean;
  theme?: 'dark' | 'light';
  onToggleSound: () => void;
  onToggleTheme?: () => void;
  onRefreshData: () => void;
  onOpenCodeExport: () => void;
  onToggleMobileMenu: () => void;
  isRefreshing: boolean;
  isMockMode: boolean;
  hasUpdate?: boolean;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  ping,
  apiUrl,
  isBotOnline,
  soundEnabled,
  theme = 'dark',
  onToggleSound,
  onToggleTheme,
  onRefreshData,
  onOpenCodeExport,
  onToggleMobileMenu,
  isRefreshing,
  isMockMode,
  hasUpdate = false,
  onOpenSettings
}) => {
  const tabTitles: Record<string, string> = {
    dashboard: 'Дашборд и Мониторинг',
    servers: 'Серверы и Гильдии',
    commands: 'Командная консоль & API',
    emojis: 'Кастомные эмодзи',
    members: 'Список участников',
    logs: 'Журнал событий (Логи)',
    stats: 'Статистика и Аналитика',
    settings: 'Конфигурация бота'
  };

  const getPingColor = () => {
    if (ping < 40) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (ping < 100) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-[#090812]/80 backdrop-blur-xl">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-purple-200 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-purple-400/60 uppercase tracking-wider hidden sm:inline">
            Панель
          </span>
          <span className="text-purple-500/40 hidden sm:inline">/</span>
          <h1 className="text-base font-bold text-white tracking-tight">
            {tabTitles[currentTab] || 'Панель управления'}
          </h1>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Update indicator badge */}
        {hasUpdate && (
          <button
            onClick={() => {
              soundFX.playClick();
              if (onOpenSettings) onOpenSettings();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            title="Доступно обновление прошивки бота. Нажмите для перехода в Настройки"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Обновление доступно</span>
          </button>
        )}

        {/* Live Bot Connection Status Badge */}
        <button
          onClick={() => {
            soundFX.playClick();
            if (onOpenSettings) onOpenSettings();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            isBotOnline
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-purple-950/40 border-purple-500/20 text-purple-300 hover:border-purple-500/40'
          }`}
          title="Нажмите для настройки подключения"
        >
          {isBotOnline ? (
            <>
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="font-mono font-bold">{apiUrl.replace(/^https?:\/\//, '')} • Live</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-mono">{apiUrl.replace(/^https?:\/\//, '')}</span>
            </>
          )}
        </button>

        {/* Latency badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${getPingColor()}`}>
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>{ping}ms</span>
        </div>

        {/* Code Export button */}
        <button
          onClick={onOpenCodeExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          title="Экспортировать файлы index.html, style.css, script.js"
        >
          <Code2 className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline">Экспорт кода</span>
        </button>

        {/* Audio FX Toggle */}
        <button
          onClick={() => {
            soundFX.playClick();
            onToggleSound();
          }}
          className="p-2 rounded-xl text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
          title={soundEnabled ? 'Выключить звуки' : 'Включить звуки'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-purple-300/40" />}
        </button>

        {/* Theme Mode Toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
            title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-amber-500 hover:text-amber-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-300 hover:text-amber-200" />
            )}
          </button>
        )}

        {/* Refresh button */}
        <button
          onClick={() => {
            soundFX.playClick();
            onRefreshData();
          }}
          disabled={isRefreshing}
          className="p-2 rounded-xl text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors disabled:opacity-50"
          title="Обновить данные бота"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
