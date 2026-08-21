import React from 'react';
import { Shield, ShieldAlert, Cpu, Lock, Unlock, RefreshCw, Radio, Terminal } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  serverStatus: { status: string; version: string; port: number };
  activeSessionsCount: number;
  totalAccounts: number;
  isLocked: boolean;
  onToggleLock: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  settings: AppSettings;
}

export const Header: React.FC<HeaderProps> = ({
  serverStatus,
  activeSessionsCount,
  totalAccounts,
  isLocked,
  onToggleLock,
  onRefreshAll,
  isRefreshing,
  settings
}) => {
  return (
    <header className="h-16 px-6 bg-[#18181B] border-b border-white/5 flex items-center justify-between z-20 shrink-0">
      {/* Left status items */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-gray-400 font-medium">🖥️ PC Core (IPC):</span>
          <span className="text-emerald-400 font-mono font-medium">:{serverStatus.port || 4080}</span>
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-gray-400 font-medium">⚡ Zenith Bypass V1.4.5:</span>
          <span className="text-indigo-300 font-mono font-medium">1 to ∞</span>
        </div>

        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs">
          <span className="text-gray-400">🎮 Сессий в игре:</span>
          <span className={`font-mono font-medium px-2 py-0.5 rounded text-xs ${activeSessionsCount > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500'}`}>
            {activeSessionsCount}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3">
        {/* Refresh All */}
        <button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition-all active:scale-95"
          title="Синхронизировать аккаунты и сессии с Roblox API"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-gray-400'}`} />
          <span className="hidden sm:inline">Обновить все</span>
        </button>

        {/* Master Lock Switch */}
        {settings.security.masterPasswordEnabled && (
          <button
            onClick={onToggleLock}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLocked
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            }`}
            title={isLocked ? 'Приложение заблокировано' : 'Заблокировать мастер-паролем'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden sm:inline">{isLocked ? 'Заблокировано' : 'Мастер-пароль'}</span>
          </button>
        )}

        {/* User Greeting pill */}
        <div className="flex items-center space-x-2 pl-3 border-l border-white/10">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {settings.general.greetingName?.slice(0, 1) || 'Z'}
          </div>
          <span className="text-xs font-medium text-gray-300 hidden lg:inline">
            {settings.general.greetingName || 'Командир'}
          </span>
        </div>
      </div>
    </header>
  );
};
