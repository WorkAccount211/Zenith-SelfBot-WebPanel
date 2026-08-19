import React, { useState, useMemo } from 'react';
import {
  Search,
  Smile,
  Trash2,
  Download,
  CheckSquare,
  Square,
  FolderArchive,
  Layers,
  Sparkles,
  Server,
  FileDown,
  Copy,
  Check,
  CheckCircle2
} from 'lucide-react';
import JSZip from 'jszip';
import { DiscordEmoji, DiscordServer } from '../../types/bot';
import { soundFX } from '../../utils/sound';
import { useToast } from '../ToastContainer';
import { CopyButton } from '../common/CopyButton';
import { EmojisSkeleton } from '../common/Skeleton';

interface EmojisTabProps {
  emojis: DiscordEmoji[];
  servers?: DiscordServer[];
  onDeleteEmoji: (id: string) => Promise<{ success: boolean; message: string }>;
  isLoading?: boolean;
}

export const EmojisTab: React.FC<EmojisTabProps> = ({
  emojis,
  servers = [],
  onDeleteEmoji,
  isLoading = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedServerId, setSelectedServerId] = useState<string>('all');
  const [selectedEmojiIds, setSelectedEmojiIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedFormatId, setCopiedFormatId] = useState<string | null>(null);
  const { showToast } = useToast();

  const safeEmojis = Array.isArray(emojis) ? emojis : [];

  // Group and count emojis by server
  const serverStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; icon?: string }>();
    
    // Seed with known servers if available
    servers.forEach((s) => {
      map.set(s.id, { id: s.id, name: s.name, count: 0, icon: s.icon });
    });

    safeEmojis.forEach((e) => {
      const sId = e.serverId || 'other';
      const sName = e.serverName || 'Другой сервер';
      const existing = map.get(sId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(sId, { id: sId, name: sName, count: 1 });
      }
    });

    return Array.from(map.values()).filter((s) => s.count > 0 || servers.some(srv => srv.id === s.id));
  }, [safeEmojis, servers]);

  // Filter emojis by selected server and search term
  const filteredEmojis = useMemo(() => {
    return safeEmojis.filter((e) => {
      if (!e || !e.name) return false;
      const matchesServer = selectedServerId === 'all' || (e.serverId || 'other') === selectedServerId;
      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
      return matchesServer && matchesSearch;
    });
  }, [safeEmojis, selectedServerId, search]);

  // Toggle single emoji selection
  const handleToggleSelect = (emojiId: string) => {
    soundFX.playClick();
    setSelectedEmojiIds((prev) => {
      const next = new Set(prev);
      if (next.has(emojiId)) {
        next.delete(emojiId);
      } else {
        next.add(emojiId);
      }
      return next;
    });
  };

  // Select all visible emojis
  const handleSelectAll = () => {
    soundFX.playClick();
    const allFilteredIds = filteredEmojis.map((e) => e.id);
    const areAllSelected = allFilteredIds.every((id) => selectedEmojiIds.has(id));

    if (areAllSelected) {
      // Deselect visible
      setSelectedEmojiIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
      showToast('Выбор снят со всех отображаемых эмодзи', 'info');
    } else {
      // Select all visible
      setSelectedEmojiIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
      showToast(`Выбрано ${allFilteredIds.length} эмодзи`, 'success');
    }
  };

  // Download Handler (1 emoji -> direct image, >= 2 emojis -> JSZip)
  const handleDownloadSelected = async () => {
    const selectedList = safeEmojis.filter((e) => selectedEmojiIds.has(e.id));
    if (selectedList.length === 0) {
      showToast('Выберите хотя бы один эмодзи для скачивания', 'info');
      return;
    }

    setIsDownloading(true);
    soundFX.playClick();

    try {
      if (selectedList.length === 1) {
        // Single Emoji download (original format: .png / .gif / .webp / .jpg)
        const emoji = selectedList[0];
        showToast(`Скачивание эмодзи :${emoji.name}:...`, 'info');
        
        try {
          const res = await fetch(emoji.url);
          const blob = await res.blob();
          const ext = emoji.animated ? 'gif' : (emoji.url.endsWith('.webp') ? 'webp' : 'png');
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${emoji.name}.${ext}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
        } catch (fetchErr) {
          // Fallback direct open/download
          const a = document.createElement('a');
          a.href = emoji.url;
          a.download = `${emoji.name}.png`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        soundFX.playSuccess();
        showToast(`Эмодзи :${emoji.name}: успешно скачан!`, 'success');
      } else {
        // Multiple emojis (>= 2) -> Zip Archive
        showToast(`Архивирование ${selectedList.length} эмодзи в ZIP...`, 'info');
        const zip = new JSZip();
        const folder = zip.folder('emojis');

        let successCount = 0;
        await Promise.all(
          selectedList.map(async (emoji) => {
            try {
              const res = await fetch(emoji.url);
              const blob = await res.blob();
              const ext = emoji.animated ? 'gif' : 'png';
              folder?.file(`${emoji.name}_${emoji.id}.${ext}`, blob);
              successCount++;
            } catch (err) {
              console.warn(`Не удалось загрузить эмодзи ${emoji.name}:`, err);
            }
          })
        );

        const content = await zip.generateAsync({ type: 'blob' });
        const currentServer = serverStats.find((s) => s.id === selectedServerId);
        const serverNamePart = currentServer && selectedServerId !== 'all'
          ? currentServer.name.replace(/[^a-zA-Z0-9А-Яа-я_-]/g, '_')
          : 'zenith_discord';

        const zipBlobUrl = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = zipBlobUrl;
        a.download = `emojis_${serverNamePart}_(${successCount}).zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(zipBlobUrl);
        document.body.removeChild(a);

        soundFX.playSuccess();
        showToast(`Архив с ${successCount} эмодзи успешно скачан!`, 'success');
      }
    } catch (error) {
      console.error('Ошибка скачивания эмодзи:', error);
      soundFX.playError();
      showToast('Ошибка при формировании архива эмодзи', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy Discord Markdown format (<:name:id> or <a:name:id>)
  const handleCopyDiscordFormat = (e: React.MouseEvent, emoji: DiscordEmoji) => {
    e.stopPropagation();
    soundFX.playClick();
    const tag = emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
    navigator.clipboard.writeText(tag);
    setCopiedFormatId(emoji.id);
    showToast(`Скопирован Discord-тег ${tag}`, 'success');
    setTimeout(() => setCopiedFormatId(null), 2000);
  };

  // Delete handler
  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setDeletingId(id);
    soundFX.playClick();

    const res = await onDeleteEmoji(id);
    setDeletingId(null);

    if (res.success) {
      soundFX.playSuccess();
      showToast(res.message || `Эмодзи :${name}: удален`, 'success');
      setSelectedEmojiIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      soundFX.playError();
      showToast('Ошибка при удалении эмодзи', 'error');
    }
  };

  if (isLoading) {
    return <EmojisSkeleton />;
  }

  const isAllFilteredSelected =
    filteredEmojis.length > 0 && filteredEmojis.every((e) => selectedEmojiIds.has(e.id));
  const selectedCount = selectedEmojiIds.size;
  const currentServerObj = serverStats.find((s) => s.id === selectedServerId);

  return (
    <div className="space-y-6 animate-fade-in" id="emojis-management-view">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#131024]/60 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Кастомные эмодзи
              </h2>
              <p className="text-xs text-purple-300/60 mt-0.5">
                Всего доступно {safeEmojis.length} эмодзи на {serverStats.length} серверах
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Download Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Select All Toggle */}
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1538]/80 hover:bg-purple-900/40 border border-purple-500/30 text-xs font-semibold text-purple-200 transition-all active:scale-95"
            title={isAllFilteredSelected ? 'Снять выбор' : 'Выбрать все'}
          >
            {isAllFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-purple-400" />
            ) : (
              <Square className="w-4 h-4 text-purple-300/60" />
            )}
            <span>{isAllFilteredSelected ? 'Снять выбор' : 'Выбрать все'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownloadSelected}
            disabled={selectedCount === 0 || isDownloading}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold text-xs transition-all shadow-lg active:scale-95 ${
              selectedCount > 0
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30 hover:shadow-purple-700/50 cursor-pointer'
                : 'bg-purple-950/40 border border-purple-500/20 text-purple-400/40 cursor-not-allowed'
            }`}
            title={
              selectedCount >= 2
                ? `Скачать ${selectedCount} эмодзи в ZIP архиве`
                : selectedCount === 1
                ? 'Скачать 1 эмодзи'
                : 'Выберите эмодзи для скачивания'
            }
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : selectedCount >= 2 ? (
              <FolderArchive className="w-4 h-4 text-white" />
            ) : (
              <FileDown className="w-4 h-4 text-white" />
            )}
            <span>
              {isDownloading
                ? 'Скачивание...'
                : selectedCount >= 2
                ? `Скачать эмодзи (${selectedCount} шт. ZIP)`
                : selectedCount === 1
                ? 'Скачать эмодзи (1 шт.)'
                : 'Скачать эмодзи'}
            </span>
          </button>
        </div>
      </div>

      {/* Server Filter Navigation Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-300/80 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            Разделение по серверам
          </span>
          <span className="text-xs text-purple-400/80 font-mono tabular-nums">
            {selectedServerId === 'all'
              ? `Все серверы (${filteredEmojis.length})`
              : `${currentServerObj?.name || 'Сервер'} (${filteredEmojis.length})`}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
          {/* All Servers Pill */}
          <button
            onClick={() => {
              soundFX.playClick();
              setSelectedServerId('all');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
              selectedServerId === 'all'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40'
                : 'bg-[#120f24]/70 hover:bg-[#1b153a] text-purple-200/80 border-purple-500/20 hover:border-purple-500/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Все серверы</span>
            <span className="min-w-[24px] h-[18px] inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-purple-950/70 border border-purple-400/30 text-[10px] font-mono font-bold tabular-nums text-purple-200">
              {safeEmojis.length}
            </span>
          </button>

          {/* Individual Server Buttons */}
          {serverStats.map((srv) => {
            const isSelected = selectedServerId === srv.id;
            return (
              <button
                key={srv.id}
                onClick={() => {
                  soundFX.playClick();
                  setSelectedServerId(srv.id);
                }}
                className={`flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40'
                    : 'bg-[#120f24]/70 hover:bg-[#1b153a] text-purple-200/80 border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                {srv.icon ? (
                  <img
                    src={srv.icon}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-300 shrink-0">
                    {srv.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[120px] sm:max-w-[150px] truncate">{srv.name}</span>
                <span
                  className={`min-w-[24px] h-[18px] inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums border ${
                    isSelected
                      ? 'bg-purple-950/80 text-purple-200 border-purple-400/40'
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                  }`}
                >
                  {srv.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Selection Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск эмодзи по названию..."
            className="w-full bg-[#120f24]/80 border border-purple-500/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-purple-300/40 outline-none transition-all"
          />
        </div>

        {/* Selection Summary */}
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-semibold text-purple-300">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>
                Выбрано: <strong className="text-white font-mono">{selectedCount}</strong>
              </span>
              <button
                onClick={() => setSelectedEmojiIds(new Set())}
                className="text-purple-400 hover:text-purple-200 underline ml-1 text-[11px]"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Emojis with Selection & Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {filteredEmojis.map((emoji) => {
          const isSelected = selectedEmojiIds.has(emoji.id);

          return (
            <div
              key={emoji.id}
              onClick={() => handleToggleSelect(emoji.id)}
              className={`relative p-3.5 rounded-2xl backdrop-blur-xl transition-all cursor-pointer flex flex-col items-center justify-between text-center group select-none ${
                isSelected
                  ? 'bg-purple-900/40 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.03]'
                  : 'bg-[#131024]/70 border border-purple-500/20 hover:border-purple-500/50 hover:scale-[1.02] hover:bg-[#181333]'
              }`}
            >
              {/* Selection Checkbox Pill (Top Left) */}
              <div
                className={`absolute top-2 left-2 p-1 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-[#1a1438]/80 text-purple-400/40 opacity-0 group-hover:opacity-100'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              {/* Action Buttons Top Right (Delete & Copy Markdown Tag) */}
              <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                {/* Copy Discord Format <:name:id> */}
                <button
                  onClick={(e) => handleCopyDiscordFormat(e, emoji)}
                  className={`p-1.5 rounded-lg transition-all ${
                    copiedFormatId === emoji.id
                      ? 'bg-emerald-500 text-white opacity-100'
                      : 'bg-purple-900/80 hover:bg-purple-600 text-purple-200 opacity-80 sm:opacity-0 group-hover:opacity-100'
                  }`}
                  title="Скопировать Discord-код <:имя:id>"
                >
                  {copiedFormatId === emoji.id ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, emoji.id, emoji.name)}
                  disabled={deletingId === emoji.id}
                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all"
                  title="Удалить эмодзи"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Animated GIF Tag */}
              {emoji.animated && (
                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-purple-500/40 text-[9px] font-bold text-purple-200 uppercase tracking-wider">
                  GIF
                </span>
              )}

              {/* Image Container */}
              <div className="w-14 h-14 flex items-center justify-center my-2 group-hover:scale-110 transition-transform">
                <img
                  src={emoji.url}
                  alt={emoji.name}
                  className="w-12 h-12 object-contain filter drop-shadow-md"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Emoji Name & Server Info */}
              <div className="w-full mt-1">
                <span className="text-xs font-semibold text-white truncate block font-mono">
                  :{emoji.name}:
                </span>
                <span className="text-[10px] text-purple-300/50 truncate block mt-0.5">
                  {emoji.serverName || 'Сервер'}
                </span>
              </div>

              {/* Copy ID Button */}
              <div className="mt-2.5 pt-2 border-t border-purple-500/10 w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
                <CopyButton
                  textToCopy={emoji.id}
                  itemName={`:${emoji.name}:`}
                  prefix="ID:"
                  size="sm"
                  tooltip="Скопировать ID эмодзи"
                />
              </div>
            </div>
          );
        })}
      </div>

      {filteredEmojis.length === 0 && (
        <div className="text-center py-16 rounded-2xl bg-[#131024]/40 border border-purple-500/10">
          <Smile className="w-12 h-12 mx-auto text-purple-400/40 mb-3" />
          <p className="text-sm font-semibold text-white">Эмодзи не найдены</p>
          <p className="text-xs text-purple-300/50 mt-1">
            Попробуйте изменить поисковый запрос или выбрать другой сервер
          </p>
        </div>
      )}
    </div>
  );
};
