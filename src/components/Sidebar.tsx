import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Rocket,
  Layers,
  Search,
  Shield,
  Settings,
  ScrollText,
  FileCode2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Lock
} from 'lucide-react';
import { CustomRobloxIcon } from './ZenithStatusBadges';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  activeSessionsCount: number;
  errorCount: number;
  isLocked: boolean;
  serverHealth?: any;
}

interface NavItem {
  id: string;
  name: string;
  icon: any;
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeSessionsCount,
  errorCount,
  isLocked,
  serverHealth
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const effectiveExpanded = isExpanded || isHovered;

  const isRobloxRunning = activeSessionsCount > 0 || serverHealth?.roblox?.isRunning;
  const robloxVersion = serverHealth?.roblox?.version || 'version-e26b149b5c3a4f89 (x64)';
  const robloxDir = serverHealth?.roblox?.directory || 'C:\\Users\\AppData\\Local\\Roblox\\Versions\\version-e26b149b5c3a4f89';

  const navItems: NavItem[] = [
    { id: 'accounts', name: 'Аккаунты', icon: Users },
    { id: 'quick-launch', name: 'Быстрый запуск', icon: Rocket },
    {
      id: 'sessions',
      name: 'Сессии',
      icon: Layers,
      badge: activeSessionsCount,
      badgeColor: 'bg-emerald-500'
    },
    { id: 'player-finder', name: 'Игрок Finder', icon: Search },
    { id: 'security', name: 'Безопасность', icon: Shield },
    { id: 'settings', name: 'Настройки', icon: Settings },
    {
      id: 'logs',
      name: 'Логи',
      icon: ScrollText,
      badge: errorCount > 0 ? errorCount : undefined,
      badgeColor: 'bg-rose-500'
    },
    { id: 'project-files', name: 'Файлы & Сборка EXE', icon: FileCode2 }
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex flex-col h-screen bg-[#121215] border-r border-white/5 backdrop-blur-xl transition-all duration-300 z-30 ${
        effectiveExpanded ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-4 py-3 h-16 border-b border-white/5 bg-[#18181B]/50">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-950 shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {effectiveExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="whitespace-nowrap"
            >
              <div className="text-sm font-semibold tracking-tight text-white flex items-center space-x-1.5">
                <span>ZenithRAM</span>
                <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v3.4
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">Multi-Instance Engine</p>
            </motion.div>
          )}
        </div>

        {effectiveExpanded && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Закрепить / Свернуть боковую панель"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav items list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {effectiveExpanded && (
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 px-2.5 font-semibold">
            Навигация
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              disabled={isLocked && item.id !== 'settings'}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              } ${isLocked && item.id !== 'settings' ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-200'
                }`}
              />

              {effectiveExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-3 truncate text-left flex-1"
                >
                  {item.name}
                </motion.span>
              )}

              {/* Badges */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-md text-white shrink-0 ${
                    item.badgeColor || 'bg-indigo-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapsed state */}
              {!effectiveExpanded && (
                <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-[#18181B] border border-white/10 text-xs font-medium text-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                  {item.name}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status indicator */}
      <div className="p-3 border-t border-white/5 bg-[#121215] space-y-2">
        {/* Roblox Status & Version Module (ABOVE 127.0.0.1:4080) */}
        {effectiveExpanded ? (
          <div className="p-2.5 rounded-lg bg-[#18181B] border border-white/10 space-y-1.5 shadow-sm">
            {/* Roblox Status Indicator: "Статус Roblox:" "Активен" / "Неактивен" */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-white">
                <CustomRobloxIcon size={14} />
                <span>Статус Roblox:</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRobloxRunning ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    isRobloxRunning
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                  }`}
                >
                  {isRobloxRunning ? (activeSessionsCount > 1 ? `Активен (${activeSessionsCount})` : 'Активен') : 'Неактивен'}
                </span>
              </div>
            </div>

            {/* Roblox Version by Directory / Client info */}
            <div className="pt-1.5 border-t border-white/5 space-y-0.5">
              <div className="text-[10px] text-gray-400 flex items-center justify-between">
                <span>Версия Roblox:</span>
                <span className="text-[10px] text-indigo-300 font-mono font-medium truncate max-w-[120px]" title={robloxVersion}>
                  {robloxVersion.slice(0, 16)}...
                </span>
              </div>
              <div className="text-[9px] text-gray-500 font-mono truncate hover:text-gray-300 transition-colors" title={robloxDir}>
                📁 {robloxDir.slice(0, 26)}...
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-10 h-10 mx-auto rounded-lg bg-[#18181B] border border-white/10 flex items-center justify-center relative cursor-help"
            title={`Статус Roblox: ${isRobloxRunning ? 'Активен' : 'Неактивен'}\nВерсия: ${robloxVersion}\nДиректория: ${robloxDir}`}
          >
            <CustomRobloxIcon size={18} />
            <span
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#121215] ${
                isRobloxRunning ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
          </div>
        )}

        {/* Core Host IPC: 127.0.0.1:4080 */}
        <div className="p-2.5 rounded-lg bg-[#18181B] border border-white/5">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {effectiveExpanded && (
              <div className="text-[11px] text-gray-300 font-mono truncate flex items-center justify-between w-full">
                <span className="text-emerald-400 font-medium">127.0.0.1:4080</span>
                <span className="text-[9px] text-gray-500">IPC API</span>
              </div>
            )}
          </div>
          {effectiveExpanded && (
            <div className="text-[10px] text-gray-500 mt-1.5 flex justify-between items-center">
              <span className="truncate pr-1">⚡ Zenith Bypass V1.4.5</span>
              <span className="text-emerald-400 font-semibold uppercase text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">ACTIVE</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
