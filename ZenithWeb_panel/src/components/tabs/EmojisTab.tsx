import React, { useState } from 'react';
import { Search, Smile, Trash2 } from 'lucide-react';
import { DiscordEmoji } from '../../types/bot';
import { soundFX } from '../../utils/sound';
import { useToast } from '../ToastContainer';
import { CopyButton } from '../common/CopyButton';
import { EmojisSkeleton } from '../common/Skeleton';

interface EmojisTabProps {
  emojis: DiscordEmoji[];
  onDeleteEmoji: (id: string) => Promise<{ success: boolean; message: string }>;
  isLoading?: boolean;
}

export const EmojisTab: React.FC<EmojisTabProps> = ({ emojis, onDeleteEmoji, isLoading = false }) => {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  if (isLoading) {
    return <EmojisSkeleton />;
  }

  const safeEmojis = Array.isArray(emojis) ? emojis : [];

  const filteredEmojis = safeEmojis.filter((e) =>
    e && e.name && e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setDeletingId(id);
    soundFX.playClick();

    const res = await onDeleteEmoji(id);
    setDeletingId(null);

    if (res.success) {
      soundFX.playSuccess();
      showToast(res.message || `Эмодзи :${name}: удален`, 'success');
    } else {
      soundFX.playError();
      showToast('Ошибка при удалении эмодзи', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Кастомные эмодзи</h2>
          <p className="text-xs text-purple-300/60 mt-0.5">
            Эмодзи первого сервера ({emojis.length} шт.)
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию эмодзи..."
            className="w-full bg-[#120f24]/80 border border-purple-500/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-purple-300/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid of emojis */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {filteredEmojis.map((emoji) => (
          <div
            key={emoji.id}
            className="relative p-4 rounded-2xl bg-[#131024]/70 border border-purple-500/20 hover:border-purple-500/50 backdrop-blur-xl transition-all hover:scale-105 hover:shadow-[0_10px_25px_rgba(168,85,247,0.2)] flex flex-col items-center justify-center text-center group"
          >
            {/* Delete button top right */}
            <button
              onClick={(e) => handleDelete(e, emoji.id, emoji.name)}
              disabled={deletingId === emoji.id}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-10"
              title="Удалить эмодзи"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Animated GIF Tag */}
            {emoji.animated && (
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-purple-500/30 text-[9px] font-bold text-purple-200 uppercase">
                GIF
              </span>
            )}

            {/* Image */}
            <div className="w-14 h-14 flex items-center justify-center my-2 group-hover:scale-110 transition-transform">
              <img
                src={emoji.url}
                alt={emoji.name}
                className="w-12 h-12 object-contain"
                loading="lazy"
              />
            </div>

            {/* Name */}
            <span className="text-xs font-semibold text-white truncate max-w-full font-mono mt-1">
              :{emoji.name}:
            </span>

            {/* Copy Button */}
            <div className="mt-2">
              <CopyButton
                textToCopy={emoji.id}
                itemName={`:${emoji.name}:`}
                prefix="ID:"
                size="sm"
                tooltip="Скопировать ID эмодзи"
              />
            </div>
          </div>
        ))}
      </div>

      {filteredEmojis.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-[#131024]/40 border border-purple-500/10">
          <Smile className="w-12 h-12 mx-auto text-purple-400/40 mb-3" />
          <p className="text-sm text-purple-200/60">Эмодзи не найдены</p>
        </div>
      )}
    </div>
  );
};
