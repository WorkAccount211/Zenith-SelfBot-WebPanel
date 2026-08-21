import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pin,
  Play,
  RefreshCw,
  Trash2,
  User,
  ShieldCheck,
  ShieldAlert,
  X,
  Plus,
  Search,
  Laptop,
  Download,
  Upload,
  Ban,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import { Account, ServerHealth } from '../../types';
import {
  CustomCrownBadge,
  CustomShieldBadge,
  CustomSwordsBadge,
  CustomBanBadge,
  CustomRobuxIcon,
  CustomRobloxIcon,
  ZenithTooltip
} from '../ZenithStatusBadges';

// Robust, non-cropped Avatar Component with fallback and high-z-index status overlay
const AccountAvatar: React.FC<{
  src: string;
  alt: string;
  sizeClass?: string;
  isBanned?: boolean;
  status?: string;
  isPinned?: boolean;
  customMac?: string;
  currentGame?: string;
  banReason?: string;
  showOverlayBadges?: boolean;
}> = ({
  src,
  alt,
  sizeClass = 'w-20 h-20',
  isBanned,
  status,
  isPinned,
  customMac,
  currentGame,
  banReason,
  showOverlayBadges = true
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`account-avatar-wrapper relative ${sizeClass} aspect-square shrink-0 rounded-2xl mx-auto border border-white/15 bg-[#09090B] p-1 shadow-lg flex items-center justify-center`}
      style={{ position: 'relative', overflow: 'visible' }}
    >
      {/* High-Z-Index Absolute Overlay Badges at top-right: top: 0; right: 0; transform: translate(25%, -25%); z-index: 10; */}
      {showOverlayBadges && (isPinned || customMac || status === 'in_game' || isBanned) && (
        <div
          className="account-status-overlay-badge flex items-center space-x-1"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            transform: 'translate(25%, -25%)',
            zIndex: 10
          }}
        >
          {isPinned && <CustomCrownBadge size={20} />}
          {customMac && <CustomShieldBadge size={20} macAddress={customMac} />}
          {status === 'in_game' && <CustomSwordsBadge size={20} gameName={currentGame} />}
          {isBanned && <CustomBanBadge size={18} reason={banReason} />}
        </div>
      )}

      {/* Constrained Avatar Image with object-fit: cover */}
      <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-[#09090B]">
        {!hasError && src ? (
          <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            className="account-avatar-img w-full h-full aspect-square object-cover rounded-xl block shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-950 to-zinc-900 flex items-center justify-center text-indigo-400 font-bold text-base select-none">
            {alt ? alt.slice(0, 2).toUpperCase() : 'RO'}
          </div>
        )}
      </div>

      {/* Status Dot */}
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#18181B] z-20 flex items-center justify-center ${
          isBanned
            ? 'bg-rose-500 text-white'
            : status === 'in_game'
            ? 'bg-emerald-400 animate-pulse'
            : status === 'online'
            ? 'bg-indigo-400'
            : 'bg-zinc-600'
        }`}
      >
        {isBanned && <span className="text-[8px] font-bold">✕</span>}
      </span>
    </div>
  );
};

interface AccountsTabProps {
  accounts: Account[];
  onPinToggle: (id: string) => void;
  onRefreshAccount: (id: string) => void;
  onRefreshAll: () => void;
  onDeleteAccount: (id: string) => void;
  onLaunchAccount: (acc: Account) => void;
  onOpenAddModal: () => void;
  onToggleBanStatus: (id: string) => void;
  onImportAccountsData: (jsonStr: string) => boolean;
  isRefreshing: boolean;
  serverHealth?: ServerHealth;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  onPinToggle,
  onRefreshAccount,
  onRefreshAll,
  onDeleteAccount,
  onLaunchAccount,
  onOpenAddModal,
  onToggleBanStatus,
  onImportAccountsData,
  isRefreshing,
  serverHealth
}) => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'banned' | 'in_game'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch =
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.robloxId && acc.robloxId.includes(searchQuery));

    if (!matchesSearch) return false;
    if (filterStatus === 'online') return acc.status === 'online' || acc.status === 'in_game';
    if (filterStatus === 'banned') return acc.isBanned;
    if (filterStatus === 'in_game') return acc.status === 'in_game';
    return true;
  });

  // Feature 19: 1-Click ZIP / JSON Profiles Export
  const handleExportProfiles = () => {
    const exportData = {
      app: 'Zenith RAM V3.4.0',
      version: '3.4.0',
      exportDate: new Date().toISOString(),
      accountsCount: accounts.length,
      accounts: accounts.map(a => ({
        id: a.id,
        robloxId: a.robloxId,
        username: a.username,
        displayName: a.displayName,
        avatarUrl: a.avatarUrl,
        robuxBalance: a.robuxBalance,
        createdDate: a.createdDate,
        isPinned: a.isPinned,
        isBanned: a.isBanned,
        banReason: a.banReason,
        customMac: a.customMac,
        customHwid: a.customHwid,
        notes: a.notes,
        status: a.status
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZenithRAM_Profiles_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Feature 19: 1-Click Profile Import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.accounts && Array.isArray(parsed.accounts)) {
          onImportAccountsData(parsed.accounts);
        }
      } catch (err) {
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
  };

  // Update selected account if it changes in state
  const activeAccount = selectedAccount ? accounts.find(a => a.id === selectedAccount.id) || selectedAccount : null;

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Main Grid area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Менеджер Аккаунтов</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {accounts.length}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Изолированные профили с персональным HWID/MAC спуфингом
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по логину, ID..."
                className="rounded-lg bg-[#09090B] border border-white/10 pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 w-44"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg bg-[#09090B] border border-white/10 px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Все аккаунты</option>
              <option value="online">Онлайн</option>
              <option value="in_game">В игре</option>
              <option value="banned">Заблокированные</option>
            </select>

            {/* 1-Click Backup Export & Import */}
            <button
              onClick={handleExportProfiles}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition-all"
              title="Экспорт профилей в JSON/ZIP резервную копию"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Экспорт</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition-all"
              title="Импорт профилей из резервной копии"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Импорт</span>
            </button>

            {/* Refresh All */}
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Обновить все</span>
            </button>

            {/* Add Account Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-950 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить аккаунт</span>
            </button>
          </div>
        </div>

        {/* Account Cards Grid */}
        <div className="accounts-card-container grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredAccounts.map((acc) => {
            const isSelected = activeAccount?.id === acc.id;
            return (
              <motion.div
                key={acc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedAccount(acc)}
                className={`account-card-item relative group rounded-2xl p-3.5 cursor-pointer transition-all duration-200 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1c1c22] border-indigo-500/60 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                    : 'bg-[#18181B] hover:bg-[#202024] border-white/5 hover:border-white/15'
                }`}
              >
                {/* Top Header inside Card: Right Pin */}
                <div className="flex items-center justify-end w-full mb-1 h-6 z-10">
                  <ZenithTooltip
                    content={acc.isPinned ? 'Открепить аккаунт из топа списка' : 'Закрепить аккаунт в начале списка'}
                    align="right"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPinToggle(acc.id);
                      }}
                      className={`p-1.5 rounded-lg transition-all ${
                        acc.isPinned
                          ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-sm'
                          : 'text-gray-500 hover:text-amber-300 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </ZenithTooltip>
                </div>

                {/* Avatar Display - Fully Visible, Centered with High-Z-Index Absolute Status Icons at Top-Right */}
                <div className="flex flex-col items-center text-center my-1">
                  <AccountAvatar
                    src={acc.avatarUrl}
                    alt={acc.username}
                    sizeClass="w-20 h-20"
                    isBanned={acc.isBanned}
                    status={acc.status}
                    isPinned={acc.isPinned}
                    customMac={acc.customMac}
                    currentGame={acc.currentGame}
                    banReason={acc.banReason}
                    showOverlayBadges={true}
                  />

                  {/* Names */}
                  <div className="w-full px-1 mt-3">
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {acc.displayName || acc.username}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate font-mono">@{acc.username}</p>
                  </div>
                </div>

                {/* Account Details Pill */}
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span className="font-semibold text-amber-300">{acc.robuxBalance}</span>
                  </div>
                  <span className="text-gray-500 font-mono text-[9px]">
                    ID: {acc.robloxId ? acc.robloxId.slice(0, 6) + '...' : '—'}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-2.5 flex items-center space-x-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLaunchAccount(acc);
                    }}
                    disabled={acc.isBanned}
                    className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-medium transition-all border border-indigo-500/30 disabled:opacity-30"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{acc.isBanned ? 'Бан' : 'Старт'}</span>
                  </button>

                  <ZenithTooltip
                    content={acc.isBanned ? 'Снять статус блокировки (Разблокировать)' : 'Пометить аккаунт как заблокированный в Roblox (Бан)'}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBanStatus(acc.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors border ${
                        acc.isBanned
                          ? 'text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 bg-emerald-500/10'
                          : 'text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border-white/5 hover:border-rose-500/30'
                      }`}
                    >
                      {acc.isBanned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    </button>
                  </ZenithTooltip>

                  <ZenithTooltip content="Синхронизировать аватар и Robux через Roblox API">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefreshAccount(acc.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </ZenithTooltip>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredAccounts.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <User className="w-12 h-12 text-gray-600 mb-3" />
            <h3 className="text-sm font-semibold text-gray-300">Аккаунты не найдены</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Попробуйте изменить запрос поиска или добавьте новый аккаунт в менеджер
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium"
            >
              Добавить аккаунт
            </button>
          </div>
        )}
      </div>

      {/* Slide-out Detailed Right Panel (Ultra-modern, Complete & Fixed) */}
      <AnimatePresence>
        {activeAccount && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 sm:w-96 bg-[#121215] border-l border-white/10 p-6 flex flex-col overflow-y-auto shadow-2xl z-20 shrink-0"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Профиль аккаунта</span>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Display Card (Not cut off, clean padding, proper aspect ratio) */}
            <div className="rounded-2xl p-5 bg-[#18181B] border border-white/10 text-center mb-5 relative shadow-inner">
              <div className="flex justify-center mb-3">
                <AccountAvatar
                  src={activeAccount.avatarUrl}
                  alt={activeAccount.username}
                  sizeClass="w-24 h-24"
                  isBanned={activeAccount.isBanned}
                  status={activeAccount.status}
                />
              </div>

              <h3 className="text-sm font-bold text-white">{activeAccount.displayName}</h3>
              <p className="text-xs text-gray-400 font-mono">@{activeAccount.username}</p>

              {/* Status & Custom Badges Row */}
              <div className="mt-3 flex items-center justify-center space-x-2">
                {activeAccount.isPinned && <CustomCrownBadge size={24} />}
                {activeAccount.customMac && <CustomShieldBadge size={24} macAddress={activeAccount.customMac} />}
                {activeAccount.status === 'in_game' && <CustomSwordsBadge size={24} gameName={activeAccount.currentGame} />}
                {activeAccount.isBanned && <CustomBanBadge size={22} reason={activeAccount.banReason} />}
              </div>

              {/* Status Text Badge */}
              <div className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-medium border bg-[#09090B] border-white/10">
                {activeAccount.isBanned ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-rose-400 font-semibold">Заблокирован в Roblox</span>
                  </>
                ) : activeAccount.status === 'in_game' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-emerald-400 font-medium">В игре ({activeAccount.currentGame || 'Roblox'})</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Готов к запуску</span>
                  </>
                )}
              </div>

              {/* MANUAL BAN / UNBAN TOGGLE */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center">
                <button
                  onClick={() => onToggleBanStatus(activeAccount.id)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all border ${
                    activeAccount.isBanned
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                  title="Ручное переключение статуса бана"
                >
                  {activeAccount.isBanned ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Снять статус бана (Разблокировать)</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>Пометить как заблокированный</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Parameters & Hardware Info */}
            <div className="space-y-3 mb-6">
              <div className="p-3.5 rounded-xl bg-[#18181B] border border-white/5 text-xs space-y-2.5">
                <div className="flex justify-between text-gray-400">
                  <span>Roblox ID:</span>
                  <span className="font-mono text-white font-medium">{activeAccount.robloxId || '—'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Баланс Robux:</span>
                  <span className="font-bold text-amber-400 flex items-center space-x-1">
                    <Coins className="w-3 h-3 inline mr-1" />
                    {activeAccount.robuxBalance} R$
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Дата создания:</span>
                  <span className="text-gray-200">{activeAccount.createdDate || '—'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Последний вход:</span>
                  <span className="text-gray-200">{activeAccount.lastLogin || 'Недавно'}</span>
                </div>
              </div>

              {/* Hardware Spoofing Details for this specific account */}
              <div className="p-3.5 rounded-xl bg-[#18181B] border border-white/5 text-xs space-y-2.5">
                <div className="font-medium text-gray-200 flex items-center space-x-1.5">
                  <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Аппаратная изоляция (HWID/MAC)</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Виртуальный MAC:</span>
                  <span className="font-mono text-emerald-400">{activeAccount.customMac || '02:4B:91:AA:5E:12'}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Виртуальный HWID:</span>
                  <span className="font-mono text-indigo-300">{activeAccount.customHwid?.slice(0, 18) || 'BFEBFBFF000906EA-UUID'}...</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Сэндбокс профиля:</span>
                  <span className="font-mono text-gray-300">Accounts/{activeAccount.username}/</span>
                </div>
              </div>

              {activeAccount.notes && (
                <div className="p-3.5 rounded-xl bg-[#18181B] border border-white/5 text-xs">
                  <span className="text-indigo-400 font-medium block mb-1">Заметки:</span>
                  <p className="text-gray-300">{activeAccount.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
              <button
                onClick={() => onLaunchAccount(activeAccount)}
                disabled={activeAccount.isBanned}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-950 transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Запустить игру с этим аккаунтом</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onRefreshAccount(activeAccount.id)}
                  className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Обновить API</span>
                </button>

                <button
                  onClick={() => onPinToggle(activeAccount.id)}
                  className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{activeAccount.isPinned ? 'Открепить' : 'Закрепить'}</span>
                </button>
              </div>

              {/* Delete with confirmation */}
              {confirmDeleteId === activeAccount.id ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
                  <p className="text-xs text-rose-400 font-medium">Удалить аккаунт из менеджера?</p>
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => {
                        onDeleteAccount(activeAccount.id);
                        setSelectedAccount(null);
                        setConfirmDeleteId(null);
                      }}
                      className="px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-medium"
                    >
                      Да, удалить
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1 rounded-md bg-white/5 text-gray-300 text-xs"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(activeAccount.id)}
                  className="w-full py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить аккаунт</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
