import React, { useState } from 'react';
import {
  Settings,
  Hash,
  Globe,
  Key,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Download,
  RefreshCw,
  Zap,
  ShieldCheck,
  Radio,
  Layers,
  ArrowUpCircle,
  Clock,
  Activity,
  Check,
  X,
  Server
} from 'lucide-react';
import { BotSettings, FirmwareUpdateInfo } from '../../types/bot';
import { soundFX } from '../../utils/sound';
import { useToast } from '../ToastContainer';
import { botApi } from '../../services/api';
import { botWebSocket } from '../../services/websocket';

interface SettingsTabProps {
  settings: BotSettings;
  onSaveSettings: (newSettings: Partial<BotSettings>) => void;
  onRestartBot: () => Promise<{ success: boolean; message: string }>;
  onCheckApiHealth: () => Promise<{ online: boolean; ping: number }>;
  updateInfo?: FirmwareUpdateInfo;
  onCheckUpdates?: () => Promise<any>;
  onTriggerUpdate?: () => Promise<any>;
  onSimulateUpdate?: () => void;
}

interface EndpointCheckResult {
  name: string;
  path: string;
  status: 'pending' | 'ok' | 'fail';
  latency?: number;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSaveSettings,
  onRestartBot,
  onCheckApiHealth,
  updateInfo,
  onCheckUpdates,
  onTriggerUpdate,
  onSimulateUpdate
}) => {
  const { showToast } = useToast();

  const [channelId, setChannelId] = useState(settings.outputChannelId);
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [password, setPassword] = useState(settings.password);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isCheckingSwUpdates, setIsCheckingSwUpdates] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  const [endpointResults, setEndpointResults] = useState<EndpointCheckResult[]>([
    { name: 'Дашборд & Статус', path: '/api/dashboard', status: 'pending' },
    { name: 'Серверы & Каналы', path: '/api/servers', status: 'pending' },
    { name: 'Список участников', path: '/api/members', status: 'pending' },
    { name: 'Кастомные эмодзи', path: '/api/emojis', status: 'pending' },
    { name: 'Журнал логов', path: '/api/logs', status: 'pending' },
    { name: 'Исполнение команд', path: '/api/execute', status: 'pending' },
    { name: 'WebSocket Realtime', path: '/ws', status: 'pending' }
  ]);

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId.trim()) return;
    onSaveSettings({ outputChannelId: channelId.trim() });
    soundFX.playSuccess();
    showToast(`ID канала вывода сохранен: ${channelId}`, 'success');
  };

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUrl.trim()) return;
    onSaveSettings({ apiUrl: apiUrl.trim() });
    soundFX.playSuccess();
    showToast(`Адрес API сохранен: ${apiUrl}`, 'success');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onSaveSettings({ password: password.trim() });
    soundFX.playSuccess();
    showToast(`Пароль доступа обновлен`, 'success');
  };

  const handleTestConnection = async () => {
    setIsTestingApi(true);
    soundFX.playClick();

    const baseUrl = apiUrl.trim().replace(/\/+$/, '');
    const cleanHeaders = {
      'Content-Type': 'application/json',
      'X-Password': password.trim(),
      'Authorization': `Bearer ${password.trim()}`
    };

    const tests: EndpointCheckResult[] = [
      { name: 'Дашборд & Статус', path: '/api/dashboard', status: 'pending' },
      { name: 'Серверы & Каналы', path: '/api/servers', status: 'pending' },
      { name: 'Список участников', path: '/api/members', status: 'pending' },
      { name: 'Кастомные эмодзи', path: '/api/emojis', status: 'pending' },
      { name: 'Журнал логов', path: '/api/logs', status: 'pending' },
      { name: 'Исполнение команд', path: '/api/execute', status: 'pending' },
      { name: 'WebSocket Realtime', path: '/ws', status: 'pending' }
    ];
    setEndpointResults([...tests]);

    let okCount = 0;

    for (let i = 0; i < tests.length; i++) {
      const t = tests[i];
      const start = performance.now();
      try {
        if (t.path === '/ws') {
          t.status = botWebSocket.getStatus() === 'connected' ? 'ok' : 'pending';
          t.latency = Math.round(performance.now() - start);
          if (t.status === 'ok') okCount++;
        } else {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(`${baseUrl}${t.path}`, {
            method: t.path === '/api/execute' ? 'POST' : 'GET',
            headers: cleanHeaders,
            body: t.path === '/api/execute' ? JSON.stringify({ command: '.ping' }) : undefined,
            signal: controller.signal
          });
          clearTimeout(tid);
          const lat = Math.round(performance.now() - start);
          t.latency = lat;
          if (res.ok) {
            t.status = 'ok';
            okCount++;
          } else {
            t.status = 'fail';
          }
        }
      } catch {
        t.status = 'fail';
        t.latency = Math.round(performance.now() - start);
      }
      setEndpointResults([...tests]);
    }

    const health = await onCheckApiHealth();
    setIsTestingApi(false);

    if (health.online || okCount > 0) {
      soundFX.playSuccess();
      showToast(`Бот подключен! Успешно проверено ${okCount} эндпоинтов (Пинг: ${health.ping}ms)`, 'success');
    } else {
      soundFX.playError();
      showToast(`Бот пока не отвечает на ${apiUrl}. Запустите бота на порту 8080 — панель подхватит его автоматически!`, 'error');
    }
  };

  const handleRestart = async () => {
    if (!window.confirm('Вы действительно хотите отправить сигнал перезапуска боту?')) return;
    setIsRestarting(true);
    soundFX.playClick();
    const res = await onRestartBot();
    setIsRestarting(false);
    if (res.success) {
      soundFX.playSuccess();
      showToast(res.message, 'info');
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingSwUpdates(true);
    soundFX.playClick();
    if (onCheckUpdates) {
      await onCheckUpdates();
    } else {
      showToast('Проверка обновлений завершена', 'info');
    }
    setIsCheckingSwUpdates(false);
  };

  const handleTriggerUpdate = async () => {
    setIsApplyingUpdate(true);
    soundFX.playClick();
    if (onTriggerUpdate) {
      await onTriggerUpdate();
    }
    setIsApplyingUpdate(false);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Конфигурация и Связь с Ботом</h2>
        <p className="text-xs text-purple-300/60 mt-0.5">
          Автоматическая синхронизация запросов, REST API мост и управление локальным ботом на localhost:8080
        </p>
      </div>

      <div className="space-y-5">
        {/* Live Bot Integration Status & Auto-Pickup Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#16112d]/90 via-[#131024]/90 to-[#0e0b1d]/90 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                <Server className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Автоматический мост с ботом (localhost:8080)</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    botApi.isLocalLive()
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    <Radio className="w-3 h-3 animate-pulse" />
                    {botApi.isLocalLive() ? 'Бот на связи' : 'Ожидание запуска бота'}
                  </span>
                </div>
                <p className="text-xs text-purple-300/70 mt-1">
                  Веб-панель постоянно опрашивает <code className="text-purple-300 bg-[#090812] px-1 py-0.5 rounded font-mono">{settings.apiUrl}</code> и мгновенно пересылает команды, роли, муты и сообщения напрямую в ядро вашего бота.
                </p>
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTestingApi}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 border border-purple-400/30 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingApi ? 'animate-spin' : ''}`} />
              <span>{isTestingApi ? 'Тестирование...' : 'Тест всех эндпоинтов'}</span>
            </button>
          </div>

          {/* Diagnostic Endpoint Matrix */}
          <div className="pt-2 border-t border-purple-500/10">
            <span className="text-[11px] font-semibold text-purple-300/80 uppercase tracking-wider block mb-2">
              Диагностика маршрутов REST & WebSocket:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {endpointResults.map((ep) => (
                <div
                  key={ep.path}
                  className="p-2 rounded-xl bg-[#090812]/80 border border-purple-500/20 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <span className="text-white font-medium block truncate text-[11px]">{ep.name}</span>
                    <span className="text-[10px] font-mono text-purple-300/60 block truncate">{ep.path}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 pl-1">
                    {ep.status === 'ok' && (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                        <Check className="w-3 h-3 text-emerald-400" />
                        {ep.latency}ms
                      </span>
                    )}
                    {ep.status === 'fail' && (
                      <span className="text-rose-400 flex items-center gap-1 font-mono text-[10px]">
                        <X className="w-3 h-3 text-rose-400" />
                        offline
                      </span>
                    )}
                    {ep.status === 'pending' && (
                      <span className="w-2 h-2 rounded-full bg-purple-400/50" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Address & Connection */}
        <div className="p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Адрес API сервера бота</h3>
              <p className="text-xs text-purple-300/60">
                URL локального сервера бота (по умолчанию http://localhost:8080)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveApi} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8080"
              required
              className="flex-1 bg-[#090812] border border-purple-500/30 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-purple-300/30 outline-none"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingApi}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all flex items-center justify-center gap-2"
              >
                {isTestingApi ? (
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Проверить связь</span>
                )}
              </button>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Применить URL</span>
              </button>
            </div>
          </form>
        </div>

        {/* Output Channel Card */}
        <div className="p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Канал вывода (Output Channel ID)</h3>
              <p className="text-xs text-purple-300/60">
                Канал Discord, в который бот отправляет сообщения по умолчанию (.say, логи)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveChannel} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="104829104829104831"
              required
              className="flex-1 bg-[#090812] border border-purple-500/30 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-purple-300/30 outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить канал</span>
            </button>
          </form>

          <div className="text-xs text-purple-300/50 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Текущий сохраненный ID: <strong className="text-white font-mono">{settings.outputChannelId}</strong></span>
          </div>
        </div>

        {/* Password & Security Card */}
        <div className="p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Ключ авторизации (X-Password)</h3>
              <p className="text-xs text-purple-300/60">
                Секретный пароль для доступа к методам управления ботом (по умолчанию GGEZ)
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePassword} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="GGEZ"
              required
              className="flex-1 bg-[#090812] border border-purple-500/30 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-purple-300/30 outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Обновить пароль</span>
            </button>
          </form>
        </div>

        {/* Process Controls */}
        <div className="p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Системные действия</span>
            </h4>
            <p className="text-xs text-purple-300/60">
              Отправка сигнала на перезапуск процесса бота
            </p>
          </div>

          <button
            onClick={handleRestart}
            disabled={isRestarting}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <RotateCcw className={`w-4 h-4 text-rose-400 ${isRestarting ? 'animate-spin' : ''}`} />
            <span>Перезапустить бота</span>
          </button>
        </div>
      </div>
    </div>
  );
};
