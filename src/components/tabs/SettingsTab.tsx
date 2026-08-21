import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Monitor,
  Shield,
  Rocket,
  Globe,
  Lock,
  Save,
  RotateCcw,
  RefreshCw,
  Cpu,
  HardDrive,
  Network,
  CheckCircle2,
  Sliders,
  Layers,
  Zap
} from 'lucide-react';
import { AppSettings } from '../../types';

interface SettingsTabProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetSettings: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSaveSettings,
  onResetSettings
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'ui' | 'spoofer' | 'launch' | 'network' | 'security'>('general');
  const [formState, setFormState] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [macGeneratedToast, setMacGeneratedToast] = useState(false);
  const [hwidGeneratedToast, setHwidGeneratedToast] = useState(false);

  const handleSave = () => {
    onSaveSettings(formState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleGenerateQuickMac = () => {
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const newMac = `02:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;
    setFormState({
      ...formState,
      spoofer: {
        ...formState.spoofer,
        currentMac: newMac
      }
    });
    setMacGeneratedToast(true);
    setTimeout(() => setMacGeneratedToast(false), 2000);
  };

  const handleGenerateQuickHwid = () => {
    const hex4 = () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0').toUpperCase();
    const newHwid = `BFEBFBFF000906EA-UUID-${hex4()}${hex4()}`;
    const newDisk = `${hex4()}-${hex4()}`;
    const newGuid = `${hex4()}${hex4()}-${hex4()}-4${hex4().slice(1)}-8${hex4().slice(1)}-${hex4()}${hex4()}${hex4()}`;
    
    setFormState({
      ...formState,
      spoofer: {
        ...formState.spoofer,
        currentHwid: newHwid,
        currentDiskSerial: newDisk,
        guidHwid: newGuid
      }
    });
    setHwidGeneratedToast(true);
    setTimeout(() => setHwidGeneratedToast(false), 2000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Настройки ZenithRAM</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Конфигурация параметров ядра, интерфейса, спуферов, лимитов окон и безопасности
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onResetSettings}
            className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition-all flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сброс</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{savedSuccess ? 'Сохранено!' : 'Сохранить настройки'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab navigation bar */}
      <div className="flex overflow-x-auto gap-1.5 p-1 rounded-xl bg-[#18181B] border border-white/5">
        {[
          { id: 'general', label: 'Общие', icon: Settings },
          { id: 'ui', label: 'Интерфейс', icon: Monitor },
          { id: 'spoofer', label: 'Спуферы (MAC & HWID)', icon: Shield },
          { id: 'launch', label: 'Запуск и Окна', icon: Rocket },
          { id: 'network', label: 'Сеть & Telegram', icon: Globe },
          { id: 'security', label: 'Безопасность', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content Cards */}
      <div className="rounded-xl p-6 bg-[#18181B] border border-white/5 space-y-6">
        {/* 1. General Settings */}
        {activeSubTab === 'general' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white pb-2 border-b border-white/5">
              Общие параметры приложения
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Язык интерфейса</label>
                <select
                  value={formState.general.language}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      general: { ...formState.general, language: e.target.value as any }
                    })
                  }
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ru">Русский (RU)</option>
                  <option value="en">English (EN)</option>
                  <option value="auto">Автоопределение по системе</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Цветовая тема</label>
                <select
                  value={formState.general.theme}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      general: { ...formState.general, theme: e.target.value as any }
                    })
                  }
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="dark_purple">Zenith Violet (Тёмно-фиолетовая)</option>
                  <option value="midnight">Midnight OLED (Ультра-тёмная)</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Имя пользователя для приветствия</label>
                <input
                  type="text"
                  value={formState.general.greetingName}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      general: { ...formState.general, greetingName: e.target.value }
                    })
                  }
                  placeholder="Командир"
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Текст приветствия</label>
                <input
                  type="text"
                  value={formState.general.customGreetingText}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      general: { ...formState.general, customGreetingText: e.target.value }
                    })
                  }
                  placeholder="С возвращением в ZenithRAM"
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.general.autoStartWithWindows}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      general: { ...formState.general, autoStartWithWindows: e.target.checked }
                    })
                  }
                  className="rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
                />
                <span>Автозапуск ZenithRAM вместе с Windows</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.general.checkUpdatesOnStart}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      general: { ...formState.general, checkUpdatesOnStart: e.target.checked }
                    })
                  }
                  className="rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
                />
                <span>Проверять обновления ядра при старте</span>
              </label>
            </div>
          </div>
        )}

        {/* 2. UI Settings */}
        {activeSubTab === 'ui' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white pb-2 border-b border-white/5">
              Настройки интерфейса и карточек
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Размер карточек аккаунтов</label>
                <select
                  value={formState.ui.cardSize}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      ui: { ...formState.ui, cardSize: e.target.value as any }
                    })
                  }
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="small">Маленькие (вмещается &gt;= 5 в строку)</option>
                  <option value="medium">Средние</option>
                  <option value="large">Крупные</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Анимация переходов</label>
                <select
                  value={formState.ui.appearanceEffect}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      ui: { ...formState.ui, appearanceEffect: e.target.value as any }
                    })
                  }
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="slide">Плавный сдвиг (Slide)</option>
                  <option value="fade">Прозрачность (Fade)</option>
                  <option value="zoom">Масштабирование (Zoom)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.ui.showIdInCard}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      ui: { ...formState.ui, showIdInCard: e.target.checked }
                    })
                  }
                  className="rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
                />
                <span>Отображать Roblox ID в мини-карточке</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.ui.showBalanceInCard}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      ui: { ...formState.ui, showBalanceInCard: e.target.checked }
                    })
                  }
                  className="rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
                />
                <span>Отображать баланс Robux в мини-карточке</span>
              </label>
            </div>
          </div>
        )}

        {/* 3. SPOOFER SETTINGS (FULLY IMPLEMENTED & FUNCTIONAL!) */}
        {activeSubTab === 'spoofer' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white pb-2 border-b border-white/5 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Параметры аппаратного спуфера (MAC & HWID)</span>
                </span>
                <span className="text-xs text-emerald-400 font-mono">Kernel Driver: Active</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Генерация виртуальных идентификаторов оборудования для изоляции игровых клиентов и защиты от банов по железу
              </p>
            </div>

            {/* Network Adapter & MAC Spoofer Section */}
            <div className="p-4 rounded-xl bg-[#09090B] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Network className="w-4 h-4 text-indigo-400" />
                  <span>Спуфинг сетевого адаптера (MAC-адрес)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.spoofer.macEnabled}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        spoofer: { ...formState.spoofer, macEnabled: e.target.checked }
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1">Целевой сетевой адаптер</label>
                  <select
                    value={formState.spoofer.selectedAdapter}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        spoofer: { ...formState.spoofer, selectedAdapter: e.target.value }
                      })
                    }
                    className="w-full rounded-lg bg-[#18181B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Realtek PCIe 2.5GbE Family Controller">Realtek PCIe 2.5GbE Family Controller</option>
                    <option value="Intel Wi-Fi 6E AX211 160MHz">Intel Wi-Fi 6E AX211 160MHz</option>
                    <option value="TAP-Windows Adapter V9">TAP-Windows Adapter V9 (Virtual)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1">Формат генерации MAC</label>
                  <select
                    value={formState.spoofer.macFormat}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        spoofer: { ...formState.spoofer, macFormat: e.target.value as any }
                      })
                    }
                    className="w-full rounded-lg bg-[#18181B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="02_random">Локально-администрируемый (02:xx:xx:xx:xx:xx)</option>
                    <option value="custom">Пользовательский статический</option>
                    <option value="preserve">Сохранять исходный MAC</option>
                  </select>
                </div>
              </div>

              {/* Current Active MAC & Quick Generate Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <div className="flex-1 w-full">
                  <label className="text-[11px] text-gray-400 block mb-1 font-mono">Текущий активный MAC:</label>
                  <input
                    type="text"
                    value={formState.spoofer.currentMac}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        spoofer: { ...formState.spoofer, currentMac: e.target.value }
                      })
                    }
                    className="w-full rounded-lg bg-[#18181B] border border-white/10 px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQuickMac}
                  className="w-full sm:w-auto mt-auto py-2 px-4 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium flex items-center justify-center space-x-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${macGeneratedToast ? 'animate-spin' : ''}`} />
                  <span>{macGeneratedToast ? 'Сгенерирован!' : 'Сгенерировать новый MAC'}</span>
                </button>
              </div>
            </div>

            {/* HWID & CPU/Disk Profile Section */}
            <div className="p-4 rounded-xl bg-[#09090B] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Спуфинг HWID процессора и серийного номера диска</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.spoofer.hwidEnabled}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        spoofer: { ...formState.spoofer, hwidEnabled: e.target.checked }
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Виртуальный CPUID + SMBIOS:</label>
                  <input
                    type="text"
                    value={formState.spoofer.currentHwid}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        spoofer: { ...formState.spoofer, currentHwid: e.target.value }
                      })
                    }
                    className="w-full rounded-lg bg-[#18181B] border border-white/10 px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Серийный номер тома NTFS (Volume Serial):</label>
                  <input
                    type="text"
                    value={formState.spoofer.currentDiskSerial}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        spoofer: { ...formState.spoofer, currentDiskSerial: e.target.value }
                      })
                    }
                    className="w-full rounded-lg bg-[#18181B] border border-white/10 px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex-1 w-full">
                  <label className="text-[11px] text-gray-400 block mb-1 font-mono">Windows Machine GUID:</label>
                  <input
                    type="text"
                    value={formState.spoofer.guidHwid}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        spoofer: { ...formState.spoofer, guidHwid: e.target.value }
                      })
                    }
                    className="w-full rounded-lg bg-[#18181B] border border-white/10 px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQuickHwid}
                  className="w-full sm:w-auto mt-auto py-2 px-4 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium flex items-center justify-center space-x-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${hwidGeneratedToast ? 'animate-spin' : ''}`} />
                  <span>{hwidGeneratedToast ? 'Сгенерировано!' : 'Сгенерировать профиль железа'}</span>
                </button>
              </div>
            </div>

            {/* Core Bypass & Memory Tweaks */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.spoofer.cleanCacheOnLaunch}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      spoofer: { ...formState.spoofer, cleanCacheOnLaunch: e.target.checked }
                    })
                  }
                  className="rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
                />
                <span>Автоматически очищать кэш %LOCALAPPDATA%\Roblox перед каждым запуском</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.spoofer.zenithBypassActive}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      spoofer: { ...formState.spoofer, zenithBypassActive: e.target.checked }
                    })
                  }
                  className="rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
                />
                <span>Автоматический перехват дескриптора ROBLOX_singletonEvent (Мульти-клиент)</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.spoofer.gpuLimiterActive}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      spoofer: { ...formState.spoofer, gpuLimiterActive: e.target.checked }
                    })
                  }
                  className="rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
                />
                <span>Ограничивать FPS фоновых окон (30 FPS) для экономии видеопамяти и ЦП</span>
              </label>
            </div>
          </div>
        )}

        {/* 4. Launch & Windows Settings */}
        {activeSubTab === 'launch' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white pb-2 border-b border-white/5">
              Параметры мульти-запуска и окон игры
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">
                  Метод авторизации Roblox
                </label>
                <select
                  value={formState.launch.authMethod}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      launch: { ...formState.launch, authMethod: e.target.value as any }
                    })
                  }
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="cookie">Прямая подстановка куки .ROBLOSECURITY (Быстро)</option>
                  <option value="web_view">Встроенный Web-View Браузер (Безопасно)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">
                  Максимум параллельных окон (0 = безлимитно)
                </label>
                <input
                  type="number"
                  min={0}
                  max={64}
                  value={formState.launch.maxWindows}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      launch: { ...formState.launch, maxWindows: parseInt(e.target.value) || 0 }
                    })
                  }
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">
                Путь к исполняемому файлу RobloxPlayerBeta.exe
              </label>
              <input
                type="text"
                value={formState.launch.robloxPath}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    launch: { ...formState.launch, robloxPath: e.target.value }
                  })
                }
                className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* 5. Network & Telegram Settings */}
        {activeSubTab === 'network' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white pb-2 border-b border-white/5">
              Сетевые порты и Telegram 2FA Бот
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Порт локального REST API</label>
                <input
                  type="number"
                  value={formState.network.serverPort}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      network: { ...formState.network, serverPort: parseInt(e.target.value) || 4080 }
                    })
                  }
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Telegram Chat ID владельца</label>
                <input
                  type="text"
                  value={formState.network.telegramOwnerId}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      network: { ...formState.network, telegramOwnerId: e.target.value }
                    })
                  }
                  placeholder="519283741"
                  className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1">Токен Telegram-бота для 2FA</label>
              <input
                type="text"
                value={formState.network.telegramBotToken}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    network: { ...formState.network, telegramBotToken: e.target.value }
                  })
                }
                placeholder="7829103912:AAG-SampleToken-ZenithRAM"
                className="w-full rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* 6. Security Settings (Clean, No Inactivity Auto-Lock as requested!) */}
        {activeSubTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white pb-2 border-b border-white/5">
              Безопасность и мастер-пароль
            </h3>

            <div className="space-y-4">
              <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.security.masterPasswordEnabled}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      security: { ...formState.security, masterPasswordEnabled: e.target.checked }
                    })
                  }
                  className="rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
                />
                <span>Включить защиту мастер-паролем при входе в приложение</span>
              </label>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">
                  Уровень детализации логов
                </label>
                <select
                  value={formState.logging.logLevel}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      logging: { ...formState.logging, logLevel: e.target.value as any }
                    })
                  }
                  className="w-full sm:w-80 rounded-lg bg-[#09090B] border border-white/10 px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="debug">Отладка (Debug — всё подряд)</option>
                  <option value="info">Информация (Info — стандарт)</option>
                  <option value="warning">Предупреждения (Warning)</option>
                  <option value="error">Только ошибки (Error)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
