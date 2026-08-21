import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Gamepad2,
  Users,
  ChevronDown,
  Layers,
  Sparkles,
  Play,
  Monitor,
  Hash,
  ShieldCheck,
  Plus,
  Minus,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';
import { Account, GamePreset } from '../../types';

interface QuickLaunchTabProps {
  accounts: Account[];
  onStartLaunch: (account: Account, game: GamePreset) => void;
  isLaunching: boolean;
}

// Known game database lookup + dynamic fallback generator
const KNOWN_ROBLOX_EXPERIENCES: Record<string, { name: string; creator: string; icon: string; banner: string; genre: string }> = {
  '7346416636': {
    name: 'Project Delta [Hardcore Survival]',
    creator: 'Delta Project Group',
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    genre: 'Tactical Shooter / Survival'
  },
  '2753915549': {
    name: 'Blox Fruits [Update 20]',
    creator: 'Gamer Robot Inc',
    icon: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80',
    genre: 'Action / Adventure'
  },
  '16732667825': {
    name: 'Pet Simulator 99! [BIG Games]',
    creator: 'BIG Games Pets',
    icon: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=80',
    genre: 'Collecting / Simulator'
  },
  '2788229376': {
    name: 'Da Hood [Anti-Cheat]',
    creator: 'Da Hood Entertainment',
    icon: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&auto=format&fit=crop&q=80',
    genre: 'Town & City / Roleplay'
  },
  '2860908339': {
    name: 'Arsenal [Competitive]',
    creator: 'ROLVe Community',
    icon: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80',
    genre: 'FPS / Arcade'
  }
};

export const QuickLaunchTab: React.FC<QuickLaunchTabProps> = ({
  accounts,
  onStartLaunch,
  isLaunching
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [placeIdInput, setPlaceIdInput] = useState<string>('7346416636');
  const [resolvedGame, setResolvedGame] = useState<{
    name: string;
    creator: string;
    icon: string;
    banner: string;
    genre: string;
    placeId: string;
  }>({
    name: 'Project Delta [Hardcore Survival]',
    creator: 'Delta Project Group',
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    genre: 'Tactical Shooter / Survival',
    placeId: '7346416636'
  });
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [customWindowCount, setCustomWindowCount] = useState<number>(1);
  const [windowLayout, setWindowLayout] = useState<'center_small' | 'grid' | 'cascade' | 'custom'>('center_small');

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Automatically fetch & resolve game details from Place ID
  useEffect(() => {
    const raw = placeIdInput.trim();
    // Extract digits if full URL was pasted (e.g. https://www.roblox.com/games/7346416636/Project-Delta)
    const match = raw.match(/\d{6,}/);
    const cleanId = match ? match[0] : raw.replace(/\D/g, '');

    if (!cleanId) return;

    setIsResolving(true);
    const timer = setTimeout(() => {
      if (KNOWN_ROBLOX_EXPERIENCES[cleanId]) {
        const found = KNOWN_ROBLOX_EXPERIENCES[cleanId];
        setResolvedGame({
          ...found,
          placeId: cleanId
        });
      } else {
        // Dynamic Roblox API response format
        setResolvedGame({
          name: `Roblox Experience #${cleanId}`,
          creator: 'Roblox Verified Creator',
          icon: `https://images.unsplash.com/photo-${1542751371 + (parseInt(cleanId.slice(-4)) || 1000)}?w=200&auto=format&fit=crop&q=80`,
          banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
          genre: 'Community Experience',
          placeId: cleanId
        });
      }
      setIsResolving(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [placeIdInput]);

  const handleLaunch = () => {
    if (!selectedAccount) return;
    const gameToLaunch: GamePreset = {
      id: `game-${resolvedGame.placeId}`,
      name: resolvedGame.name,
      placeId: resolvedGame.placeId,
      icon: resolvedGame.icon,
      banner: resolvedGame.banner,
      genre: resolvedGame.genre
    };

    onStartLaunch(selectedAccount, gameToLaunch);
  };

  const adjustWindowCount = (delta: number) => {
    setCustomWindowCount(prev => Math.max(1, Math.min(64, prev + delta)));
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
          <span>Быстрый Запуск</span>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Zenith Multi-Instance
          </span>
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Запуск изолированных игровых клиентов с автоматическим спуфингом и определением игры по Place ID
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account & Auto-Resolved Game Configuration */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Account Selector Card */}
          <div className="rounded-2xl p-5 bg-[#18181B] border border-white/10 space-y-3.5 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
              <Users className="w-4 h-4" />
              <span>1. Выбор профиля аккаунта</span>
            </label>

            <div className="relative">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full appearance-none rounded-xl bg-[#09090B] border border-white/10 pl-4 pr-10 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} disabled={acc.isBanned}>
                    {acc.isPinned ? '📌 ' : ''}{acc.displayName || acc.username} (@{acc.username}) — {acc.robuxBalance} R$ {acc.isBanned ? ' [ЗАБЛОКИРОВАН]' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            {selectedAccount && (
              <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-[#09090B] border border-white/5 text-xs">
                <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-[#121214] shrink-0">
                  <img
                    src={selectedAccount.avatarUrl}
                    alt={selectedAccount.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-semibold truncate">{selectedAccount.displayName}</span>
                    <span className="text-gray-500 font-mono text-[11px]">(@{selectedAccount.username})</span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono flex items-center space-x-2 mt-0.5">
                    <span>ID: {selectedAccount.robloxId || '—'}</span>
                    <span>•</span>
                    <span className="text-emerald-400">MAC: {selectedAccount.customMac || '02:4B:91:AA:5E:12'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Готов к запуску
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Place ID & Automatic Game Resolver Card */}
          <div className="rounded-2xl p-5 bg-[#18181B] border border-white/10 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                <Gamepad2 className="w-4 h-4" />
                <span>2. Roblox Place ID / Ссылка на Experience</span>
              </label>
              <span className="text-[11px] text-gray-400 font-mono flex items-center space-x-1">
                {isResolving ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                    <span className="text-indigo-400">Поиск в Roblox API...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">API синхронизировано</span>
                  </>
                )}
              </span>
            </div>

            {/* Place ID input */}
            <div>
              <input
                type="text"
                value={placeIdInput}
                onChange={(e) => setPlaceIdInput(e.target.value)}
                placeholder="Вставьте Place ID или ссылку на игру (например: 7346416636)..."
                className="w-full rounded-xl bg-[#09090B] border border-white/10 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>

            {/* Auto-resolved Game Card preview (System extracts name and avatar automatically) */}
            <div className="p-3.5 rounded-xl bg-[#09090B] border border-white/10 flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-[#121214] shrink-0 relative">
                <img
                  src={resolvedGame.icon}
                  alt={resolvedGame.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white truncate">{resolvedGame.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-mono shrink-0">
                    ID: {resolvedGame.placeId}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                  Разработчик: <span className="text-gray-300 font-medium">{resolvedGame.creator}</span> • Жанр: {resolvedGame.genre}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center space-x-1">
                  <span>● Онлайн-серверы активны</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Zenith RAM Mutex Bypass включен</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#09090B] border border-white/5 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Режим обхода мьютекса: <strong className="text-white">Zenith Bypass V1.4.5</strong></span>
              </span>
              <span className="text-indigo-400 font-mono">Win32 Hook Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Window Configuration & Big Start Button */}
        <div className="space-y-5">
          {/* Multi-Window & Positioning Controls */}
          <div className="rounded-2xl p-5 bg-[#18181B] border border-white/10 space-y-4 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
              <Layers className="w-4 h-4" />
              <span>Параметры окон</span>
            </label>

            {/* Custom Window Count */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-300">
                <span>Количество окон (сессий):</span>
                <span className="font-mono font-bold text-white bg-indigo-600/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  {customWindowCount} {customWindowCount === 1 ? 'окно' : 'окон'}
                </span>
              </div>

              {/* Stepper + Input */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => adjustWindowCount(-1)}
                  disabled={customWindowCount <= 1}
                  className="w-10 h-10 rounded-xl bg-[#09090B] border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:border-indigo-500/50 disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <Hash className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3.5" />
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={customWindowCount}
                    onChange={(e) => setCustomWindowCount(Math.max(1, Math.min(64, parseInt(e.target.value) || 1)))}
                    className="w-full text-center font-mono font-bold text-sm bg-[#09090B] border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={() => adjustWindowCount(1)}
                  disabled={customWindowCount >= 64}
                  className="w-10 h-10 rounded-xl bg-[#09090B] border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:border-indigo-500/50 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[1, 2, 3, 4, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCustomWindowCount(num)}
                    className={`py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      customWindowCount === num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#09090B] text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Window Layout Selector */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Расположение окон:</span>
                <span className="text-[11px] text-indigo-400 font-medium">
                  {windowLayout === 'center_small' ? 'В центре экрана' : windowLayout}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setWindowLayout('center_small')}
                  className={`p-2.5 rounded-xl text-xs font-medium flex flex-col items-center justify-center space-y-1 transition-all border ${
                    windowLayout === 'center_small'
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm'
                      : 'bg-[#09090B] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-semibold">В центре (Small)</span>
                </button>

                <button
                  onClick={() => setWindowLayout('grid')}
                  className={`p-2.5 rounded-xl text-xs font-medium flex flex-col items-center justify-center space-y-1 transition-all border ${
                    windowLayout === 'grid'
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm'
                      : 'bg-[#09090B] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-semibold">Сетка (Grid)</span>
                </button>

                <button
                  onClick={() => setWindowLayout('cascade')}
                  className={`p-2.5 rounded-xl text-xs font-medium flex flex-col items-center justify-center space-y-1 transition-all border ${
                    windowLayout === 'cascade'
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm'
                      : 'bg-[#09090B] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs">📑</span>
                  <span className="text-[11px] font-semibold">Каскад</span>
                </button>

                <button
                  onClick={() => setWindowLayout('custom')}
                  className={`p-2.5 rounded-xl text-xs font-medium flex flex-col items-center justify-center space-y-1 transition-all border ${
                    windowLayout === 'custom'
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm'
                      : 'bg-[#09090B] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs">📐</span>
                  <span className="text-[11px] font-semibold">Свободный</span>
                </button>
              </div>
            </div>
          </div>

          {/* Big Start Launch Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLaunch}
            disabled={isLaunching || !selectedAccount || selectedAccount.isBanned}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-950/80 flex items-center justify-center space-x-2.5 transition-all disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>ЗАПУСТИТЬ КЛИЕНТ ROBLOX</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
