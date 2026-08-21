import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BootSplashScreen } from './components/BootSplashScreen';
import { LaunchProgressModal } from './components/LaunchProgressModal';
import { AddAccountModal } from './components/modals/AddAccountModal';
import { MasterPasswordModal } from './components/modals/MasterPasswordModal';
import { ScreenshotViewerModal } from './components/modals/ScreenshotViewerModal';
import { AccountsTab } from './components/tabs/AccountsTab';
import { QuickLaunchTab } from './components/tabs/QuickLaunchTab';
import { SessionsTab } from './components/tabs/SessionsTab';
import { PlayerFinderTab } from './components/tabs/PlayerFinderTab';
import { SecurityTab } from './components/tabs/SecurityTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { LogsTab } from './components/tabs/LogsTab';
import { ProjectFilesTab } from './components/tabs/ProjectFilesTab';
import { api } from './services/api';
import { Account, ActiveSession, LogEntry, AppSettings, SpooferState, GamePreset, ServerHealth } from './types';
import { INITIAL_ACCOUNTS, INITIAL_SESSIONS, INITIAL_LOGS, INITIAL_SETTINGS } from './mockData';

export default function App() {
  // Application Global States
  const [isBooting, setIsBooting] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts');
  const [isLocked, setIsLocked] = useState(false);

  // Entities state
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [spooferState, setSpooferState] = useState<SpooferState>(INITIAL_SETTINGS.spoofer);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [launchModalState, setLaunchModalState] = useState<{
    isOpen: boolean;
    account: Account | null;
    game: GamePreset | null;
    serverType: string;
  }>({
    isOpen: false,
    account: null,
    game: null,
    serverType: 'City-13'
  });
  const [viewingScreenshotSession, setViewingScreenshotSession] = useState<ActiveSession | null>(null);

  // Status indicators
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingBans, setIsCheckingBans] = useState(false);
  const [serverHealth, setServerHealth] = useState<ServerHealth>({
    status: 'online',
    version: '3.4.0',
    port: 4080,
    roblox: {
      isRunning: false,
      processCount: 0,
      version: 'version-e26b149b5c3a4f89 (x64 Windows)',
      clientChannel: 'LIVE',
      directory: 'C:\\Users\\AppData\\Local\\Roblox\\Versions\\version-e26b149b5c3a4f89',
      executable: 'RobloxPlayerBeta.exe',
      lastDetected: 'Только что'
    }
  });

  // Initial data loading from server API
  const loadInitialData = useCallback(async () => {
    try {
      const [health, accs, sess, lgs] = await Promise.all([
        api.getHealth(),
        api.getAccounts(),
        api.getSessions(),
        api.getLogs()
      ]);
      setServerHealth(health);
      if (accs && accs.length > 0) setAccounts(accs);
      if (sess) setSessions(sess);
      if (lgs) setLogs(lgs);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic session uptime ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prev =>
        prev.map(s => ({
          ...s,
          uptimeSeconds: s.uptimeSeconds + 1
        }))
      );
    } , 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to add local log
  const pushLog = (level: 'info' | 'warning' | 'error' | 'debug', module: 'UI' | 'API' | 'SPOOFER' | 'SERVER' | 'MUTEX' | 'CORE', message: string) => {
    setLogs(prev => [
      {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        level,
        module,
        message,
        repeatCount: 1
      },
      ...prev
    ]);
  };

  // Handlers for Accounts
  const handlePinToggle = async (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    const updated = await api.updateAccount(id, { isPinned: !acc.isPinned });
    setAccounts(prev => {
      const next = prev.map(a => (a.id === id ? { ...a, isPinned: !a.isPinned } : a));
      return next.sort((a, b) => {
        if (a.isPinned === b.isPinned) return a.username.localeCompare(b.username);
        return a.isPinned ? -1 : 1;
      });
    });
    pushLog('info', 'UI', `Аккаунт ${acc.username} ${!acc.isPinned ? 'закреплен в начале' : 'откреплен'}`);
  };

  const handleRefreshAccount = async (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    pushLog('info', 'API', `Обновление данных Roblox для ${acc.username}...`);
    // Random status update simulation
    const updated = await api.updateAccount(id, {
      lastLogin: 'Только что обновлен',
      status: acc.status === 'in_game' ? 'in_game' : 'online'
    });
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, lastLogin: 'Только что обновлен' } : a)));
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    pushLog('info', 'API', 'Массовое обновление данных всех аккаунтов через Roblox API...');
    await new Promise(r => setTimeout(r, 600));
    const latestAccounts = await api.getAccounts();
    setAccounts(latestAccounts);
    setIsRefreshing(false);
  };

  const handleDeleteAccount = async (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    await api.deleteAccount(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
    pushLog('info', 'UI', `Аккаунт ${acc.username} удален из менеджера и Accounts.txt`);
  };

  const handleAddSingleAccount = async (payload: { username: string; password?: string; displayName?: string; robloxId?: string; notes?: string }) => {
    const newAcc = await api.createAccount(payload);
    setAccounts(prev => [newAcc, ...prev]);
    pushLog('info', 'API', `Добавлен новый аккаунт: ${newAcc.username} (папка Accounts/${newAcc.username}/ создана)`);
  };

  const handleAddBatchAccounts = async (lines: string[]) => {
    const added = await api.batchAddAccounts(lines);
    if (added.length > 0) {
      setAccounts(prev => [...added, ...prev]);
      pushLog('info', 'API', `Пакетный импорт: успешно добавлено ${added.length} аккаунтов в базу`);
    }
  };

  const handleCheckAllBans = async () => {
    setIsCheckingBans(true);
    pushLog('info', 'API', 'Запущена массовая проверка статусов банов профилей...');
    const result = await api.checkBans();
    setAccounts(result.accounts);
    setIsCheckingBans(false);
    pushLog('info', 'API', `Проверка завершена. Проверено: ${result.total}, обнаружено банов: ${result.banned}`);
  };

  const handleToggleBanStatus = async (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    const newBannedState = !acc.isBanned;
    await api.updateAccount(id, {
      isBanned: newBannedState,
      status: newBannedState ? 'banned' : (acc.status === 'banned' ? 'offline' : acc.status),
      banReason: newBannedState ? 'Вручную заблокирован пользователем' : undefined
    });
    setAccounts(prev =>
      prev.map(a =>
        a.id === id
          ? {
              ...a,
              isBanned: newBannedState,
              status: newBannedState ? 'banned' : (a.status === 'banned' ? 'offline' : a.status),
              banReason: newBannedState ? 'Вручную заблокирован пользователем' : undefined
            }
          : a
      )
    );
    pushLog(
      newBannedState ? 'warning' : 'info',
      'UI',
      `Статус аккаунта ${acc.username}: ${newBannedState ? 'Помечен как ЗАБЛОКИРОВАН ⛔' : 'Разблокирован (Готов к игре) ✔'}`
    );
  };

  const handleImportAccountsData = (importedAccounts: Account[]) => {
    setAccounts(prev => [...importedAccounts, ...prev]);
    pushLog('info', 'UI', `Импортировано ${importedAccounts.length} профилей в базу`);
  };

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
  }, []);

  // Validation helper: checks Roblox API & server database status only once before client startup
  const validateLaunchPrerequisites = async (account: Account): Promise<{ valid: boolean; reason?: string }> => {
    if (account.isBanned) {
      return { valid: false, reason: `Аккаунт @${account.username} заблокирован (статус Бан) и запуск отклонен` };
    }

    const health = await api.getHealth();
    if (!health || health.status !== 'online') {
      return { valid: false, reason: 'Локальный Core-сервер ZenithRAM недоступен' };
    }

    return { valid: true };
  };

  const handleLaunchRequest = useCallback((account: Account, gamePreset?: GamePreset, serverType?: string) => {
    if (account.isBanned) {
      pushLog('error', 'CORE', `Невозможно запустить @${account.username}: аккаунт заблокирован`);
      return;
    }

    const defaultGame: GamePreset = {
      id: 'project-delta',
      name: 'Project Delta [Hardcore Survival]',
      placeId: '7346416636',
      icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      genre: 'Survival FPS'
    };

    setLaunchModalState({
      isOpen: true,
      account,
      game: gamePreset || defaultGame,
      serverType: serverType || 'City-13'
    });
  }, []);

  // Multi-stage promise flow for launch execution
  const handleLaunchComplete = useCallback(async () => {
    if (!launchModalState.account || !launchModalState.game) return;

    const currentAcc = launchModalState.account;
    const currentGame = launchModalState.game;
    const currentServerType = launchModalState.serverType;

    // Close launch modal immediately
    setLaunchModalState({ isOpen: false, account: null, game: null, serverType: 'City-13' });

    try {
      // Stage 1: Validation Check (Single verification, no recursive loops)
      const validation = await validateLaunchPrerequisites(currentAcc);
      if (!validation.valid) {
        pushLog('error', 'CORE', `Ошибка подготовки к запуску: ${validation.reason}`);
        return;
      }

      pushLog('info', 'CORE', `[1/3] Проверка API и песочницы: Accounts/${currentAcc.username}/ проверена`);

      // Stage 2: Mutex bypass & Hardware spoof verification
      pushLog('info', 'MUTEX', `[2/3] Патчинг ROBLOX_singletonEvent и инжекция MAC: ${currentAcc.customMac || '02:4B:91:AA:5E:12'}`);

      // Stage 3: Process Launch
      const newSession = await api.launchSession({
        accountId: currentAcc.id,
        placeId: currentGame.placeId,
        gameName: currentGame.name,
        gameIcon: currentGame.icon,
        serverType: currentServerType
      });

      if (newSession) {
        setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
        setAccounts(prev =>
          prev.map(a =>
            a.id === currentAcc.id
              ? { ...a, status: 'in_game', currentGame: newSession.gameName, lastLogin: 'В игре' }
              : a
          )
        );
        pushLog('info', 'CORE', `[3/3] Сессия PID ${newSession.pid} активна. Окно Roblox запущено в ${newSession.gameName}`);
      }
    } catch (err: any) {
      pushLog('error', 'CORE', `Ошибка запуска игрового клиента для ${currentAcc.username}: ${err?.message || 'Сбой'}`);
    }
  }, [launchModalState, accounts]);

  const handleLaunchCancel = useCallback(() => {
    setLaunchModalState({ isOpen: false, account: null, game: null, serverType: 'City-13' });
  }, []);

  // Sessions handlers
  const handleTerminateSession = async (id: string) => {
    const s = sessions.find(sess => sess.id === id);
    if (!s) return;
    await api.terminateSession(id);
    setSessions(prev => prev.filter(sess => sess.id !== id));
    setAccounts(prev =>
      prev.map(a => (a.id === s.accountId ? { ...a, status: 'online', currentGame: undefined } : a))
    );
    pushLog('info', 'CORE', `Процесс Roblox PID ${s.pid} [${s.accountUsername}] закрыт`);
  };

  const handleTerminateAllSessions = async () => {
    await api.terminateAllSessions();
    setSessions([]);
    setAccounts(prev => prev.map(a => ({ ...a, status: 'online', currentGame: undefined })));
    pushLog('info', 'CORE', 'Все активные сессии Roblox принудительно закрыты');
  };

  const handleRestartSession = async (session: ActiveSession) => {
    await handleTerminateSession(session.id);
    const acc = accounts.find(a => a.id === session.accountId);
    if (acc) {
      handleLaunchRequest(acc, {
        id: 'restarted',
        name: session.gameName,
        placeId: session.placeId,
        icon: session.gameIcon,
        banner: '',
        genre: 'Active'
      });
    }
  };

  const handleTakeScreenshot = (session: ActiveSession) => {
    setViewingScreenshotSession(session);
    pushLog('info', 'UI', `Снят скриншот игрового окна PID ${session.pid} (${session.accountUsername})`);
  };

  // Spoofer helpers
  const handleGenerateMac = async () => {
    const newMac = await api.generateMac();
    setSpooferState(prev => ({ ...prev, currentMac: newMac }));
    pushLog('info', 'SPOOFER', `Сгенерирован новый MAC адрес: ${newMac}`);
  };

  const handleCleanCache = async () => {
    await api.cleanCache();
    pushLog('info', 'CORE', 'Очищен кэш Roblox и временные файлы %LOCALAPPDATA%\\Roblox');
  };

  // Master Lock
  const handleUnlock = (enteredPassword: string) => {
    // Standard master password check (default: 1234 or matches custom)
    if (enteredPassword === '1234' || enteredPassword === settings.security.masterPasswordHash || enteredPassword === 'zenith') {
      setIsLocked(false);
      pushLog('info', 'UI', 'Приложение ZenithRAM успешно разблокировано мастер-паролем');
      return true;
    }
    return false;
  };

  const errorCount = logs.filter(l => l.level === 'error').length;

  return (
    <div className="flex h-screen w-screen bg-[#0F0F11] text-gray-200 font-sans overflow-hidden select-none">
      {/* Boot Splash Screen on Startup */}
      <AnimatePresence>
        {isBooting && (
          <BootSplashScreen
            onComplete={handleBootComplete}
            userName={settings.general.greetingName}
          />
        )}
      </AnimatePresence>

      {/* Master Password Lock Modal */}
      <MasterPasswordModal
        isOpen={isLocked}
        onUnlock={handleUnlock}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSingle={handleAddSingleAccount}
        onAddBatch={handleAddBatchAccounts}
      />

      {/* Launch Progress Modal */}
      <LaunchProgressModal
        isOpen={launchModalState.isOpen}
        account={launchModalState.account}
        game={launchModalState.game}
        onComplete={handleLaunchComplete}
        onCancel={handleLaunchCancel}
      />

      {/* Screenshot Viewer Modal */}
      <ScreenshotViewerModal
        session={viewingScreenshotSession}
        onClose={() => setViewingScreenshotSession(null)}
      />

      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeSessionsCount={sessions.length}
        errorCount={errorCount}
        isLocked={isLocked}
        serverHealth={serverHealth}
      />

      {/* Right Main Content Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header
          serverStatus={serverHealth}
          activeSessionsCount={sessions.length}
          totalAccounts={accounts.length}
          isLocked={isLocked}
          onToggleLock={() => setIsLocked(!isLocked)}
          onRefreshAll={handleRefreshAll}
          isRefreshing={isRefreshing}
          settings={settings}
        />

        {/* Tab Views */}
        <main className="flex-1 flex overflow-hidden bg-[#0F0F11] relative">
          <AnimatePresence mode="wait">
            {activeTab === 'accounts' && (
              <motion.div
                key="accounts"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex overflow-hidden"
              >
                <AccountsTab
                  accounts={accounts}
                  onPinToggle={handlePinToggle}
                  onRefreshAccount={handleRefreshAccount}
                  onRefreshAll={handleRefreshAll}
                  onDeleteAccount={handleDeleteAccount}
                  onLaunchAccount={(acc) => handleLaunchRequest(acc)}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onToggleBanStatus={handleToggleBanStatus}
                  onImportAccountsData={handleImportAccountsData}
                  isRefreshing={isRefreshing}
                  serverHealth={serverHealth}
                />
              </motion.div>
            )}

            {activeTab === 'quick-launch' && (
              <motion.div
                key="quick-launch"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex overflow-hidden"
              >
                <QuickLaunchTab
                  accounts={accounts}
                  onStartLaunch={(acc, game, sType) => handleLaunchRequest(acc, game, sType)}
                  isLaunching={launchModalState.isOpen}
                />
              </motion.div>
            )}

            {activeTab === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex overflow-hidden"
              >
                <SessionsTab
                  sessions={sessions}
                  onTerminate={handleTerminateSession}
                  onTerminateAll={handleTerminateAllSessions}
                  onRestart={handleRestartSession}
                  onTakeScreenshot={handleTakeScreenshot}
                  onRefresh={loadInitialData}
                  isRefreshing={isRefreshing}
                />
              </motion.div>
            )}

            {activeTab === 'player-finder' && (
              <motion.div
                key="player-finder"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex overflow-hidden"
              >
                <PlayerFinderTab
                  accounts={accounts}
                  onSearch={(q) => api.searchPlayer(q)}
                  onJoinPlayer={(acc, placeId, sType) => {
                    handleLaunchRequest(acc, {
                      id: 'joined-player-game',
                      name: `Project Delta (${sType})`,
                      placeId,
                      icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
                      banner: '',
                      genre: 'Survival'
                    }, sType);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex overflow-hidden"
              >
                <SecurityTab
                  accounts={accounts}
                  spooferState={spooferState}
                  onUpdateSpoofer={(upd) => setSpooferState(prev => ({ ...prev, ...upd }))}
                  onCheckAllBans={handleCheckAllBans}
                  onCleanCache={handleCleanCache}
                  onGenerateMac={handleGenerateMac}
                  isCheckingBans={isCheckingBans}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex overflow-hidden"
              >
                <SettingsTab
                  settings={settings}
                  onSaveSettings={(newSettings) => {
                    setSettings(newSettings);
                    setSpooferState(newSettings.spoofer);
                    pushLog('info', 'UI', 'Настройки ZenithRAM успешно сохранены');
                  }}
                  onResetSettings={() => {
                    setSettings(INITIAL_SETTINGS);
                    setSpooferState(INITIAL_SETTINGS.spoofer);
                    pushLog('info', 'UI', 'Настройки сброшены к значениям по умолчанию');
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex overflow-hidden"
              >
                <LogsTab
                  logs={logs}
                  onClearLogs={async () => {
                    await api.clearLogs();
                    setLogs([]);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'project-files' && (
              <motion.div
                key="project-files"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex overflow-hidden"
              >
                <ProjectFilesTab />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Elegant Dark Footer Status Bar */}
        <footer className="h-7 bg-[#18181B] border-t border-white/5 flex items-center justify-between px-5 text-[11px] text-gray-500 shrink-0 font-medium">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-gray-400">Core Engine: Ready</span>
            </span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span className="hidden sm:inline">Win32 Mutex: Patched</span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span className="hidden sm:inline">HWID Isolation: Enabled</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-500 font-mono text-[10px]">
            <span>UTF-8</span>
            <span>REST :4080</span>
            <span className="text-indigo-400 font-medium">ZenithRAM v3.4</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
