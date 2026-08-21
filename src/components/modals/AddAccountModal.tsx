import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, UserPlus, ListPlus, Key, User, Info, FileText } from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSingle: (payload: { username: string; password?: string; displayName?: string; robloxId?: string; notes?: string }) => void;
  onAddBatch: (lines: string[]) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddSingle,
  onAddBatch
}) => {
  const [activeTab, setActiveTab] = useState<'batch' | 'split'>('batch');

  // Batch tab state
  const [batchText, setBatchText] = useState('');

  // Split tab state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [robloxId, setRobloxId] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) return;
    const lines = batchText
      .split(/[\n;]+/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
    if (lines.length > 0) {
      onAddBatch(lines);
      setBatchText('');
      onClose();
    }
  };

  const handleSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    onAddSingle({
      username: username.trim(),
      password: password.trim(),
      displayName: displayName.trim() || undefined,
      robloxId: robloxId.trim() || undefined,
      notes: notes.trim() || undefined
    });
    setUsername('');
    setPassword('');
    setDisplayName('');
    setRobloxId('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#18181B] p-6 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Добавление аккаунтов</h3>
              <p className="text-xs text-gray-400">Синхронизация с Accounts.txt и изолированным сэндбоксом</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#09090B] border border-white/10 mb-5">
          <button
            onClick={() => setActiveTab('batch')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'batch'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Ввод строкой / Пакет</span>
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Добавить раздельно</span>
          </button>
        </div>

        {/* Tab 1: Batch / Line Input */}
        {activeTab === 'batch' && (
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Формат: <code className="text-indigo-400 font-mono">логин:пароль</code> (по одному на строку или через точку с запятой)
              </label>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="Username:Password123&#10;AltUser:Pass456"
                rows={5}
                className="w-full rounded-xl bg-[#09090B] border border-white/10 p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-400 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Все добавленные аккаунты сохраняются в <code className="text-gray-300 font-mono">Accounts.txt</code> и получают индивидуальную директорию сэндбокса.
              </span>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                Импортировать аккаунты
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Split fields (Mandatory Username & Password, Clean Notes) */}
        {activeTab === 'split' && (
          <form onSubmit={handleSplitSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Логин Roblox <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Логин"
                    className="w-full rounded-lg bg-[#09090B] border border-white/10 pl-9 pr-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Пароль Roblox <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    className="w-full rounded-lg bg-[#09090B] border border-white/10 pl-9 pr-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Отображаемое имя (Display Name)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Отображаемое имя"
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Roblox User ID
                </label>
                <input
                  type="text"
                  value={robloxId}
                  onChange={(e) => setRobloxId(e.target.value)}
                  placeholder="User ID"
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Заметки / Описание аккаунта
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder=""
                className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                Сохранить аккаунт
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
