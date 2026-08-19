import React from 'react';
import {
  LayoutDashboard,
  Server,
  Terminal,
  Smile,
  Users,
  ScrollText,
  BarChart3,
  Settings,
  LogOut,
  Bot,
  Sparkles,
  X
} from 'lucide-react';
import { BotUser } from '../types/bot';
import { soundFX } from '../utils/sound';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  botUser: BotUser;
  serversCount: number;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  hasUpdate?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  botUser,
  serversCount,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  hasUpdate = false
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, badge: null },
    { id: 'servers', label: 'Серверы', icon: Server, badge: serversCount.toString() },
    { id: 'commands', label: 'Команды', icon: Terminal, badge: null },
    { id: 'emojis', label: 'Эмодзи', icon: Smile, badge: null },
    { id: 'members', label: 'Участники', icon: Users, badge: null },
    { id: 'logs', label: 'Логи', icon: ScrollText, pulse: true },
    { id: 'stats', label: 'Статистика', icon: BarChart3, badge: null },
    {
      id: 'settings',
      label: 'Настройки',
      icon: Settings,
      badge: hasUpdate ? 'OTA' : null,
      updateBadge: hasUpdate
    }
  ];

  const getStatusDotColor = (status: BotUser['status']) => {
    switch (status) {
      case 'online': return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
      case 'idle': return 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
      case 'dnd': return 'bg-rose-500 shadow-[0_0_8px_#ef4444]';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 flex flex-col justify-between w-64 h-screen p-4 bg-[#0d0b1a]/95 border-r border-purple-500/20 backdrop-blur-2xl transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-violet-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white tracking-tight">Phantom<span className="text-purple-400">Bot</span></span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Pro
                  </span>
                </div>
                <span className="text-[11px] text-purple-300/50">Self-Bot Control</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-purple-300/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User mini profile banner */}
          <div className="flex items-center gap-3 p-2.5 mb-5 rounded-xl bg-white/[0.02] border border-purple-500/15">
            <div className="relative shrink-0">
              <img
                src={botUser.avatar}
                alt={botUser.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d0b1a] ${getStatusDotColor(
                  botUser.status
                )}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs text-white truncate">{botUser.username}</span>
                {botUser.nitro && <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />}
              </div>
              <span className="text-[11px] font-mono text-purple-300/50">#{botUser.discriminator}</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFX.playClick();
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)] font-semibold'
                      : 'text-purple-200/60 hover:text-purple-100 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-purple-300/50'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      item.updateBadge
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : 'bg-white/5 border-purple-500/20 text-purple-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {item.pulse && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-4 border-t border-purple-500/10">
          <button
            onClick={() => {
              soundFX.playClick();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300/80 hover:text-rose-200 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти из системы</span>
          </button>
        </div>
      </aside>
    </>
  );
};
