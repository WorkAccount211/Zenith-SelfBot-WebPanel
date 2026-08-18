import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { soundFX } from '../../utils/sound';
import { useToast } from '../ToastContainer';
import { CommandCatalogEntry, CommandHistoryItem, CommandPreset } from '../../types/bot';

interface CommandsTabProps {
  onExecuteCommand: (cmd: string) => Promise<{ success: boolean; response: string; executionTimeMs: number }>;
  onChangeNick: (nick: string) => Promise<{ success: boolean; message: string }>;
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
  { id: 'p7', label: 'HypeSquad Bravery (.hypesquad bravery)', command: '.hypesquad bravery', category: 'fun', description: 'Установить значок HypeSquad Bravery' },
  { id: 'p8', label: 'Стрим Twitch (.streaming Twitch)', command: '.streaming Twitch', category: 'status', description: 'Установить статус стриминга' },
  { id: 'p9', label: 'Справка (.help)', command: '.help', category: 'utility', description: 'Вывести список всех команд бота' },
];

const DEFAULT_NICKNAMES = ['zovlender', 'zlodey', 'krutoi', 'shadow_lord', 'cyber_punk', 'night_stalker'];

export const CommandsTab: React.FC<CommandsTabProps> = ({
  onExecuteCommand,
  onChangeNick,
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
      response: 'Self-bot core ready. Available modules: Moderation, Utility, Fun, Gateway.',
      executionTimeMs: 24
    }
  ]);

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

  // Nickname Rotator List & Config
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
  const [rotationInterval, setRotationInterval] = useState<number>(10); // in seconds
  const [countdown, setCountdown] = useState<number>(rotationInterval);
  const [activeNickBadge, setActiveNickBadge] = useState<string>(currentNickname);

  // Message State
  const [targetChannel, setTargetChannel] = useState(defaultChannelId);
  const [messageText, setMessageText] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Synchronize badge with incoming prop
  useEffect(() => {
    if (currentNickname) {
      setActiveNickBadge(currentNickname);
    }
  }, [currentNickname]);

  // Use refs to prevent interval tear-down or stale state during rotator cycles
  const rotIndexRef = useRef(0);
  const isRotatingRef = useRef(false);
  const rotatorModeRef = useRef(rotatorMode);
  rotatorModeRef.current = rotatorMode;
  const rotationNicksRef = useRef(rotationNicks);
  rotationNicksRef.current = rotationNicks;
  const rotationIntervalRef = useRef(rotationInterval);
  rotationIntervalRef.current = rotationInterval;
  const onChangeNickRef = useRef(onChangeNick);
  onChangeNickRef.current = onChangeNick;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('discord_bot_command_presets', JSON.stringify(presets));
  }, [presets]);

  // Save rotation nicks to localStorage
  useEffect(() => {
    localStorage.setItem('discord_bot_rotation_nicks', JSON.stringify(rotationNicks));
  }, [rotationNicks]);

  // Robust Nickname Rotator Timer Loop
  useEffect(() => {
    if (!isRotatorActive) {
      setCountdown(rotationIntervalRef.current);
      return;
    }

    setCountdown(rotationIntervalRef.current);

    const timerId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const currentNicks = rotationNicksRef.current;
          if (currentNicks.length > 0 && !isRotatingRef.current) {
            isRotatingRef.current = true;
            let nextIdx = 0;
            if (rotatorModeRef.current === 'sequential') {
              nextIdx = (rotIndexRef.current + 1) % currentNicks.length;
            } else {
              if (currentNicks.length > 1) {
                do {
                  nextIdx = Math.floor(Math.random() * currentNicks.length);
                } while (nextIdx === rotIndexRef.current);
              } else {
                nextIdx = 0;
              }
            }
            rotIndexRef.current = nextIdx;
            const nextNick = currentNicks[nextIdx];
            if (nextNick) {
              setActiveNickBadge(nextNick);
              onChangeNickRef.current(nextNick)
                .then((res) => {
                  if (res.success) {
                    showToastRef.current(`Авто-ротация: ник сменен на "${nextNick}"`, 'info');
                  }
                })
                .finally(() => {
                  isRotatingRef.current = false;
                });
            } else {
              isRotatingRef.current = false;
            }
          }
          return rotationIntervalRef.current;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isRotatorActive]);

  const handleExecute = async (cmdToRun?: string, presetId?: string) => {
    const rawCmd = (cmdToRun || commandInput).trim();
    if (!rawCmd) return;

    // Ensure dot prefix if user omitted it
    const cmd = rawCmd.startsWith('.') ? rawCmd : `.${rawCmd}`;

    if (presetId) setExecutingPresetId(presetId);
    setIsExecutingCmd(true);
    soundFX.playClick();

    const res = await onExecuteCommand(cmd);
    setIsExecutingCmd(false);
    if (presetId) setExecutingPresetId(null);

    const newItem: CommandHistoryItem = {
      id: `cmd-${Date.now()}`,
      command: cmd,
      timestamp: new Date().toLocaleTimeString(),
      status: res.success ? 'success' : 'error',
      response: res.response,
      executionTimeMs: res.executionTimeMs
    };

    setHistory((prev) => [newItem, ...prev]);

    if (res.success) {
      soundFX.playSuccess();
      showToast(`Команда "${cmd}" выполнена (${res.executionTimeMs}ms)`, 'success');
      if (!cmdToRun) setCommandInput('');
    } else {
      soundFX.playError();
      showToast(`Ошибка выполнения команды: ${cmd}`, 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  // Add Preset Handler
  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetLabel.trim() || !newPresetCmd.trim()) return;

    const formattedCmd = newPresetCmd.trim().startsWith('.')
      ? newPresetCmd.trim()
      : `.${newPresetCmd.trim()}`;

    const newPreset: CommandPreset = {
      id: `preset-${Date.now()}`,
      label: newPresetLabel.trim(),
      command: formattedCmd,
      description: newPresetDesc.trim() || 'Пользовательский шаблон',
      category: newPresetCategory
    };

    setPresets((prev) => [newPreset, ...prev]);
    setNewPresetLabel('');
    setNewPresetCmd('');
    setNewPresetDesc('');
    setIsAddingPreset(false);
    soundFX.playSuccess();
    showToast(`Шаблон "${newPreset.label}" успешно добавлен!`, 'success');
  };

  const handleDeletePreset = (id: string, label: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    soundFX.playClick();
    showToast(`Шаблон "${label}" удален`, 'info');
  };

  // Nickname Submit Handlers
  const handleNickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickInput.trim()) return;

    setIsSavingNick(true);
    soundFX.playClick();
    const res = await onChangeNick(nickInput.trim());
    setIsSavingNick(false);

    if (res.success) {
      soundFX.playSuccess();
      setActiveNickBadge(nickInput.trim());
      showToast(res.message, 'success');
      setNickInput('');
    } else {
      soundFX.playError();
      showToast('Не удалось сменить никнейм', 'error');
    }
  };

  // Reset Nickname to Original
  const handleResetNick = async () => {
    if (!originalNick.trim()) return;
    setIsSavingNick(true);
    soundFX.playClick();
    const res = await onChangeNick(originalNick.trim());
    setIsSavingNick(false);

    if (res.success) {
      soundFX.playSuccess();
      setActiveNickBadge(originalNick.trim());
      showToast(`Никнейм сброшен на изначальный: "${originalNick}"`, 'success');
    } else {
      soundFX.playError();
      showToast('Не удалось сбросить никнейм', 'error');
    }
  };

  // Save new original nickname (Persistent default)
  const handleSaveOriginalNick = () => {
    if (!customOriginalNickInput.trim()) return;
    setOriginalNick(customOriginalNickInput.trim());
    localStorage.setItem('discord_bot_original_nickname', customOriginalNickInput.trim());
    setIsEditingOriginalNick(false);
    soundFX.playSuccess();
    showToast(`Изначальный никнейм обновлен на "${customOriginalNickInput.trim()}"`, 'success');
  };

  // Add nickname to rotation pool
  const handleAddRotationNick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newNickToAdd.trim();
    if (!clean) return;

    if (rotationNicks.includes(clean)) {
      showToast(`Никнейм "${clean}" уже есть в списке`, 'warning');
      return;
    }

    setRotationNicks((prev) => [...prev, clean]);
    setNewNickToAdd('');
    soundFX.playSuccess();
    showToast(`Ник "${clean}" добавлен в ротацию`, 'success');
  };

  // Remove nickname from rotation pool
  const handleRemoveRotationNick = (nick: string) => {
    if (rotationNicks.length <= 1) {
      showToast('В списке должен оставаться хотя бы 1 никнейм', 'warning');
      return;
    }
    setRotationNicks((prev) => prev.filter((n) => n !== nick));
    soundFX.playClick();
    showToast(`Ник "${nick}" удален из пула`, 'info');
  };

  // Immediate random pick
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

  // Direct select pill
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

  const filteredPresets = presets.filter((p) => {
    if (presetCategory === 'all') return true;
    return p.category === presetCategory;
  });

  const commandCatalogList = commandCatalog.length > 0 ? commandCatalog : [
    { name: 'ping', aliases: ['пинг'], category: 'utility', description: 'Проверка задержки', full_name: '.ping' },
    { name: 'help', aliases: ['хелп'], category: 'utility', description: 'Справка', full_name: '.help' },
    { name: 'stats', aliases: ['стата'], category: 'utility', description: 'Статистика', full_name: '.stats' },
    { name: 'warn', aliases: ['варн'], category: 'moderation', description: 'Предупреждения', full_name: '.warn' },
    { name: 'purge', aliases: ['очистить'], category: 'moderation', description: 'Удалить сообщения', full_name: '.purge' },
    { name: 'afk', aliases: ['афк'], category: 'utility', description: 'AFK', full_name: '.afk' },
    { name: 'casino', aliases: [], category: 'fun', description: 'Игровой автомат', full_name: '.casino' },
    { name: 'coinflip', aliases: [], category: 'fun', description: 'Монетка', full_name: '.coinflip' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Left Column: Command Runner, Presets, Nickname Manager, Message Sender (7 cols) */}
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
                  Отправляет команду на мгновенное исполнение в клиент Discord
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-purple-400/80 bg-purple-950/40 px-2 py-1 rounded border border-purple-500/20">
              <CornerDownLeft className="w-3 h-3" /> Ctrl + Enter
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите команду (.purge 10, .status online, .help, .ping)..."
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

        <div className="p-6 rounded-2xl bg-[#131024]/80 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-300">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Синхронизированный каталог команд</h3>
                <p className="text-xs text-purple-300/60">Команды синхронизируются с API бота</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {commandCatalogList.slice(0, 12).map((item) => (
              <button
                key={item.full_name}
                type="button"
                onClick={() => setCommandInput(item.full_name)}
                className="text-left p-3 rounded-xl border border-purple-500/20 bg-[#090812]/80 hover:border-purple-400/40 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-violet-200">{item.full_name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-purple-300/70">{item.category}</span>
                </div>
                <div className="text-[11px] text-purple-300/60 mt-1">{item.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Command Presets Feature (Шаблоны команд в один клик) */}
        <div className="p-6 rounded-2xl bg-[#131024]/80 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <BookmarkPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Шаблоны команд (Command Presets)</h3>
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

          {/* Preset Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[
              { id: 'all', label: 'Все шаблоны' },
              { id: 'moderation', label: 'Модерация' },
              { id: 'utility', label: 'Утилиты' },
              { id: 'status', label: 'Статус' },
              { id: 'fun', label: 'Развлечения' },
              { id: 'custom', label: 'Кастомные' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  soundFX.playClick();
                  setPresetCategory(cat.id);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  presetCategory === cat.id
                    ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'text-purple-300/70 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {filteredPresets.map((preset) => {
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

                    {/* Delete for custom presets */}
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
                      title="Вставить в поле ввода для редактирования"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Forms Grid: Nickname Manager & Message Sender */}
        <div className="grid grid-cols-1 gap-5">
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

              {/* Current Active Nick Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090812] border border-purple-500/30 self-start sm:self-auto">
                <span className="text-[11px] text-purple-300/70">Активный:</span>
                <span className="text-xs font-mono font-bold text-purple-200">{activeNickBadge}</span>
              </div>
            </div>

            {/* Manual Nick Input */}
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

              {/* Instant Random Pick Button */}
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

            {/* Edit Original Nick Box (Collapsible) */}
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
                    Рандомайзер / Циклический ротатор никнеймов
                  </span>
                </div>

                {/* Rotator Toggle Button */}
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

              {/* Rotator Controls: Mode & Interval */}
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
                <label className="text-[11px] text-purple-300/70 block mb-1.5 flex items-center justify-between">
                  <span>Список никнеймов для ротации ({rotationNicks.length}):</span>
                  {isRotatorActive && (
                    <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Через {countdown}с
                    </span>
                  )}
                </label>

                {/* Add Nickname Input with "+" Button */}
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
                    title="Добавить никнейм в список ротации"
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
                      title="Кликните, чтобы сразу применить этот никнейм"
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
                        title="Удалить из ротации"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
      </div>

      {/* Right Column: Interactive Terminal Output (5 cols) */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="flex-1 rounded-2xl bg-[#090812] border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col min-h-[460px] sticky top-6">
          {/* Terminal Header */}
          <div className="px-4 py-3 bg-[#120e24] border-b border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono font-semibold text-purple-300 ml-2">
                API Output Window
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
                className="p-3 rounded-xl bg-white/[0.02] border border-purple-500/10 space-y-1.5 animate-fade-in group"
              >
                <div className="flex items-center justify-between text-[11px] text-purple-400/60">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300">[{item.timestamp}]</span>
                    <span className="font-bold text-purple-200">{item.command}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
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
                  className={`whitespace-pre-wrap leading-relaxed ${
                    item.status === 'success' ? 'text-purple-100' : 'text-rose-400'
                  }`}
                >
                  {item.response}
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="text-center py-12 text-purple-400/40">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Вывод пуст. Выполните команду для отображения ответа API.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
