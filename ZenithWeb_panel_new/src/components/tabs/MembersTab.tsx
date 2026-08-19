import React, { useState } from 'react';
import {
  Search,
  Users,
  CheckSquare,
  Square,
  Shield,
  VolumeX,
  Volume2,
  Clock,
  Send,
  Copy,
  Check,
  UserCheck,
  UserX,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { DiscordMember } from '../../types/bot';
import { CopyButton } from '../common/CopyButton';
import { MembersSkeleton } from '../common/Skeleton';
import { soundFX } from '../../utils/sound';
import { useToast } from '../ToastContainer';
import { botApi } from '../../services/api';

interface MembersTabProps {
  members: DiscordMember[];
  isLoading?: boolean;
  onRefreshMembers?: () => void;
  onUpdateMembers?: (members: DiscordMember[]) => void;
}

const AVAILABLE_ROLES = [
  'Admin',
  'Moderator',
  'VIP',
  'Member',
  'Nitro Booster',
  'Muted',
  'DJ',
  'Verified'
];

const MUTE_DURATIONS = [
  { label: '5 мин', value: 5 },
  { label: '15 мин', value: 15 },
  { label: '1 час', value: 60 },
  { label: '6 часов', value: 360 },
  { label: '24 часа', value: 1440 },
  { label: '3 дня', value: 4320 }
];

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  isLoading = false,
  onRefreshMembers,
  onUpdateMembers
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkPanelOpen, setIsBulkPanelOpen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Bulk Role Form State
  const [selectedRole, setSelectedRole] = useState<string>('VIP');
  const [customRole, setCustomRole] = useState<string>('');
  const [roleAction, setRoleAction] = useState<'add' | 'remove'>('add');

  // Bulk Mute Form State
  const [muteDuration, setMuteDuration] = useState<number>(15);
  const [customMuteMinutes, setCustomMuteMinutes] = useState<string>('');
  const [muteReason, setMuteReason] = useState<string>('Нарушение правил сервера');

  // Bulk Message State
  const [bulkMessageText, setBulkMessageText] = useState<string>('');
  const [showBulkMessageInput, setShowBulkMessageInput] = useState(false);

  if (isLoading) {
    return <MembersSkeleton />;
  }

  const safeMembers = Array.isArray(members) ? members : [];

  // Filter members based on search and filters
  const filteredMembers = safeMembers.filter((m) => {
    if (!m) return false;
    const matchesSearch =
      (m.username && m.username.toLowerCase().includes(search.toLowerCase())) ||
      (m.nickname && m.nickname.toLowerCase().includes(search.toLowerCase())) ||
      (m.id && m.id.includes(search));

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'muted' && m.roles?.includes('Muted')) ||
      (roleFilter === 'admin' && (m.roles?.includes('Admin') || m.roles?.includes('Moderator'))) ||
      m.roles?.includes(roleFilter);

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: DiscordMember['status']) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
      case 'idle':
        return 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
      case 'dnd':
        return 'bg-rose-500 shadow-[0_0_8px_#ef4444]';
      default:
        return 'bg-gray-500';
    }
  };

  // Selection helpers
  const handleToggleSelect = (id: string) => {
    soundFX.playClick();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    soundFX.playClick();
    const allFilteredIds = filteredMembers.map((m) => m.id);
    if (selectedIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const handleClearSelection = () => {
    soundFX.playClick();
    setSelectedIds([]);
  };

  // Execute Bulk Role Assignment
  const handleExecuteBulkRole = async () => {
    if (selectedIds.length === 0) {
      showToast('Выберите хотя бы одного участника', 'warning');
      return;
    }
    const targetRole = customRole.trim() || selectedRole;
    if (!targetRole) {
      showToast('Укажите название роли', 'warning');
      return;
    }

    setIsProcessing(true);
    soundFX.playClick();
    try {
      const res = await botApi.bulkAssignRole(selectedIds, targetRole, roleAction);
      if (onUpdateMembers && res.updatedMembers) {
        onUpdateMembers(res.updatedMembers);
      }
      soundFX.playSuccess();
      showToast(
        `Роль "${targetRole}" успешно ${roleAction === 'add' ? 'назначена' : 'снята'} (${selectedIds.length} уч.)`,
        'success'
      );
      setCustomRole('');
    } catch (err) {
      soundFX.playError();
      showToast('Ошибка при массовом назначении роли', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Bulk Temporary Mute
  const handleExecuteBulkMute = async () => {
    if (selectedIds.length === 0) {
      showToast('Выберите хотя бы одного участника', 'warning');
      return;
    }
    const duration = customMuteMinutes ? parseInt(customMuteMinutes, 10) || 15 : muteDuration;

    setIsProcessing(true);
    soundFX.playClick();
    try {
      const res = await botApi.bulkMuteMembers(selectedIds, duration, muteReason);
      if (onUpdateMembers && res.updatedMembers) {
        onUpdateMembers(res.updatedMembers);
      }
      soundFX.playSuccess();
      showToast(
        `Временный мут активирован для ${selectedIds.length} участников (${duration} мин)`,
        'warning'
      );
    } catch (err) {
      soundFX.playError();
      showToast('Ошибка при установке массового мута', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Bulk Unmute
  const handleExecuteBulkUnmute = async () => {
    if (selectedIds.length === 0) {
      showToast('Выберите хотя бы одного участника', 'warning');
      return;
    }

    setIsProcessing(true);
    soundFX.playClick();
    try {
      const res = await botApi.bulkUnmuteMembers(selectedIds);
      if (onUpdateMembers && res.updatedMembers) {
        onUpdateMembers(res.updatedMembers);
      }
      soundFX.playSuccess();
      showToast(`Мут успешно снят с ${selectedIds.length} участников`, 'success');
    } catch (err) {
      soundFX.playError();
      showToast('Ошибка при снятии мута', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Copy IDs
  const handleCopySelectedIds = (separator: 'comma' | 'space' | 'newline') => {
    if (selectedIds.length === 0) {
      showToast('Нет выбранных участников', 'warning');
      return;
    }
    const sep = separator === 'comma' ? ', ' : separator === 'space' ? ' ' : '\n';
    const text = selectedIds.join(sep);
    navigator.clipboard.writeText(text);
    soundFX.playClick();
    showToast(`Скопировано ${selectedIds.length} ID в буфер обмена`, 'success');
  };

  // Bulk Send DM
  const handleSendBulkDM = async () => {
    if (!bulkMessageText.trim()) {
      showToast('Введите текст сообщения', 'warning');
      return;
    }
    setIsProcessing(true);
    soundFX.playClick();
    try {
      await botApi.executeCommand(
        `.massdm "${bulkMessageText.trim()}" --count ${selectedIds.length}`
      );
      soundFX.playSuccess();
      showToast(`Сообщение отправлено ${selectedIds.length} участникам`, 'success');
      setBulkMessageText('');
      setShowBulkMessageInput(false);
    } catch {
      showToast('Ошибка отправки сообщений', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const isAllSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.includes(m.id));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Участники & Модерация</h2>
          </div>
          <p className="text-xs text-purple-300/60 mt-1">
            Управление сервером, пакетные операции (Bulk Actions), роли и временные муты
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, нику или ID..."
              className="w-full bg-[#120f24]/80 border border-purple-500/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-purple-300/40 outline-none transition-all"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#120f24]/80 border border-purple-500/20 text-purple-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-400"
          >
            <option value="all">Все роли</option>
            <option value="admin">Администрация / Мод</option>
            <option value="VIP">VIP</option>
            <option value="Nitro Booster">Nitro Booster</option>
            <option value="muted">Замученные (Muted)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#120f24]/80 border border-purple-500/20 text-purple-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-400"
          >
            <option value="all">Любой статус</option>
            <option value="online">Online</option>
            <option value="idle">Idle</option>
            <option value="dnd">Do Not Disturb</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* ================= BULK OPERATIONS CARD ================= */}
      <div className="rounded-2xl bg-gradient-to-br from-[#16122e]/90 via-[#131024]/90 to-[#0e0b1d]/90 border border-purple-500/30 backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Bulk Card Top Bar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 bg-purple-950/20">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 transition-all shadow-sm"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-purple-400" />
              ) : (
                <Square className="w-4 h-4 text-purple-300/60" />
              )}
              <span>{isAllSelected ? 'Снять выделение со всех' : 'Выбрать всех в списке'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-purple-200">
                Выбрано: <strong className="text-white font-mono text-sm">{selectedIds.length}</strong> из {filteredMembers.length}
              </span>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopySelectedIds('comma')}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 disabled:opacity-40 transition-all"
              title="Скопировать все ID через запятую"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Копировать ID</span>
            </button>

            <button
              onClick={() => setIsBulkPanelOpen(!isBulkPanelOpen)}
              className="p-1.5 rounded-xl text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all"
              title={isBulkPanelOpen ? 'Свернуть панель массовых действий' : 'Развернуть панель'}
            >
              {isBulkPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Action Body */}
        {isBulkPanelOpen && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ACTION 1: Role Assignment */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#100d20]/80 border border-purple-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">Пакетное управление ролями</h3>
                  </div>
                  <span className="text-[11px] font-mono text-purple-300/60">
                    {selectedIds.length} уч. выбрано
                  </span>
                </div>

                {/* Role selection & Action mode */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        soundFX.playClick();
                        setRoleAction('add');
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        roleAction === 'add'
                          ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                          : 'bg-white/5 text-purple-300 hover:bg-white/10'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Назначить роль (+)
                    </button>
                    <button
                      onClick={() => {
                        soundFX.playClick();
                        setRoleAction('remove');
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        roleAction === 'remove'
                          ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                          : 'bg-white/5 text-purple-300 hover:bg-white/10'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Снять роль (-)
                    </button>
                  </div>

                  {/* Preset Roles pills */}
                  <div>
                    <label className="text-[11px] text-purple-300/60 font-medium block mb-1.5">
                      Выберите стандартную роль:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_ROLES.map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            soundFX.playClick();
                            setSelectedRole(role);
                            setCustomRole('');
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            selectedRole === role && !customRole
                              ? 'bg-purple-500/30 border-purple-400 text-white font-semibold shadow-sm'
                              : 'bg-white/5 border-purple-500/20 text-purple-300 hover:bg-white/10'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Role Input */}
                  <div>
                    <label className="text-[11px] text-purple-300/60 font-medium block mb-1">
                      Или введите название кастомной роли:
                    </label>
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="Например: Event Master, DJ, Developer..."
                      className="w-full bg-[#16122e] border border-purple-500/20 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-300/30 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleExecuteBulkRole}
                    disabled={selectedIds.length === 0 || isProcessing}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 ${
                      roleAction === 'add'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>
                      {roleAction === 'add' ? 'Выдать роль' : 'Снять роль'} (
                      {customRole.trim() || selectedRole}) для {selectedIds.length} уч.
                    </span>
                  </button>
                </div>
              </div>

              {/* ACTION 2: Temporary Mute / Timeout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#100d20]/80 border border-purple-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Временный мут (Timeout)</h3>
                  </div>
                  <span className="text-[11px] font-mono text-amber-300/70">Модерация</span>
                </div>

                <div className="space-y-3">
                  {/* Duration Presets */}
                  <div>
                    <label className="text-[11px] text-purple-300/60 font-medium block mb-1.5">
                      Длительность мута:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MUTE_DURATIONS.map((dur) => (
                        <button
                          key={dur.value}
                          onClick={() => {
                            soundFX.playClick();
                            setMuteDuration(dur.value);
                            setCustomMuteMinutes('');
                          }}
                          className={`text-xs py-1.5 px-2 rounded-lg border transition-all text-center ${
                            muteDuration === dur.value && !customMuteMinutes
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold'
                              : 'bg-white/5 border-purple-500/20 text-purple-300 hover:bg-white/10'
                          }`}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="text-[11px] text-purple-300/60 font-medium block mb-1">
                      Причина мута (в аудит-лог бота):
                    </label>
                    <input
                      type="text"
                      value={muteReason}
                      onChange={(e) => setMuteReason(e.target.value)}
                      placeholder="Спам, оскорбления, флуд..."
                      className="w-full bg-[#16122e] border border-purple-500/20 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-300/30 outline-none"
                    />
                  </div>

                  {/* Buttons: Mute & Unmute */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleExecuteBulkMute}
                      disabled={selectedIds.length === 0 || isProcessing}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Замутить ({selectedIds.length})</span>
                    </button>

                    <button
                      onClick={handleExecuteBulkUnmute}
                      disabled={selectedIds.length === 0 || isProcessing}
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Снять роль Muted с выбранных участников"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Снять мут</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION 3: Additional Tools Bar */}
            <div className="pt-2 border-t border-purple-500/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowBulkMessageInput(!showBulkMessageInput)}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-500/20 disabled:opacity-40 transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-purple-400" />
                  <span>Массовое сообщение в ЛС (.dm)</span>
                </button>

                <button
                  onClick={() => handleCopySelectedIds('space')}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 disabled:opacity-40 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                  <span>ID через пробел</span>
                </button>
              </div>

              {selectedIds.length > 0 && (
                <span className="text-xs text-purple-300/60 font-mono">
                  Все действия сразу применяются к сессии self-бота
                </span>
              )}
            </div>

            {/* Collapsible Direct Message Input */}
            {showBulkMessageInput && (
              <div className="p-4 rounded-xl bg-[#120f24] border border-purple-500/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Отправить сообщение всем {selectedIds.length} выбранным участникам
                  </span>
                  <button
                    onClick={() => setShowBulkMessageInput(false)}
                    className="text-xs text-purple-400 hover:text-white"
                  >
                    Отмена
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bulkMessageText}
                    onChange={(e) => setBulkMessageText(e.target.value)}
                    placeholder="Введите текст сообщения для рассылки..."
                    className="flex-1 bg-[#1a1538] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-300/40 outline-none focus:border-purple-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendBulkDM()}
                  />
                  <button
                    onClick={handleSendBulkDM}
                    disabled={!bulkMessageText.trim() || isProcessing}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.4)] disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Отправить</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MEMBERS LIST ================= */}
      <div className="space-y-3">
        {filteredMembers.map((m) => {
          const isSelected = selectedIds.includes(m.id);
          const isMuted = m.roles?.includes('Muted');

          return (
            <div
              key={m.id}
              onClick={() => handleToggleSelect(m.id)}
              className={`p-4 rounded-2xl border backdrop-blur-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg group cursor-pointer ${
                isSelected
                  ? 'bg-[#1e1744]/90 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/40'
                  : 'bg-[#131024]/70 border-purple-500/20 hover:border-purple-500/40'
              }`}
            >
              {/* Left: Checkbox + Avatar + Info */}
              <div className="flex items-center gap-4">
                {/* Selection Checkbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSelect(m.id);
                  }}
                  className="shrink-0 p-1"
                >
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-[0_0_8px_#a855f7]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-lg border border-purple-400/40 hover:border-purple-300 bg-white/5 transition-colors" />
                  )}
                </div>

                <div className="relative shrink-0">
                  <img
                    src={m.avatar}
                    alt={m.username}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/30"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#131024] ${getStatusColor(
                      m.status
                    )}`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{m.username}</span>
                    <span className="text-xs font-mono text-purple-300/40">#{m.discriminator}</span>
                    {m.bot && (
                      <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-[10px] font-bold text-white">
                        BOT
                      </span>
                    )}
                    {isMuted && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                        <VolumeX className="w-2.5 h-2.5" />
                        MUTED
                      </span>
                    )}
                  </div>

                  {m.nickname && (
                    <span className="text-xs text-purple-300/70 block mt-0.5 font-medium">
                      Ник: {m.nickname}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Roles & Actions */}
              <div
                className="flex items-center gap-3 self-end sm:self-auto flex-wrap"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Roles pills */}
                <div className="flex flex-wrap gap-1.5">
                  {m.roles?.map((role, i) => {
                    const isRoleMuted = role === 'Muted';
                    const isRoleAdmin = role === 'Admin' || role === 'Moderator';
                    return (
                      <span
                        key={i}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border ${
                          isRoleMuted
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                            : isRoleAdmin
                            ? 'bg-purple-600/30 text-purple-200 border-purple-400/40 font-semibold'
                            : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        }`}
                      >
                        {role}
                      </span>
                    );
                  })}
                </div>

                {/* Quick Individual Mute/Unmute Toggle */}
                <button
                  onClick={async () => {
                    soundFX.playClick();
                    if (isMuted) {
                      const res = await botApi.bulkUnmuteMembers([m.id]);
                      if (onUpdateMembers && res.updatedMembers) {
                        onUpdateMembers(res.updatedMembers);
                      }
                      showToast(`Мут снят с ${m.username}`, 'success');
                    } else {
                      const res = await botApi.bulkMuteMembers([m.id], 15, 'Быстрый мут');
                      if (onUpdateMembers && res.updatedMembers) {
                        onUpdateMembers(res.updatedMembers);
                      }
                      showToast(`${m.username} замучен на 15 мин`, 'warning');
                    }
                  }}
                  className={`p-1.5 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1 ${
                    isMuted
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                  title={isMuted ? 'Снять мут' : 'Быстрый мут на 15 минут'}
                >
                  {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Copy ID Button */}
                <CopyButton
                  textToCopy={m.id}
                  itemName={m.username}
                  prefix="ID:"
                  size="sm"
                  tooltip="Скопировать Discord User ID"
                />
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-[#131024]/40 border border-purple-500/10">
          <Users className="w-12 h-12 mx-auto text-purple-400/40 mb-3" />
          <p className="text-sm text-purple-200/60">Участники не найдены по заданным фильтрам</p>
        </div>
      )}
    </div>
  );
};
