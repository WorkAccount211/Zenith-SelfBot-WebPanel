import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Gamepad2, Radio, Play, Clock, Loader2, UserCheck, ShieldCheck } from 'lucide-react';
import { PlayerSearchResult, Account } from '../../types';

interface PlayerFinderTabProps {
  accounts: Account[];
  onSearch: (query: string) => Promise<PlayerSearchResult | null>;
  onJoinPlayer: (account: Account, placeId: string, serverType: string) => void;
}

export const PlayerFinderTab: React.FC<PlayerFinderTabProps> = ({
  accounts,
  onSearch,
  onJoinPlayer
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlayerSearchResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [history, setHistory] = useState<string[]>(['DeltaSniper_RU', 'Saver', 'RobloxOfficial', '109283741']);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await onSearch(query.trim());
    setResult(res);
    setLoading(false);

    if (res && !history.includes(query.trim())) {
      setHistory(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
  };

  const handleQuickHistory = async (item: string) => {
    setQuery(item);
    setLoading(true);
    const res = await onSearch(item);
    setResult(res);
    setLoading(false);
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
          <span>Игрок Finder (Roblox Player & Server Detector)</span>
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Поиск игроков по нику, ID или ссылке профиля, определение активного сервера и быстрое подключение
        </p>
      </div>

      {/* Search Input Box */}
      <div className="rounded-2xl p-5 bg-[#18181B] border border-white/10 space-y-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введите никнейм, Roblox ID или ссылку профиля..."
              className="w-full rounded-xl bg-[#09090B] border border-white/10 pl-10 pr-4 py-2.5 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm flex items-center space-x-2 disabled:opacity-40 transition-all shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Найти игрока</span>
          </button>
        </form>

        {/* History Chips */}
        {history.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="shrink-0 font-medium text-gray-400">История:</span>
            <div className="flex flex-wrap gap-1.5">
              {history.map((item) => (
                <button
                  key={item}
                  onClick={() => handleQuickHistory(item)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-gray-300 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Result Display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 bg-[#18181B] border border-white/10 space-y-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center space-x-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 aspect-square shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-sm bg-[#09090B] p-1 flex items-center justify-center">
                  <img
                    src={result.avatarUrl}
                    alt={result.username}
                    className="w-full h-full aspect-square object-cover rounded-xl block shrink-0"
                  />
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#18181B] flex items-center justify-center ${
                    result.inGame ? 'bg-emerald-400 animate-pulse' : result.isOnline ? 'bg-indigo-400' : 'bg-zinc-600'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white">{result.displayName}</h3>
                  <span className="text-xs text-gray-400 font-mono">(@{result.username})</span>
                </div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">
                  User ID: {result.userId}
                </div>
                <div className="mt-1.5 inline-flex items-center space-x-1.5 text-xs font-medium">
                  {result.inGame ? (
                    <span className="text-emerald-400 flex items-center space-x-1 font-semibold">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>В игре прямо сейчас</span>
                    </span>
                  ) : result.isOnline ? (
                    <span className="text-indigo-300">Онлайн на сайте</span>
                  ) : (
                    <span className="text-gray-500">Офлайн</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Current Game & Server detection */}
          {result.inGame && result.currentGame ? (
            <div className="p-4 rounded-xl bg-[#121215] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Gamepad2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{result.currentGame.gameName}</h4>
                    <p className="text-xs text-gray-400 font-mono">Place ID: {result.currentGame.placeId}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-[#09090B] border border-white/5">
                  <span className="text-gray-500 block text-[10px]">Server GUID</span>
                  <span className="font-mono text-gray-300 truncate block">{result.currentGame.serverId}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#09090B] border border-white/5">
                  <span className="text-gray-500 block text-[10px]">Игроки на сервере</span>
                  <span className="font-semibold text-white">{result.currentGame.playerCount} / {result.currentGame.maxPlayers}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#09090B] border border-white/5">
                  <span className="text-gray-500 block text-[10px]">Пинг сервера</span>
                  <span className="font-semibold text-emerald-400">{result.currentGame.pingMs} ms</span>
                </div>
              </div>

              {/* Join Action with account picker */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:w-64">
                  <label className="text-[11px] text-gray-400 block mb-1 font-medium">Зайти с аккаунта:</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full rounded-xl bg-[#09090B] border border-white/10 px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} disabled={acc.isBanned}>
                        {acc.displayName || acc.username} (@{acc.username})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => onJoinPlayer(selectedAccount, result.currentGame!.placeId, 'Instance')}
                  className="w-full sm:w-auto flex-1 mt-auto py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Присоединиться к серверу игрока</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#09090B] border border-white/5 text-xs text-gray-500 text-center">
              Игрок в данный момент не находится на публичном игровом сервере.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
