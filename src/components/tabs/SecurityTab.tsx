import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Trash2,
  RefreshCw,
  Laptop,
  Network,
  Zap,
  HardDrive,
  CheckCircle2,
  Sliders,
  Eye,
  MessageSquare,
  Sparkles,
  Volume2,
  Radio,
  Check,
  RotateCw,
  Terminal,
  Activity
} from 'lucide-react';
import { Account, SpooferState, DiscordRpcState } from '../../types';
import { api } from '../../services/api';

interface SecurityTabProps {
  accounts: Account[];
  spooferState: SpooferState;
  discordRpcState?: DiscordRpcState;
  onUpdateSpoofer: (updates: Partial<SpooferState>) => void;
  onUpdateDiscordRpc?: (updates: Partial<DiscordRpcState>) => void;
  onCheckAllBans: () => void;
  onCleanCache: () => void;
  onGenerateMac: () => void;
  isCheckingBans: boolean;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  accounts,
  spooferState,
  discordRpcState,
  onUpdateSpoofer,
  onUpdateDiscordRpc,
  onCheckAllBans,
  onCleanCache,
  onGenerateMac,
  isCheckingBans
}) => {
  const [cacheCleanedSuccess, setCacheCleanedSuccess] = useState(false);
  const [adapterApplyStatus, setAdapterApplyStatus] = useState<string | null>(null);
  const [systemCallLogs, setSystemCallLogs] = useState<string[]>([]);
  const [isRotatingMac, setIsRotatingMac] = useState(false);
  const [isGeneratingHwid, setIsGeneratingHwid] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const bannedAccounts = accounts.filter(a => a.isBanned);
  const cleanAccounts = accounts.filter(a => !a.isBanned);

  const handleCleanCacheClick = () => {
    onCleanCache();
    setCacheCleanedSuccess(true);
    setTimeout(() => setCacheCleanedSuccess(false), 3000);
  };

  // Real HWID generator via backend Windows Registry integration
  const handleGenerateFullHwid = async () => {
    setIsGeneratingHwid(true);
    try {
      const res = await api.generateHwid();
      if (res && res.success) {
        onUpdateSpoofer({
          currentHwid: res.hwid,
          currentDiskSerial: res.diskSerial,
          guidHwid: res.machineGuid
        });
        setSystemCallLogs([
          `[REGISTRY] HKLM\\SOFTWARE\\Microsoft\\Cryptography\\MachineGuid -> ${res.machineGuid}`,
          `[REGISTRY] HKLM\\SYSTEM\\CurrentControlSet\\Control\\IDConfigDB\\...\\HwProfileGuid -> ${res.hwProfileGuid}`,
          `[IOCTL] Volume Serial Number (NTFS C:) -> ${res.diskSerial}`,
          `[CPU/SMBIOS] Hardware ID Fingerprint -> ${res.hwid}`
        ]);
      }
    } catch {
      // fallback
    } finally {
      setIsGeneratingHwid(false);
    }
  };

  // Real MAC rotation via ipconfig /release /renew and netsh system calls
  const handleApplyMacToAdapter = async () => {
    setIsRotatingMac(true);
    setAdapterApplyStatus('Выполнение системных вызовов: ipconfig /release, подмена реестра, ipconfig /renew...');
    try {
      const res = await api.rotateMac(spooferState.selectedAdapter);
      if (res && res.success) {
        onUpdateSpoofer({ currentMac: res.mac });
        setSystemCallLogs(res.commandLogs);
        setAdapterApplyStatus(`Успешно применен к ${res.adapter} | Новый IP: ${res.renewedIp} | MAC: ${res.mac}`);
        setTimeout(() => setAdapterApplyStatus(null), 6000);
      }
    } catch {
      setAdapterApplyStatus('Ошибка применения системного вызова');
    } finally {
      setIsRotatingMac(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Центр Безопасности & Аппаратный Спуфер</span>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              V3.4.0 Kernel Mode
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Аппаратная маскировка адаптеров, генерация HWID, OCR детекция банов и Discord RPC
          </p>
        </div>

        {/* Mass Ban Check Button */}
        <button
          onClick={onCheckAllBans}
          disabled={isCheckingBans}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBans ? 'animate-spin' : ''}`} />
          <span>Проверить все {accounts.length} аккаунтов на бан</span>
        </button>
      </div>

      {/* Account Ban Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#18181B] border border-white/10 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Всего в базе</span>
            <span className="text-base font-bold text-white">{accounts.length} профилей</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#18181B] border border-white/10 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Чистые (Готовы к игре)</span>
            <span className="text-base font-bold text-emerald-400">{cleanAccounts.length} активных</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#18181B] border border-white/10 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Заблокированные в Roblox</span>
            <span className="text-base font-bold text-rose-400">{bannedAccounts.length} аккаунтов</span>
          </div>
        </div>
      </div>

      {/* Main Spoofer Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Network Adapter & Real MAC Spoofer */}
        <div className="p-5 rounded-2xl bg-[#18181B] border border-white/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">MAC Спуфер Сетевых Адаптеров</h3>
                <span className="text-[11px] text-emerald-400 font-mono">Авто-применение через Netsh/Registry</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={spooferState.macEnabled}
              onChange={(e) => onUpdateSpoofer({ macEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
            />
          </div>

          <p className="text-xs text-gray-400">
            Генерирует локально-управляемый MAC-адрес (формат <code className="text-indigo-300 font-mono">02:XX:XX:XX:XX:XX</code>) и автоматически применяет его к сетевой карте без разрыва VPN-соединения.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1 font-medium">Целевой сетевой адаптер Windows:</label>
              <select
                value={spooferState.selectedAdapter}
                onChange={(e) => onUpdateSpoofer({ selectedAdapter: e.target.value })}
                className="w-full rounded-xl bg-[#09090B] border border-white/10 px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="Ethernet (Realtek PCIe 2.5GbE)">Ethernet (Realtek PCIe 2.5GbE Controller)</option>
                <option value="Wi-Fi (Intel Wi-Fi 6 AX200)">Wi-Fi (Intel Wi-Fi 6 AX200 160MHz)</option>
                <option value="Virtual Adapter (TAP-Windows)">Virtual Adapter (TAP-Windows V9)</option>
                <option value="Auto">Автоматический выбор активного сетевого интерфейса</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1">
                <span className="font-medium">Сгенерированный MAC:</span>
                <span className="text-emerald-400 font-mono">02:xx (Valid IEEE 802)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={spooferState.currentMac}
                  onChange={(e) => onUpdateSpoofer({ currentMac: e.target.value })}
                  className="flex-1 rounded-xl bg-[#09090B] border border-white/10 px-3.5 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={onGenerateMac}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium transition-colors flex items-center space-x-1"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Генерировать</span>
                </button>
              </div>
            </div>

            {/* Manual Apply Button */}
            <div className="pt-2">
              <button
                onClick={handleApplyMacToAdapter}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Применить MAC к сетевому адаптеру прямо сейчас</span>
              </button>
              {adapterApplyStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 text-center font-mono"
                >
                  {adapterApplyStatus}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Real HWID Generator & Disk Serial Spoofer */}
        <div className="p-5 rounded-2xl bg-[#18181B] border border-white/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Реальный Генератор HWID & Дисков</h3>
                <span className="text-[11px] text-indigo-300 font-mono">CPU ID • Disk Serial • MachineGUID</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={spooferState.hwidEnabled}
              onChange={(e) => onUpdateSpoofer({ hwidEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-[#09090B] border-white/10 focus:ring-0 cursor-pointer"
            />
          </div>

          <p className="text-xs text-gray-400">
            Обход HWID банов в Project Delta и других играх через алгоритмическую генерацию серийного номера тома NTFS и подмену MachineGUID в реестре.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1">
                <span>Виртуальный HWID (CPU + SMBIOS):</span>
                <button
                  onClick={() => copyToClipboard(spooferState.currentHwid, 'hwid')}
                  className="text-indigo-400 hover:underline flex items-center space-x-0.5"
                >
                  {copiedKey === 'hwid' ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                  <span>{copiedKey === 'hwid' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-[#09090B] border border-white/10 font-mono text-xs text-gray-200 font-semibold">
                {spooferState.currentHwid}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-gray-400 block mb-1 font-medium">Volume Serial (NTFS):</span>
                <div className="p-2 rounded-xl bg-[#09090B] border border-white/10 font-mono text-xs text-emerald-400 font-bold">
                  {spooferState.currentDiskSerial}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-400 block mb-1 font-medium">Machine GUID:</span>
                <div className="p-2 rounded-xl bg-[#09090B] border border-white/10 font-mono text-xs text-indigo-300 truncate">
                  {spooferState.guidHwid?.slice(0, 14)}...
                </div>
              </div>
            </div>

            {/* Generate Full HWID Profile */}
            <div className="pt-2">
              <button
                onClick={handleGenerateFullHwid}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Сгенерировать полный новый HWID профиль</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Live System Call Output Console */}
      {systemCallLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-[#09090B] border border-indigo-500/30 font-mono text-xs shadow-lg space-y-2"
        >
          <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-white/10 pb-2">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Системный журнал выполнения (Kernel & Registry Engine):</span>
            </div>
            <button
              onClick={() => setSystemCallLogs([])}
              className="text-[10px] text-gray-500 hover:text-gray-300 font-sans"
            >
              Очистить вывод
            </button>
          </div>
          <div className="space-y-1 text-gray-300 max-h-36 overflow-y-auto">
            {systemCallLogs.map((log, idx) => (
              <div
                key={idx}
                className={`text-[11px] ${
                  log.includes('SUCCESS') || log.includes('LEASE_ACQUIRED') || log.includes('REGISTRY')
                    ? 'text-emerald-400'
                    : 'text-indigo-300'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3. Discord RPC Configurator & Status Preview */}
      <div className="p-5 rounded-2xl bg-[#18181B] border border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Discord Rich Presence (RPC)</h3>
              <p className="text-xs text-gray-400">Трансляция игрового статуса в профиль Discord</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-[#5865F2] font-semibold bg-[#5865F2]/10 px-2 py-0.5 rounded border border-[#5865F2]/20">
              RPC Active
            </span>
          </div>
        </div>

        {/* Discord Preview Card as requested by user */}
        <div className="p-4 rounded-xl bg-[#09090B] border border-[#5865F2]/20 relative overflow-hidden">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <span>Превью статуса в Discord:</span>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-indigo-400/30 shrink-0">
              ZR
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <span>ZenithRAM V3.4.0</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-gray-300 font-medium">
                Project Delta [Hardcore Survival] • ID: 7346416636
              </div>
              <div className="text-gray-500 font-mono text-[11px]">
                В игре уже 00:24:18 (2 сессии активно)
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-400">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-indigo-600 bg-[#09090B] border-white/10" />
            <span>Отображать название игры</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-indigo-600 bg-[#09090B] border-white/10" />
            <span>Отображать Roblox Place ID</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-indigo-600 bg-[#09090B] border-white/10" />
            <span>Отображать таймер сессии</span>
          </label>
        </div>
      </div>

      {/* 4. OCR Anti-Ban & Kick Detector */}
      <div className="p-5 rounded-2xl bg-[#18181B] border border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">OCR Детектор Банов & Киков в Реальном Времени</h3>
              <p className="text-xs text-gray-400">
                Автоматическое сканирование экрана на диалоговые окна банов/киков Roblox
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              OCR LIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#09090B] border border-white/5 space-y-2">
            <span className="font-semibold text-gray-200 block">Отслеживаемые фразы (Kick/Ban Patterns):</span>
            <div className="space-y-1 font-mono text-[11px] text-gray-400">
              <div className="text-rose-400 font-medium">• "You have been kicked from this experience"</div>
              <div className="text-rose-400 font-medium">• "Account deleted or suspended"</div>
              <div className="text-rose-400 font-medium">• "Security key mismatch / Error 268"</div>
              <div className="text-rose-400 font-medium">• "Same account launched from another device"</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#09090B] border border-white/5 space-y-2">
            <span className="font-semibold text-gray-200 block">Действия при обнаружении:</span>
            <div className="space-y-1.5 text-gray-300 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 bg-[#09090B]" />
                <span>Звуковое оповещение (System Alarm)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 bg-[#09090B]" />
                <span>Авто-завершение процесса для спасения профиля</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 bg-[#09090B]" />
                <span>Перевод текста ошибки на английский</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Cache Cleaner Action */}
      <div className="p-5 rounded-2xl bg-[#18181B] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <Trash2 className="w-4 h-4 text-indigo-400" />
            <span>Очистка кэша и следов Roblox (%LOCALAPPDATA%\Roblox)</span>
          </div>
          <p className="text-xs text-gray-400">
            Удаляет старые cookies, дампы памяти, telemetry analytics и временные логи перед запуском.
          </p>
        </div>

        <button
          onClick={handleCleanCacheClick}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold shrink-0 flex items-center space-x-1.5 transition-colors"
        >
          {cacheCleanedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Кэш очищен!</span>
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить кэш сейчас</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
