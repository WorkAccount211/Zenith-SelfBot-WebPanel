import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Terminal,
  Send,
  UserCheck,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  CornerDownLeft,
  Sparkles,
  Zap,
  RotateCcw,
  Shuffle,
  Play,
  Pause,
  Plus,
  BookmarkPlus,
  Edit2,
  Settings,
  X,
  Layers,
  Search,
  ChevronRight,
  ChevronLeft,
  Shield,
  Gamepad2,
  Type,
  Wrench,
  Eye,
  Star,
  Clock,
  Radio,
  Tv,
  Video,
  Flame
} from 'lucide-react';
import { soundFX } from '../../utils/sound';
import { useToast } from '../ToastContainer';
import { CommandCatalogEntry, CommandHistoryItem, CommandPreset } from '../../types/bot';
import { FULL_UI_COMMANDS_CATALOG } from '../../data/commandsData';

interface CommandsTabProps {
  onExecuteCommand: (cmd: string) => Promise<{ success: boolean; response: string; executionTimeMs: number }>;
  onChangeNick: (nick: string) => Promise<{ success: boolean; message: string }>;
  onChangeStream?: (title: string) => Promise<{ success: boolean; message: string; title?: string }>;
  onClearStream?: () => Promise<{ success: boolean; message: string }>;
  onSendMessage: (text: string, channelId?: string) => Promise<{ success: boolean; message: string }>;
  defaultChannelId: string;
  currentNickname?: string;
  commandCatalog?: CommandCatalogEntry[];
}

const DEFAULT_PRESETS: CommandPreset[] = [
  { id: 'p1', label: 'Пинг (.ping)', command: '.ping', category: 'utility', description: 'Проверка задержки и пинга Gateway' },
  { id: 'p2', label: 'Очистить 10 (.purge 10)', command: '.purge 10', category: 'moderation', description: 'Быстрое удаление последних 10 сообщений' },
  { id: 'p3', label: 'Очистить 50 (.purge 50)', command: '.purge 50', category: 'moderation', description: 'Удалить последние 50 сообщений в чате' },
  { id: 'p4', label: 'Статус: Онлайн (.status online)', command: '.status online', category: 'status', description: 'Установить статус "В сети"' },
  { id: 'p5', label: 'Статус: Не беспокоить (.status dnd)', command: '.status dnd', category: 'status', description: 'Установить статус "Не беспокоить"' },
  { id: 'p6', label: 'AFK режим (.afk on)', command: '.afk on', category: 'utility', description: 'Включить автоответчик AFK' },
  { id: 'p7', label: 'Крипта курсы (.crypto)', command: '.crypto', category: 'fun', description: 'Биржевые курсы BTC/ETH/TON/SOL' },
  { id: 'p8', label: 'Стрим Twitch (.stream Zenith)', command: '.stream Zenith', category: 'status', description: 'Установить статус стриминга' },
  { id: 'p9', label: 'Справка (.help)', command: '.help', category: 'utility', description: 'Вывести список всех 210 команд бота' },
];

const DEFAULT_NICKNAMES = ['zovlender', 'zlodey', 'krutoi', 'shadow_lord', 'cyber_punk', 'night_stalker', 'zenith_god'];

const CATEGORY_ICONS: Record<string, any> = {
  'all': Layers,
  'Игры & Казино': Gamepad2,
  'Текст & Шрифты': Type,
  'Утилиты': Wrench,
  'OSINT & Данные': Eye,
  'Модерация': Shield,
  'Уникальные': Star
};

export const CommandsTab: React.FC<CommandsTabProps> = ({
  onExecuteCommand,
  onChangeNick,
  onChangeStream,
  onClearStream,
  onSendMessage,
  defaultChannelId,
  currentNickname = 'ShadowWalker',
  commandCatalog = []
}) => {
  const { showToast } = useToast();

  // Command Runner State
  const [commandInput, setCommandInput] = useState('');
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [executingPresetId, setExecutingPresetId] = useState<string | null>(null);
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: 'init-1',
      command: '.help',
      timestamp: new Date().toLocaleTimeString(),
      status: 'success',
      response: '⚡ Zenith Self-Bot Enterprise Core готов. Загружено 210 команд в 6 модулях.',
      executionTimeMs: 24
    }
  ]);

  // Catalog Browser State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('all');
  const [catalogPage, setCatalogPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Command Presets State
  const [presets, setPresets] = useState<CommandPreset[]>(() => {
    const saved = localStorage.getItem('discord_bot_command_presets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_PRESETS;
  });
  const [presetCategory, setPresetCategory] = useState<string>('all');
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetCmd, setNewPresetCmd] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<'utility' | 'moderation' | 'fun' | 'status' | 'custom'>('custom');

  // Nickname State & Rotator
  const [nickInput, setNickInput] = useState('');
  const [isSavingNick, setIsSavingNick] = useState(false);
  const [originalNick, setOriginalNick] = useState<string>(() => {
    return localStorage.getItem('discord_bot_original_nickname') || currentNickname || 'ShadowWalker';
  });
  const [isEditingOriginalNick, setIsEditingOriginalNick] = useState(false);
  const [customOriginalNickInput, setCustomOriginalNickInput] = useState(originalNick);

  const [rotationNicks, setRotationNicks] = useState<string[]>(() => {
    const saved = localStorage.getItem('discord_bot_rotation_nicks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_NICKNAMES;
  });
  const [newNickToAdd, setNewNickToAdd] = useState('');
  const [isRotatorActive, setIsRotatorActive] = useState(false);
  const [rotatorMode, setRotatorMode] = useState<'sequential' | 'random'>('sequential');
  const [rotationInterval, setRotationInterval] = useState<number>(10);
  const [countdown, setCountdown] = useState<number>(10);
  const [activeNickBadge, setActiveNickBadge] = useState<string>(currentNickname);

  // Streamroll state (.streamroll)
  const [streamInput, setStreamInput] = useState('');
  const [activeStreamTitle, setActiveStreamTitle] = useState('🔴 LIVE: Zenith Self-Bot v2.5 Enterprise');
  const [isSavingStream, setIsSavingStream] = useState(false);
  const [isClearingStream, setIsClearingStream] = useState(false);
  const [streamPresets, setStreamPresets] = useState<string[]>(() => {
    const saved = localStorage.getItem('discord_bot_stream_presets');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [
      '🔴 LIVE: Zenith Self-Bot v2.5 Enterprise',
      '🎮 Cyberpunk 2077 // Night City Run',
      '⚡ Developing Zenith Web-Panel 2026',
      '🏆 Ranked Overlord Stream',
      '💎 High-Performance Discord Systems',
      '🎧 Chill & Synthwave Beats Live'
    ];
  });
  const [newStreamPreset, setNewStreamPreset] = useState('');
  const [isStreamRotatorActive, setIsStreamRotatorActive] = useState(false);
  const [streamRotatorMode, setStreamRotatorMode] = useState<'sequential' | 'random'>('sequential');
  const [streamRotationInterval, setStreamRotationInterval] = useState<number>(15);
  const [streamCountdown, setStreamCountdown] = useState<number>(15);
  const streamIndexRef = useRef(0);
  const streamRotatorTimerRef = useRef<any>(null);
  const streamCountdownTimerRef = useRef<any>(null);

  // Send Message State
  const [targetChannel, setTargetChannel] = useState(defaultChannelId || '');
  const [messageText, setMessageText] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rotator references
  const rotIndexRef = useRef(0);
  const rotatorTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  // Full merged catalog
  const fullCatalogList = useMemo(() => {
    if (commandCatalog && commandCatalog.length >= 50) {
      return commandCatalog;
    }
    return FULL_UI_COMMANDS_CATALOG;
  }, [commandCatalog]);

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    return fullCatalogList.filter((item) => {
      const matchesCategory = selectedCatalogCategory === 'all' || item.category === selectedCatalogCategory;
      const q = catalogSearch.toLowerCase().trim();
      if (!q) return matchesCategory;
      const matchesName = item.name.toLowerCase().includes(q) || item.full_name?.toLowerCase().includes(q);
      const matchesDesc = item.description.toLowerCase().includes(q);
      const matchesUsage = item.usage?.toLowerCase().includes(q);
      return matchesCategory && (matchesName || matchesDesc || matchesUsage);
    });
  }, [fullCatalogList, selectedCatalogCategory, catalogSearch]);

  const totalPages = Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE) || 1;
  const paginatedCatalog = useMemo(() => {
    const start = (catalogPage - 1) * ITEMS_PER_PAGE;
    return filteredCatalog.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCatalog, catalogPage]);

  // Reset page on search or category change
  useEffect(() => {
    setCatalogPage(1);
  }, [catalogSearch, selectedCatalogCategory]);

  // Persist Presets & Nicks
  useEffect(() => {
    localStorage.setItem('discord_bot_command_presets', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('discord_bot_rotation_nicks', JSON.stringify(rotationNicks));
  }, [rotationNicks]);

  useEffect(() => {
    localStorage.setItem('discord_bot_original_nickname', originalNick);
  }, [originalNick]);

  // Persist stream presets
  useEffect(() => {
    localStorage.setItem('discord_bot_stream_presets', JSON.stringify(streamPresets));
  }, [streamPresets]);

  useEffect(() => {
    if (defaultChannelId && !targetChannel) {
      setTargetChannel(defaultChannelId);
    }
  }, [defaultChannelId]);

  // Nickname Rotator engine
  useEffect(() => {
    if (!isRotatorActive || rotationNicks.length === 0) {
      if (rotatorTimerRef.current) clearInterval(rotatorTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    setCountdown(rotationInterval);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : rotationInterval));
    }, 1000);

    rotatorTimerRef.current = setInterval(async () => {
      if (rotationNicks.length === 0) return;
      let nextNick = '';
      if (rotatorMode === 'sequential') {
        rotIndexRef.current = (rotIndexRef.current + 1) % rotationNicks.length;
        nextNick = rotationNicks[rotIndexRef.current];
      } else {
        const randIdx = Math.floor(Math.random() * rotationNicks.length);
        rotIndexRef.current = randIdx;
        nextNick = rotationNicks[randIdx];
      }

      setActiveNickBadge(nextNick);
      const res = await onChangeNick(nextNick);
      if (res.success) {
        soundFX.playSuccess();
        showToast(`Ротатор: никнейм изменен на "${nextNick}"`, 'info');
      }
    }, rotationInterval * 1000);

    return () => {
      if (rotatorTimerRef.current) clearInterval(rotatorTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isRotatorActive, rotationInterval, rotatorMode, rotationNicks, onChangeNick]);

// Stream Rotator engine (исправленный)
useEffect(() => {
  // Очищаем старые таймеры при остановке или изменении настроек
  if (streamRotatorTimerRef.current) {
    clearInterval(streamRotatorTimerRef.current);
    streamRotatorTimerRef.current = null;
  }
  if (streamCountdownTimerRef.current) {
    clearInterval(streamCountdownTimerRef.current);
    streamCountdownTimerRef.current = null;
  }

  if (!isStreamRotatorActive || streamPresets.length === 0) {
    return;
  }

  // Устанавливаем начальный счётчик
  setStreamCountdown(streamRotationInterval);

  // Единый интервал: каждую секунду обновляем счётчик и при достижении 0 меняем стрим
  const timer = setInterval(() => {
    setStreamCountdown((prev) => {
      const newVal = prev - 1;
      if (newVal <= 0) {
        // Пора менять стрим
        const nextTitle = (() => {
          if (streamRotatorMode === 'sequential') {
            streamIndexRef.current = (streamIndexRef.current + 1) % streamPresets.length;
            return streamPresets[streamIndexRef.current];
          } else {
            const randIdx = Math.floor(Math.random() * streamPresets.length);
            streamIndexRef.current = randIdx;
            return streamPresets[randIdx];
          }
        })();

        setActiveStreamTitle(nextTitle);
        if (onChangeStream) {
          onChangeStream(nextTitle).catch(() => {});
        } else {
          onExecuteCommand(`.streamroll ${nextTitle}`).catch(() => {});
        }
        soundFX.playSuccess();
        showToast(`Ротатор стрима: «${nextTitle}»`, 'info');

        // Возвращаем интервал для следующего цикла
        return streamRotationInterval;
      }
      return newVal;
    });
  }, 1000);

  // Сохраняем ссылку на таймер (можно использовать одну переменную)
  streamRotatorTimerRef.current = timer;

  return () => {
    if (streamRotatorTimerRef.current) {
      clearInterval(streamRotatorTimerRef.current);
      streamRotatorTimerRef.current = null;
    }
  };
}, [isStreamRotatorActive, streamRotationInterval, streamRotatorMode, streamPresets, onChangeStream, onExecuteCommand]);

  // Execute Command
  const handleExecute = async (cmdToRun?: string, presetId?: string) => {
    const cmd = (cmdToRun || commandInput).trim();
    if (!cmd) return;

    if (presetId) setExecutingPresetId(presetId);
    setIsExecutingCmd(true);
    soundFX.playClick();

    const startTs = Date.now();
    const res = await onExecuteCommand(cmd);
    const timeMs = res.executionTimeMs || Math.round(Date.now() - startTs);

    const historyEntry: CommandHistoryItem = {
      id: `cmd-${Date.now()}`,
      command: cmd,
      timestamp: new Date().toLocaleTimeString(),
      status: res.success ? 'success' : 'error',
      response: res.response || (res.success ? 'Команда успешно выполнена' : 'Ошибка выполнения'),
      executionTimeMs: timeMs
    };

    setHistory((prev) => [historyEntry, ...prev.slice(0, 49)]);
    setIsExecutingCmd(false);
    setExecutingPresetId(null);

    if (res.success) {
      soundFX.playSuccess();
      showToast(`Выполнено: ${cmd} (${timeMs}ms)`, 'success');
      if (!cmdToRun) setCommandInput('');
    } else {
      soundFX.playError();
      showToast(`Ошибка команды: ${cmd}`, 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleExecute();
    }
  };

  // Preset Handlers
  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetLabel.trim() || !newPresetCmd.trim()) return;

    const newPreset: CommandPreset = {
      id: `preset-${Date.now()}`,
      label: newPresetLabel.trim(),
      command: newPresetCmd.trim(),
      description: newPresetDesc.trim() || undefined,
      category: newPresetCategory
    };

    setPresets((prev) => [newPreset, ...prev]);
    setNewPresetLabel('');
    setNewPresetCmd('');
    setNewPresetDesc('');
    setIsAddingPreset(false);
    soundFX.playSuccess();
    showToast(`Шаблон "${newPreset.label}" сохранен`, 'success');
  };

  const handleDeletePreset = (id: string, label: string) => {
    soundFX.playClick();
    setPresets((prev) => prev.filter((p) => p.id !== id));
    showToast(`Шаблон "${label}" удален`, 'info');
  };

  // Nickname Handlers
  const handleNickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickInput.trim()) return;

    setIsSavingNick(true);
    soundFX.playClick();
    const newNick = nickInput.trim();
    const res = await onChangeNick(newNick);
    setIsSavingNick(false);

    if (res.success) {
      setActiveNickBadge(newNick);
      soundFX.playSuccess();
      showToast(`Никнейм изменен на "${newNick}"`, 'success');
      setNickInput('');
    } else {
      soundFX.playError();
      showToast('Ошибка при смене никнейма', 'error');
    }
  };

  const handleResetNick = async () => {
    if (!originalNick.trim()) return;
    setIsSavingNick(true);
    soundFX.playClick();
    const res = await onChangeNick(originalNick);
    setIsSavingNick(false);

    if (res.success) {
      setActiveNickBadge(originalNick);
      soundFX.playSuccess();
      showToast(`Никнейм успешно сброшен на "${originalNick}"`, 'success');
    } else {
      soundFX.playError();
      showToast('Не удалось сбросить никнейм', 'error');
    }
  };

  const handleSaveOriginalNick = () => {
    if (!customOriginalNickInput.trim()) return;
    setOriginalNick(customOriginalNickInput.trim());
    setIsEditingOriginalNick(false);
    soundFX.playSuccess();
    showToast(`Изначальный ник установлен на "${customOriginalNickInput.trim()}"`, 'success');
  };

  const handleAddRotationNick = () => {
    const nick = newNickToAdd.trim();
    if (!nick) return;
    if (rotationNicks.includes(nick)) {
      showToast('Этот никнейм уже есть в списке', 'warning');
      return;
    }
    setRotationNicks((prev) => [...prev, nick]);
    setNewNickToAdd('');
    soundFX.playSuccess();
    showToast(`Ник "${nick}" добавлен в пул ротации`, 'success');
  };

  const handleRemoveRotationNick = (nick: string) => {
    if (rotationNicks.length <= 1) {
      showToast('В списке должен оставаться хотя бы 1 никнейм', 'warning');
      return;
    }
    setRotationNicks((prev) => prev.filter((n) => n !== nick));
    soundFX.playClick();
    showToast(`Ник "${nick}" удален из пула`, 'info');
  };

  const handlePickRandomNick = async () => {
    if (rotationNicks.length === 0) return;
    setIsSavingNick(true);
    soundFX.playClick();

    let randIdx = 0;
    if (rotationNicks.length > 1) {
      const currentIdx = rotationNicks.indexOf(activeNickBadge);
      do {
        randIdx = Math.floor(Math.random() * rotationNicks.length);
      } while (randIdx === currentIdx && rotationNicks.length > 1);
    }
    const randomNick = rotationNicks[randIdx];
    rotIndexRef.current = randIdx;
    setActiveNickBadge(randomNick);

    const res = await onChangeNick(randomNick);
    setIsSavingNick(false);

    if (res.success) {
      soundFX.playSuccess();
      showToast(`Рандомайзер: выбран ник "${randomNick}"`, 'success');
    } else {
      soundFX.playError();
      showToast('Ошибка при смене никнейма', 'error');
    }
  };

  const handleSelectNickPill = async (nick: string, idx: number) => {
    if (isSavingNick || activeNickBadge === nick) return;
    setIsSavingNick(true);
    soundFX.playClick();
    rotIndexRef.current = idx;
    setActiveNickBadge(nick);
    const res = await onChangeNick(nick);
    setIsSavingNick(false);
    if (res.success) {
      soundFX.playSuccess();
      showToast(`Никнейм изменен на "${nick}"`, 'success');
    }
  };

  // Streamroll handlers (.streamroll)
  const handleStreamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamInput.trim()) return;
    setIsSavingStream(true);
    soundFX.playClick();
    const title = streamInput.trim();
    if (onChangeStream) {
      const res = await onChangeStream(title);
      if (res.success) {
        setActiveStreamTitle(title);
        soundFX.playSuccess();
        showToast(`Статус стрима установлен: «${title}»`, 'success');
        setStreamInput('');
      } else {
        soundFX.playError();
        showToast('Ошибка при обновлении стрима', 'error');
      }
    } else {
      await onExecuteCommand(`.streamroll ${title}`);
      setActiveStreamTitle(title);
      soundFX.playSuccess();
      showToast(`Команда .streamroll отправлена: «${title}»`, 'success');
      setStreamInput('');
    }
    setIsSavingStream(false);
  };

  const handleRollRandomStream = async () => {
    setIsSavingStream(true);
    soundFX.playClick();
    const rand = streamPresets[Math.floor(Math.random() * streamPresets.length)];
    if (onChangeStream) {
      await onChangeStream(rand);
    } else {
      await onExecuteCommand(`.streamroll ${rand}`);
    }
    setActiveStreamTitle(rand);
    setIsSavingStream(false);
    soundFX.playSuccess();
    showToast(`Ролл стрима: «${rand}»`, 'success');
  };

  const handleSelectStreamPreset = async (preset: string) => {
    if (isSavingStream) return;
    setIsSavingStream(true);
    soundFX.playClick();
    if (onChangeStream) {
      await onChangeStream(preset);
    } else {
      await onExecuteCommand(`.streamroll ${preset}`);
    }
    setActiveStreamTitle(preset);
    setIsSavingStream(false);
    soundFX.playSuccess();
    showToast(`Стрим статус: «${preset}»`, 'success');
  };

  const handleClearStream = async () => {
    if (!onClearStream) {
      showToast('Очистка стрима не поддерживается', 'warning');
      return;
    }
    setIsClearingStream(true);
    soundFX.playClick();
    try {
      const res = await onClearStream();
      if (res.success) {
        setActiveStreamTitle('(нет активного стрима)');
        soundFX.playSuccess();
        showToast('Стрим-статус удалён', 'success');
      } else {
        soundFX.playError();
        showToast('Не удалось очистить стрим', 'error');
      }
    } catch {
      soundFX.playError();
      showToast('Ошибка при очистке стрима', 'error');
    } finally {
      setIsClearingStream(false);
    }
  };

  const handleAddStreamPreset = () => {
    const title = newStreamPreset.trim();
    if (!title) return;
    if (streamPresets.includes(title)) {
      showToast('Такой пресет уже существует', 'warning');
      return;
    }
    setStreamPresets((prev) => [...prev, title]);
    setNewStreamPreset('');
    soundFX.playSuccess();
    showToast(`Пресет «${title}» добавлен`, 'success');
  };

  const handleRemoveStreamPreset = (title: string) => {
    setStreamPresets((prev) => prev.filter((t) => t !== title));
    soundFX.playClick();
    showToast(`Пресет «${title}» удалён`, 'info');
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSendingMsg(true);
    soundFX.playClick();
    const res = await onSendMessage(messageText.trim(), targetChannel.trim());
    setIsSendingMsg(false);

    if (res.success) {
      soundFX.playSuccess();
      showToast(res.message, 'success');
      setMessageText('');
    } else {
      soundFX.playError();
      showToast('Ошибка при отправке сообщения', 'error');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundFX.playClick();
    showToast('Скопировано в буфер', 'info');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const categories = ['all', 'Игры & Казино', 'Текст & Шрифты', 'Утилиты', 'OSINT & Данные', 'Модерация', 'Уникальные'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Left Column: Command Runner, 210-Command Explorer, Presets, Nickname Manager, Message Sender (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Main Command Runner Card */}
        <div className="p-6 rounded-2xl bg-[#131024]/80 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Выполнить команду бота</h3>
                <p className="text-xs text-purple-300/60">
                  Мгновенная отправка команды в Discord WebSocket/REST шлюз
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-purple-400/80 bg-purple-950/40 px-2 py-1 rounded border border-purple-500/20">
              <CornerDownLeft className="w-3 h-3" /> Enter / Ctrl+Enter
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите команду (.purge 10, .blackjack 500, .ansibox green Текст, .crypto)..."
                className="w-full bg-[#090812]/90 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-purple-300/30 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => handleExecute()}
              disabled={isExecutingCmd || !commandInput.trim()}
              className="px-5 py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_15px_rgba(147,51,234,0.3)] flex items-center gap-2 shrink-0"
            >
              {isExecutingCmd && !executingPresetId ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Выполнить</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 210-COMMANDS INTERACTIVE BROWSER & CATALOG */}
        <div className="p-6 rounded-2xl bg-[#131024]/80 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-300">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Интерактивный каталог команд</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {fullCatalogList.length} команд
                  </span>
                </div>
                <p className="text-xs text-purple-300/60">
                  Кликните по команде для быстрой вставки или запуска
                </p>
              </div>
            </div>

            {/* Catalog Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Поиск по 210 командам..."
                className="w-full bg-[#090812] border border-purple-500/30 focus:border-purple-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-purple-300/30 outline-none"
              />
              {catalogSearch && (
                <button
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Layers;
              const count = cat === 'all' 
                ? fullCatalogList.length 
                : fullCatalogList.filter(c => c.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => {
                    soundFX.playClick();
                    setSelectedCatalogCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selectedCatalogCategory === cat
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                      : 'bg-white/[0.03] text-purple-300/70 hover:text-white hover:bg-white/[0.06] border border-purple-500/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat === 'all' ? 'Все команды' : cat}</span>
                  <span className="text-[10px] font-mono opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Catalog Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-h-[360px]">
            {paginatedCatalog.map((item) => (
              <div
                key={item.name}
                className="p-3 rounded-xl border border-purple-500/20 bg-[#090812]/80 hover:border-purple-400/50 hover:bg-purple-500/[0.05] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-sm font-bold text-violet-200 group-hover:text-purple-300 transition-colors">
                      {item.full_name || `.${item.name}`}
                    </span>
                    <span className="text-[10px] font-semibold text-purple-400/80 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/20">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300/70 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                  {item.usage && (
                    <div className="mt-1.5 text-[10px] font-mono text-purple-400/60 bg-white/[0.02] px-2 py-0.5 rounded truncate border border-purple-500/10">
                      {item.usage}
                    </div>
                  )}
                </div>

                {/* Actions: Insert / Execute */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-purple-500/10">
                  <button
                    onClick={() => {
                      setCommandInput(item.usage || item.full_name || `.${item.name}`);
                      soundFX.playClick();
                      showToast(`Команда «${item.name}» вставлена в поле ввода`, 'info');
                    }}
                    className="flex-1 py-1 px-2 rounded-lg text-[11px] font-medium text-purple-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-purple-500/20 transition-colors flex items-center justify-center gap-1"
                    title="Вставить в строку ввода"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Вставить</span>
                  </button>

                  <button
                    onClick={() => handleExecute(item.full_name || `.${item.name}`)}
                    disabled={isExecutingCmd}
                    className="py-1 px-2.5 rounded-lg text-[11px] font-bold text-white bg-purple-600/40 hover:bg-purple-600 border border-purple-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-40"
                    title="Запустить мгновенно"
                  >
                    <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>Старт</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Catalog Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-purple-500/10">
              <span className="text-xs text-purple-300/60 font-mono">
                Страница {catalogPage} из {totalPages} ({filteredCatalog.length} совпадений)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                  disabled={catalogPage === 1}
                  className="p-1.5 rounded-lg text-purple-300 hover:text-white bg-white/[0.04] disabled:opacity-30 transition-all border border-purple-500/20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-bold text-white font-mono">{catalogPage}</span>
                <button
                  onClick={() => setCatalogPage((p) => Math.min(totalPages, p + 1))}
                  disabled={catalogPage === totalPages}
                  className="p-1.5 rounded-lg text-purple-300 hover:text-white bg-white/[0.04] disabled:opacity-30 transition-all border border-purple-500/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Command Presets Feature (Шаблоны команд в один клик) */}
        <div className="p-6 rounded-2xl bg-[#131024]/80 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <BookmarkPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Шаблоны команд (Presets)</h3>
                <p className="text-xs text-purple-300/60">
                  Сохраняйте частые команды для запуска в 1 клик
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundFX.playClick();
                setIsAddingPreset(!isAddingPreset);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-200 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 transition-all self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingPreset ? 'Закрыть форму' : 'Добавить шаблон'}</span>
            </button>
          </div>

          {/* Add Preset Form (Collapsible) */}
          {isAddingPreset && (
            <form
              onSubmit={handleAddPreset}
              className="p-4 rounded-xl bg-[#090812]/90 border border-purple-500/40 space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Создать новый пресет
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingPreset(false)}
                  className="text-purple-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-purple-300/70 block mb-1">Название шаблона:</label>
                  <input
                    type="text"
                    value={newPresetLabel}
                    onChange={(e) => setNewPresetLabel(e.target.value)}
                    placeholder="Напр: Очистить 25 сообщений"
                    className="w-full bg-[#131024] border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white placeholder-purple-300/30 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-purple-300/70 block mb-1">Команда для запуска:</label>
                  <input
                    type="text"
                    value={newPresetCmd}
                    onChange={(e) => setNewPresetCmd(e.target.value)}
                    placeholder="Напр: .purge 25 или .status idle"
                    className="w-full bg-[#131024] border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-purple-300/30 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-purple-300/70 block mb-1">Описание (необязательно):</label>
                  <input
                    type="text"
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                    placeholder="Для чего предназначена команда..."
                    className="w-full bg-[#131024] border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white placeholder-purple-300/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-purple-300/70 block mb-1">Категория:</label>
                  <select
                    value={newPresetCategory}
                    onChange={(e) => setNewPresetCategory(e.target.value as any)}
                    className="w-full bg-[#131024] border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="custom">Кастомные</option>
                    <option value="moderation">Модерация</option>
                    <option value="utility">Утилиты</option>
                    <option value="status">Статус</option>
                    <option value="fun">Развлечения</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingPreset(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-purple-300 hover:text-white bg-white/[0.03] transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                >
                  Сохранить пресет
                </button>
              </div>
            </form>
          )}

          {/* Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {presets.map((preset) => {
              const isRunning = executingPresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/[0.04] transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-white truncate">
                          {preset.label}
                        </span>
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/20">
                          {preset.command}
                        </span>
                      </div>
                      {preset.description && (
                        <p className="text-[11px] text-purple-300/60 mt-0.5 line-clamp-1">
                          {preset.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeletePreset(preset.id, preset.label)}
                      className="text-purple-400/40 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Удалить пресет"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Action Buttons: 1-Click Run & Insert */}
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-purple-500/10">
                    <button
                      onClick={() => handleExecute(preset.command, preset.id)}
                      disabled={isExecutingCmd}
                      className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(168,85,247,0.2)]"
                    >
                      {isRunning ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>1-Клик Запуск</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setCommandInput(preset.command);
                        soundFX.playClick();
                        showToast(`Команда "${preset.command}" вставлена в поле ввода`, 'info');
                      }}
                      className="py-1.5 px-2 rounded-lg text-xs text-purple-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-purple-500/20 transition-colors"
                      title="Вставить в поле ввода"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change Nickname & Randomizer & Rotator Card */}
        <div className="p-6 rounded-2xl bg-[#131024]/80 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Смена никнейма и Ротатор</h4>
                <p className="text-xs text-purple-300/60">
                  Ручная смена, сброс на изначальный и циклический рандомайзер
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090812] border border-purple-500/30 self-start sm:self-auto">
              <span className="text-[11px] text-purple-300/70">Активный:</span>
              <span className="text-xs font-mono font-bold text-purple-200">{activeNickBadge}</span>
            </div>
          </div>

          <form onSubmit={handleNickSubmit} className="space-y-3 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={nickInput}
                onChange={(e) => setNickInput(e.target.value)}
                placeholder="Новый никнейм..."
                className="flex-1 bg-[#0a0814]/90 border border-purple-500/30 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-300/30 outline-none"
              />
              <button
                type="submit"
                disabled={isSavingNick || !nickInput.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 border border-purple-500/40 transition-all disabled:opacity-50 shrink-0"
              >
                {isSavingNick ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Сохранить ник</span>
                )}
              </button>
            </div>
          </form>

          {/* Reset Nickname & Configure Original Nick Row */}
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetNick}
                disabled={isSavingNick}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all hover:scale-105"
                title="Вернуть исходный никнейм"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ресет никнейма ({originalNick})</span>
              </button>

              <button
                onClick={() => setIsEditingOriginalNick(!isEditingOriginalNick)}
                className="p-2 text-purple-400/70 hover:text-white rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-purple-500/20 transition-colors"
                title="Изменить изначальный ник"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handlePickRandomNick}
              disabled={isSavingNick || rotationNicks.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all hover:scale-105"
              title="Выбрать один случайный ник из списка прямо сейчас"
            >
              <Shuffle className="w-3.5 h-3.5 text-purple-300" />
              <span>Случайный ник сейчас</span>
            </button>
          </div>

          {isEditingOriginalNick && (
            <div className="p-3 rounded-xl bg-[#090812] border border-purple-500/30 flex items-center gap-2 animate-fade-in">
              <span className="text-[11px] text-purple-300/70 shrink-0">Изначальный ник:</span>
              <input
                type="text"
                value={customOriginalNickInput}
                onChange={(e) => setCustomOriginalNickInput(e.target.value)}
                className="flex-1 bg-[#131024] border border-purple-500/20 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-purple-400"
              />
              <button
                onClick={handleSaveOriginalNick}
                className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
              >
                ОК
              </button>
            </div>
          )}

          {/* Nickname Rotator & Randomizer Settings */}
          <div className="p-4 rounded-xl bg-[#090812]/90 border border-purple-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white text-xs">
                  Циклический ротатор никнеймов
                </span>
              </div>

              <button
                onClick={() => {
                  soundFX.playClick();
                  const willBeActive = !isRotatorActive;
                  setIsRotatorActive(willBeActive);
                  showToast(
                    willBeActive
                      ? `Авто-ротация запущена (каждые ${rotationInterval}с)`
                      : 'Авто-ротация остановлена',
                    willBeActive ? 'success' : 'info'
                  );
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isRotatorActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                    : 'bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50'
                }`}
              >
                {isRotatorActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Остановить ({countdown}с)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Запустить ротацию</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-purple-300/70 block mb-1">Режим смены:</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRotatorMode('sequential')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                      rotatorMode === 'sequential'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-white/[0.03] text-purple-300/60 hover:text-white'
                    }`}
                  >
                    По кругу (1→2→3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotatorMode('random')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                      rotatorMode === 'random'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-white/[0.03] text-purple-300/60 hover:text-white'
                    }`}
                  >
                    Случайно
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-purple-300/70 block mb-1">
                  Интервал задержки (секунды):
                </label>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setRotationInterval(sec);
                        setCountdown(sec);
                      }}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono transition-all ${
                        rotationInterval === sec
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-white/[0.03] text-purple-300/60 hover:text-white'
                      }`}
                    >
                      {sec}с
                    </button>
                  ))}
                  <input
                    type="number"
                    min={3}
                    max={3600}
                    value={rotationInterval}
                    onChange={(e) => {
                      const val = Math.max(3, parseInt(e.target.value) || 5);
                      setRotationInterval(val);
                      setCountdown(val);
                    }}
                    className="w-14 bg-[#131024] border border-purple-500/20 rounded-lg px-1.5 py-1 text-xs text-center font-mono text-white outline-none focus:border-purple-400"
                    title="Кастомные секунды"
                  />
                </div>
              </div>
            </div>

            {/* Rotator List & Add Nickname with "+" */}
            <div className="pt-2">
              <div className="flex gap-1.5 mb-2.5">
                <input
                  type="text"
                  value={newNickToAdd}
                  onChange={(e) => setNewNickToAdd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRotationNick();
                    }
                  }}
                  placeholder="Добавить ник (zovlender, zlodey, krutoi)..."
                  className="flex-1 bg-[#131024] border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-purple-300/30 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddRotationNick()}
                  disabled={!newNickToAdd.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить</span>
                </button>
              </div>

              {/* Nickname Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                {rotationNicks.map((nick, idx) => (
                  <div
                    key={`${nick}-${idx}`}
                    onClick={() => handleSelectNickPill(nick, idx)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all cursor-pointer select-none ${
                      activeNickBadge === nick
                        ? 'bg-purple-600/40 text-purple-100 border-purple-400 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-white/[0.03] text-purple-200 border-purple-500/20 hover:border-purple-500/40 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-purple-400/60">#{idx + 1}</span>
                    <span>{nick}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveRotationNick(nick);
                      }}
                      className="text-purple-400/50 hover:text-rose-400 p-0.5 rounded transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========== НОВЫЙ БЛОК СТРИМА (заменяет старый) ========== */}
        <div className="p-6 rounded-2xl bg-[#131024]/80 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Radio className="w-5 h-5 animate-pulse text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Стрим-статус & .streamroll</h4>
                <p className="text-xs text-purple-300/60">
                  Управление статусом трансляции и случайная ротация названий стрима
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090812] border border-purple-500/30 self-start sm:self-auto max-w-full">
              <div className={`w-2 h-2 rounded-full ${activeStreamTitle && activeStreamTitle !== '(нет активного стрима)' ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
              <span className="text-[11px] text-purple-300/70">Активный стрим:</span>
              <span className="text-xs font-mono font-bold text-purple-200 truncate max-w-[160px] sm:max-w-[220px]">
                {activeStreamTitle || '(нет активного стрима)'}
              </span>
            </div>
          </div>

          <form onSubmit={handleStreamSubmit} className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={streamInput}
                onChange={(e) => setStreamInput(e.target.value)}
                placeholder="Название стрима (например: 🎮 Cyberpunk 2077 // Night City Run)..."
                className="flex-1 bg-[#0a0814]/90 border border-purple-500/30 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-300/30 outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingStream || !streamInput.trim()}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 border border-purple-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isSavingStream ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Tv className="w-3.5 h-3.5" />
                      <span>Установить</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRollRandomStream}
                  disabled={isSavingStream}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all flex items-center justify-center gap-1.5 shrink-0"
                  title="Ролл случайного названия стрима (.streamroll)"
                >
                  <Shuffle className="w-3.5 h-3.5 text-purple-300" />
                  <span>.streamroll</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearStream}
                  disabled={isClearingStream}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 shrink-0"
                  title="Удалить стрим-статус"
                >
                  {isClearingStream ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Очистить</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Список пресетов + добавление нового */}
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-purple-300/70 uppercase tracking-wider block">
                Быстрые пресеты:
              </span>
              <div className="flex-1 flex gap-1.5">
                <input
                  type="text"
                  value={newStreamPreset}
                  onChange={(e) => setNewStreamPreset(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStreamPreset()}
                  placeholder="Добавить пресет..."
                  className="flex-1 min-w-[120px] bg-[#131024] border border-purple-500/30 focus:border-purple-400 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-purple-300/30 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddStreamPreset}
                  disabled={!newStreamPreset.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
              {streamPresets.map((preset, idx) => (
                <div
                  key={`${preset}-${idx}`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                    activeStreamTitle === preset
                      ? 'bg-purple-600/40 text-purple-100 border-purple-400 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'bg-white/[0.03] text-purple-200 border-purple-500/20 hover:border-purple-500/40 hover:bg-white/[0.06]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectStreamPreset(preset)}
                    className="truncate max-w-[200px] text-left"
                  >
                    {preset}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveStreamPreset(preset)}
                    className="text-purple-400/50 hover:text-rose-400 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ротатор стримов */}
          <div className="p-3.5 rounded-xl bg-[#090812]/90 border border-purple-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white text-xs">
                  Ротатор стримов
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  const willBeActive = !isStreamRotatorActive;
                  setIsStreamRotatorActive(willBeActive);
                  showToast(
                    willBeActive
                      ? `Ротация стримов запущена (каждые ${streamRotationInterval}с)`
                      : 'Ротация стримов остановлена',
                    willBeActive ? 'success' : 'info'
                  );
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isStreamRotatorActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                    : 'bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50'
                }`}
              >
                {isStreamRotatorActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Остановить ({streamCountdown}с)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Запустить ротацию</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-purple-300/70 block mb-1">Режим смены:</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStreamRotatorMode('sequential')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                      streamRotatorMode === 'sequential'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-white/[0.03] text-purple-300/60 hover:text-white'
                    }`}
                  >
                    По кругу
                  </button>
                  <button
                    type="button"
                    onClick={() => setStreamRotatorMode('random')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                      streamRotatorMode === 'random'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-white/[0.03] text-purple-300/60 hover:text-white'
                    }`}
                  >
                    Случайно
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-purple-300/70 block mb-1">
                  Интервал (сек):
                </label>
                <div className="flex items-center gap-1.5">
                  {[5, 15, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setStreamRotationInterval(sec);
                        setStreamCountdown(sec);
                      }}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono transition-all ${
                        streamRotationInterval === sec
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-white/[0.03] text-purple-300/60 hover:text-white'
                      }`}
                    >
                      {sec}с
                    </button>
                  ))}
                  <input
                    type="number"
                    min={3}
                    max={3600}
                    value={streamRotationInterval}
                    onChange={(e) => {
                      const val = Math.max(3, parseInt(e.target.value) || 15);
                      setStreamRotationInterval(val);
                      setStreamCountdown(val);
                    }}
                    className="w-14 bg-[#131024] border border-purple-500/20 rounded-lg px-1.5 py-1 text-xs text-center font-mono text-white outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ========== КОНЕЦ НОВОГО БЛОКА СТРИМА ========== */}

        {/* Send Message Card */}
        <div className="p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl shadow-lg space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h4 className="font-bold text-white text-sm">Отправить в канал</h4>
          </div>
          <p className="text-xs text-purple-300/60">
            Отправка сообщения от имени self-бота
          </p>

          <form onSubmit={handleMessageSubmit} className="space-y-3 pt-1">
            <input
              type="text"
              value={targetChannel}
              onChange={(e) => setTargetChannel(e.target.value)}
              placeholder="ID канала (10482...)"
              className="w-full bg-[#0a0814]/80 border border-purple-500/20 focus:border-purple-400 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-purple-300/30 outline-none"
            />
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={2}
              placeholder="Текст сообщения..."
              className="w-full bg-[#0a0814]/80 border border-purple-500/20 focus:border-purple-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-purple-300/30 outline-none resize-none"
            />
            <button
              type="submit"
              disabled={isSendingMsg || !messageText.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-purple-100 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSendingMsg ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Отправить сообщение</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Interactive Terminal Output (5 cols) */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="flex-1 rounded-2xl bg-[#090812] border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col min-h-[500px] sticky top-6">
          {/* Terminal Header */}
          <div className="px-4 py-3 bg-[#120e24] border-b border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono font-semibold text-purple-300 ml-2">
                Zenith Command Terminal Output
              </span>
            </div>

            <button
              onClick={() => {
                setHistory([]);
                soundFX.playClick();
                showToast('Окно вывода очищено', 'info');
              }}
              className="p-1.5 text-purple-400/60 hover:text-white transition-colors"
              title="Очистить терминал"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Terminal Body */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-purple-500/10 space-y-2 animate-fade-in group hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center justify-between text-[11px] text-purple-400/60">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300">[{item.timestamp}]</span>
                    <span className="font-bold text-purple-200">{item.command}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                      {item.executionTimeMs}ms
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.response, item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-300 hover:text-white"
                      title="Копировать вывод"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={`whitespace-pre-wrap leading-relaxed font-mono ${
                    item.status === 'success' ? 'text-purple-100' : 'text-rose-400'
                  }`}
                >
                  {item.response}
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="text-center py-16 text-purple-400/40">
                <Terminal className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-xs">Терминал готов к приёму команд</p>
                <p className="text-[11px] text-purple-400/30 mt-1">Кликните «Старт» на любой команде из каталога слева</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};