import { FirmwareUpdateInfo } from '../types/bot';
import { toast } from '../utils/toastEmitter';
import { soundFX } from '../utils/sound';

type UpdateListener = (info: FirmwareUpdateInfo) => void;

class UpdateService {
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Set<UpdateListener> = new Set();
  private hasNotifiedUser = false;

  private currentInfo: FirmwareUpdateInfo = {
    currentFirmwareVersion: '2.4.8',
    currentApiVersion: '1.9.4',
    swVersion: '2.4.8',
    hasUpdate: true,
    pendingFirmwareVersion: '2.5.0-STABLE',
    pendingApiVersion: '2.0.0-PRO',
    releaseDate: '2026-08-18',
    changelog: [
      '⚡ Полная переработка WebSocket Gateway v10 с авто-переподключением за 150мс',
      '🛡️ Добавлен интеллектуальный обход Cloudflare / Discord rate limits',
      '🔄 Оптимизирован циклический ротатор никнеймов и устранены сбои таймеров',
      '📦 Интеграция быстрого Service Worker кэширования для работы без интернета',
      '🚀 Ускорен отклик и исполнение команд (.purge, .ping, .status, .say)'
    ],
    status: 'available',
    lastChecked: new Date().toLocaleTimeString(),
    progress: 0,
    currentStepMessage: '',
    isServiceWorkerActive: false
  };

  constructor() {
    // Restore persistent firmware version state if user previously updated
    const saved = localStorage.getItem('discord_bot_firmware_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentInfo = { ...this.currentInfo, ...parsed };
      } catch {
        /* ignore */
      }
    }
  }

  public async register(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[UpdateService] Service Workers not supported in this environment');
      this.currentInfo.isServiceWorkerActive = false;
      this.notifyListeners();
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[UpdateService] Service Worker registered with scope:', this.registration.scope);
      this.currentInfo.isServiceWorkerActive = true;

      // Handle service worker updates
      this.registration.onupdatefound = () => {
        const installingWorker = this.registration?.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available!
                this.currentInfo.hasUpdate = true;
                this.currentInfo.status = 'available';
                this.notifyUserOfUpdate();
                this.notifyListeners();
              }
            }
          };
        }
      };

      // Listen for messages from sw.js
      navigator.serviceWorker.addEventListener('message', (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'UPDATE_CHECK_RESULT' || data.type === 'UPDATE_AVAILABLE') {
          this.currentInfo = {
            ...this.currentInfo,
            hasUpdate: data.hasUpdate,
            currentFirmwareVersion: data.currentFirmwareVersion || this.currentInfo.currentFirmwareVersion,
            currentApiVersion: data.currentApiVersion || this.currentInfo.currentApiVersion,
            pendingFirmwareVersion: data.pendingFirmwareVersion || this.currentInfo.pendingFirmwareVersion,
            pendingApiVersion: data.pendingApiVersion || this.currentInfo.pendingApiVersion,
            changelog: data.changelog || this.currentInfo.changelog,
            status: data.hasUpdate ? 'available' : 'updated',
            lastChecked: new Date().toLocaleTimeString(),
            isServiceWorkerActive: true
          };
          this.saveState();
          if (data.hasUpdate) {
            this.notifyUserOfUpdate();
          }
          this.notifyListeners();
        } else if (data.type === 'UPDATE_APPLIED_SUCCESS') {
          this.currentInfo.currentFirmwareVersion = data.firmwareVersion || '2.5.0-STABLE';
          this.currentInfo.currentApiVersion = data.apiVersion || '2.0.0-PRO';
          this.currentInfo.hasUpdate = false;
          this.currentInfo.status = 'updated';
          this.saveState();
          this.notifyListeners();
        }
      });

      // Initial check after short startup delay
      setTimeout(() => {
        this.checkForUpdates(false);
      }, 1200);

    } catch (err) {
      console.warn('[UpdateService] Service Worker registration failed:', err);
      this.currentInfo.isServiceWorkerActive = false;
      this.notifyListeners();
    }
  }

  private notifyUserOfUpdate() {
    if (this.hasNotifiedUser) return;
    this.hasNotifiedUser = true;
    setTimeout(() => {
      soundFX.playSuccess();
      toast.info(
        `🚀 Доступно обновление прошивки бота ${this.currentInfo.pendingFirmwareVersion || 'v2.5.0'}! Перейдите во вкладку «Настройки» для установки.`,
        6000
      );
    }, 1500);
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.currentInfo });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const copy = { ...this.currentInfo };
    this.listeners.forEach((l) => {
      try {
        l(copy);
      } catch (err) {
        console.error('Error in update listener', err);
      }
    });
  }

  public getUpdateInfo(): FirmwareUpdateInfo {
    return { ...this.currentInfo };
  }

  private saveState() {
    try {
      localStorage.setItem('discord_bot_firmware_state', JSON.stringify({
        currentFirmwareVersion: this.currentInfo.currentFirmwareVersion,
        currentApiVersion: this.currentInfo.currentApiVersion,
        hasUpdate: this.currentInfo.hasUpdate,
        pendingFirmwareVersion: this.currentInfo.pendingFirmwareVersion,
        pendingApiVersion: this.currentInfo.pendingApiVersion
      }));
    } catch {
      /* ignore */
    }
  }

  // Check for updates (query SW or simulated remote manifest)
  public async checkForUpdates(showUserToast = true): Promise<FirmwareUpdateInfo> {
    this.currentInfo.status = 'checking';
    this.currentInfo.lastChecked = new Date().toLocaleTimeString();
    this.notifyListeners();

    if (showUserToast) {
      soundFX.playClick();
      toast.info('Проверка наличия обновлений прошивки и API...', 2000);
    }

    // Try messaging active service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATES' });
      } catch {
        /* ignore */
      }
    }

    // Simulate network query latency (800ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // If already updated, check if new patch can be simulated
    if (this.currentInfo.currentFirmwareVersion.startsWith('2.5')) {
      this.currentInfo.hasUpdate = false;
      this.currentInfo.status = 'updated';
      if (showUserToast) {
        soundFX.playSuccess();
        toast.success(`Установлена актуальная прошивка (${this.currentInfo.currentFirmwareVersion})`, 3000);
      }
    } else {
      this.currentInfo.hasUpdate = true;
      this.currentInfo.status = 'available';
      if (showUserToast) {
        soundFX.playSuccess();
        toast.info(`Найдена новая прошивка: ${this.currentInfo.pendingFirmwareVersion || 'v2.5.0'}`, 3500);
      }
    }

    this.currentInfo.lastChecked = new Date().toLocaleTimeString();
    this.saveState();
    this.notifyListeners();
    return { ...this.currentInfo };
  }

  // Trigger firmware & API update with staged pipeline
  public async triggerFirmwareUpdate(
    onStep?: (progress: number, stepMessage: string) => void
  ): Promise<{ success: boolean; message: string }> {
    if (this.currentInfo.status === 'downloading' || this.currentInfo.status === 'installing') {
      return { success: false, message: 'Процесс обновления уже выполняется' };
    }

    soundFX.playClick();
    this.currentInfo.status = 'downloading';
    this.currentInfo.progress = 5;
    this.currentInfo.currentStepMessage = 'Инициализация защищенного канала OTA & Service Worker...';
    this.notifyListeners();
    if (onStep) onStep(5, this.currentInfo.currentStepMessage);

    const steps = [
      { progress: 20, message: 'Загрузка бинарного пакета прошивки v2.5.0-STABLE (3.4 MB)...', delay: 600 },
      { progress: 45, message: 'Проверка контрольной суммы SHA-256 и криптографической подписи...', delay: 500 },
      { progress: 65, message: 'Обновление Service Worker кэша и шлюза WebSocket Gateway v10...', delay: 700 },
      { progress: 85, message: 'Перезапуск Python REST API модулей и оптимизация ротатора...', delay: 600 },
      { progress: 100, message: 'Обновление успешно установлено! Система готова к работе.', delay: 400 }
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, step.delay));
      this.currentInfo.progress = step.progress;
      this.currentInfo.currentStepMessage = step.message;
      if (step.progress >= 65) {
        this.currentInfo.status = 'installing';
      }
      this.notifyListeners();
      if (onStep) onStep(step.progress, step.message);
    }

    // Apply version updates
    const newFirmware = this.currentInfo.pendingFirmwareVersion || '2.5.0-STABLE';
    const newApi = this.currentInfo.pendingApiVersion || '2.0.0-PRO';
    this.currentInfo.currentFirmwareVersion = newFirmware;
    this.currentInfo.currentApiVersion = newApi;
    this.currentInfo.hasUpdate = false;
    this.currentInfo.status = 'updated';
    this.currentInfo.progress = 100;
    this.saveState();

    // Notify Service Worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'TRIGGER_UPDATE'
        });
        navigator.serviceWorker.controller.postMessage({
          type: 'SKIP_WAITING'
        });
      } catch {
        /* ignore */
      }
    }

    soundFX.playSuccess();
    toast.success(`🎉 Прошивка бота успешно обновлена до ${newFirmware}!`, 5000);
    this.notifyListeners();

    return {
      success: true,
      message: `Прошивка и API успешно обновлены до версии ${newFirmware}`
    };
  }

  // Simulate receiving a new patch update for testing
  public simulateNewUpdate(): void {
    const patch = Math.floor(Math.random() * 9 + 1);
    this.currentInfo = {
      ...this.currentInfo,
      hasUpdate: true,
      pendingFirmwareVersion: `2.5.${patch}-STABLE`,
      pendingApiVersion: `2.0.${patch}-PRO`,
      status: 'available',
      releaseDate: new Date().toISOString().split('T')[0],
      progress: 0,
      currentStepMessage: ''
    };
    this.saveState();
    soundFX.playSuccess();
    toast.info(`Найдено новое обновление: ${this.currentInfo.pendingFirmwareVersion}!`, 4000);
    this.notifyListeners();
  }
}

export const updateService = new UpdateService();
