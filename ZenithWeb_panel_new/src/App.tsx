import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/ToastContainer';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CodeExportModal } from './components/CodeExportModal';
import { UpdateBanner } from './components/UpdateBanner';

import { DashboardTab } from './components/tabs/DashboardTab';
import { ServersTab } from './components/tabs/ServersTab';
import { CommandsTab } from './components/tabs/CommandsTab';
import { EmojisTab } from './components/tabs/EmojisTab';
import { MembersTab } from './components/tabs/MembersTab';
import { LogsTab } from './components/tabs/LogsTab';
import { StatsTab } from './components/tabs/StatsTab';
import { SettingsTab } from './components/tabs/SettingsTab';

import { botApi } from './services/api';
import { botWebSocket } from './services/websocket';
import { updateService } from './services/updateService';
import { DashboardStats, DiscordServer, DiscordEmoji, DiscordMember, LogEntry, BotSettings, StatsData, FirmwareUpdateInfo, CommandCatalogEntry } from './types/bot';
import { soundFX } from './utils/sound';

const MainAppContent: React.FC = () => {
  const { showToast } = useToast();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isBotOnline, setIsBotOnline] = useState(botApi.isLocalLive());

  // Settings & App State
  const [settings, setSettings] = useState<BotSettings>(botApi.getSettings());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [emojis, setEmojis] = useState<DiscordEmoji[]>([]);
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commandCatalog, setCommandCatalog] = useState<CommandCatalogEntry[]>([]);
  const [statsData, setStatsData] = useState<StatsData>(botApi.getStats());

  // Firmware & Service Worker Update State
  const [updateInfo, setUpdateInfo] = useState<FirmwareUpdateInfo>(updateService.getUpdateInfo());
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  // Initialize Service Worker & Update Manager
  useEffect(() => {
    updateService.register();
    const unsubscribe = updateService.subscribe((info) => {
      setUpdateInfo(info);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Connection State & Data Sync Subscription
  useEffect(() => {
    const unsubConnection = botApi.onConnectionChange((state) => {
      setIsBotOnline(state.isOnline);
    });

    const unsubDataSync = botApi.onDataSync((type, data) => {
      if (type === 'dashboard') setStats(data);
      else if (type === 'servers') setServers(Array.isArray(data) ? data : []);
      else if (type === 'emojis') setEmojis(Array.isArray(data) ? data : []);
      else if (type === 'members') setMembers(Array.isArray(data) ? data : []);
      else if (type === 'logs') setLogs(Array.isArray(data) ? data : []);
    });

    return () => {
      unsubConnection();
      unsubDataSync();
    };
  }, []);

  // Check saved session
  useEffect(() => {
    const saved = localStorage.getItem('discord_bot_panel_auth');
    if (saved) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch all initial data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [dash, srvs, emjs, mmbrs, lgs, cmds] = await Promise.all([
        botApi.getDashboard(),
        botApi.getServers(),
        botApi.getEmojis(),
        botApi.getMembers(),
        botApi.getLogs(),
        botApi.getCommandCatalog()
      ]);
      setStats(dash);
      setServers(Array.isArray(srvs) ? srvs : []);
      setEmojis(Array.isArray(emjs) ? emjs : []);
      setMembers(Array.isArray(mmbrs) ? mmbrs : []);
      setLogs(Array.isArray(lgs) ? lgs : []);
      setCommandCatalog(Array.isArray(cmds) ? cmds : []);
      setStatsData(botApi.getStats());
      setIsBotOnline(botApi.isLocalLive());
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // WebSocket Live Real-time Logs & Events Connection
  useEffect(() => {
    if (!isAuthenticated) return;

    // Connect WebSocket
    botWebSocket.connect(settings.apiUrl, settings.password);

    // Subscribe to incoming log entries
    const unsubscribeLogs = botWebSocket.onLog((newLog) => {
      setLogs((prev) => {
        const next = [...prev, newLog];
        return next.length > 200 ? next.slice(-200) : next;
      });
    });

    // Subscribe to raw bot events over websocket
    const unsubscribeMessages = botWebSocket.onMessage((data) => {
      if (!data) return;
      if (data.type === 'dashboard' || data.type === 'stats') {
        loadData();
      }
    });

    // Subscribe to status changes
    const unsubscribeStatus = botWebSocket.onStatusChange((status) => {
      setIsWsConnected(status === 'connected');
      if (status === 'connected') {
        setIsBotOnline(true);
      }
    });

    return () => {
      unsubscribeLogs();
      unsubscribeMessages();
      unsubscribeStatus();
      botWebSocket.disconnect();
    };
  }, [isAuthenticated, settings.apiUrl, settings.password, loadData]);

  // Periodic Polling for Live Bot Health, Telemetry & Auto-Pickup
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      const dash = await botApi.getDashboard();
      setStats(dash);
      setIsBotOnline(botApi.isLocalLive());
    }, (settings.refreshIntervalSeconds || 3) * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, settings.refreshIntervalSeconds]);

  // Auth Handler
  const handleLogin = async (password: string): Promise<boolean> => {
    const res = await botApi.login(password);
    if (res.success) {
      setIsAuthenticated(true);
      localStorage.setItem('discord_bot_panel_auth', password);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('discord_bot_panel_auth');
    setIsAuthenticated(false);
    showToast('Вы вышли из системы', 'info');
  };

  // Sound Toggle
  const handleToggleSound = () => {
    const newVal = !settings.soundEffects;
    soundFX.setEnabled(newVal);
    botApi.saveSettings({ soundEffects: newVal });
    setSettings((prev) => ({ ...prev, soundEffects: newVal }));
    showToast(newVal ? 'Звуковые эффекты включены' : 'Звуковые эффекты выключены', 'info');
  };

  // Save Settings
  const handleSaveSettings = (newSet: Partial<BotSettings>) => {
    botApi.saveSettings(newSet);
    setSettings(botApi.getSettings());
    loadData();
  };

  // Quick Command Execution
  const handleExecuteCommand = async (cmd: string) => {
    const res = await botApi.executeCommand(cmd);
    const [dash, lgs] = await Promise.all([botApi.getDashboard(), botApi.getLogs()]);
    setStats(dash);
    setLogs(Array.isArray(lgs) ? lgs : []);
    return res;
  };

  const handleChangeNick = async (nick: string) => {
    const res = await botApi.changeNick(nick);
    const dash = await botApi.getDashboard();
    setStats(dash);
    return res;
  };

  const handleChangeStream = async (title: string) => {
    const res = await botApi.changeStreamTitle(title);
    const lgs = await botApi.getLogs();
    setLogs(Array.isArray(lgs) ? lgs : []);
    return res;
  };

  // --- НОВЫЙ ОБРАБОТЧИК ДЛЯ ОЧИСТКИ СТРИМА ---
  const handleClearStream = async () => {
    const res = await botApi.clearStream();
    const lgs = await botApi.getLogs();
    setLogs(Array.isArray(lgs) ? lgs : []);
    return res;
  };

  const handleSendMessage = async (text: string, channelId?: string) => {
    const res = await botApi.sendMessage(text, channelId);
    const lgs = await botApi.getLogs();
    setLogs(Array.isArray(lgs) ? lgs : []);
    return res;
  };

  const handleDeleteEmoji = async (id: string) => {
    const res = await botApi.deleteEmoji(id);
    const emjs = await botApi.getEmojis();
    setEmojis(emjs);
    return res;
  };

  const handleClearLogs = async () => {
    botApi.clearLogs();
    const lgs = await botApi.getLogs();
    setLogs(Array.isArray(lgs) ? lgs : []);
  };

  const handleRefreshLogs = async () => {
    const lgs = await botApi.getLogs();
    setLogs(Array.isArray(lgs) ? lgs : []);
    showToast('Логи обновлены', 'info');
  };

  // Firmware & API Service Worker Update Handlers
  const handleCheckUpdates = async () => {
    const res = await updateService.checkForUpdates(true);
    return res;
  };

  const handleTriggerUpdate = async () => {
    setIsApplyingUpdate(true);
    const res = await updateService.triggerFirmwareUpdate();
    setIsApplyingUpdate(false);
    return res;
  };

  const handleSimulateUpdate = () => {
    updateService.simulateNewUpdate();
  };

  if (!isAuthenticated) {
    return <LoginModal isOpen={!isAuthenticated} onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#090812] text-slate-100 font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background ambient lighting */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-purple-700/15 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />

      {/* Sidebar Navigation */}
      {stats && (
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          botUser={stats.botUser}
          serversCount={servers.length}
          onLogout={handleLogout}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          hasUpdate={updateInfo.hasUpdate}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          currentTab={currentTab}
          ping={stats?.ping || 24}
          apiUrl={settings.apiUrl}
          isBotOnline={isBotOnline}
          soundEnabled={settings.soundEffects}
          onToggleSound={handleToggleSound}
          onRefreshData={loadData}
          onOpenCodeExport={() => setIsCodeExportOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isRefreshing={isRefreshing}
          isMockMode={settings.mockMode}
          hasUpdate={updateInfo.hasUpdate}
          onOpenSettings={() => setCurrentTab('settings')}
        />

        {/* Dynamic Tab Panes with Skeleton support */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Service Worker Firmware Update Banner */}
          <UpdateBanner
            updateInfo={updateInfo}
            onGoToSettings={() => setCurrentTab('settings')}
            onTriggerUpdate={handleTriggerUpdate}
            isUpdating={isApplyingUpdate}
          />

          {currentTab === 'dashboard' && stats && (
            <DashboardTab
              stats={stats}
              isLoading={isRefreshing && !stats}
              onExecuteQuickCommand={(cmd) => {
                handleExecuteCommand(cmd);
                setCurrentTab('commands');
              }}
            />
          )}

          {currentTab === 'servers' && (
            <ServersTab
              servers={servers}
              isLoading={isRefreshing && servers.length === 0}
              onSelectChannel={(chanId) => {
                handleSaveSettings({ outputChannelId: chanId });
                setCurrentTab('commands');
              }}
            />
          )}

          {currentTab === 'commands' && (
            <CommandsTab
              onExecuteCommand={handleExecuteCommand}
              onChangeNick={handleChangeNick}
              onChangeStream={handleChangeStream}
              onClearStream={handleClearStream}   // <-- НОВЫЙ ПРОПС
              onSendMessage={handleSendMessage}
              defaultChannelId={settings.outputChannelId}
              currentNickname={stats?.botUser?.username || 'ShadowWalker'}
              commandCatalog={commandCatalog}
            />
          )}

          {currentTab === 'emojis' && (
            <EmojisTab
              emojis={emojis}
              servers={servers}
              isLoading={isRefreshing && emojis.length === 0}
              onDeleteEmoji={handleDeleteEmoji}
            />
          )}

          {currentTab === 'members' && (
            <MembersTab
              members={members}
              isLoading={isRefreshing && members.length === 0}
              onUpdateMembers={async (updated) => {
                setMembers(updated);
                const lgs = await botApi.getLogs();
                setLogs(Array.isArray(lgs) ? lgs : []);
              }}
              onRefreshMembers={loadData}
            />
          )}

          {currentTab === 'logs' && (
            <LogsTab
              logs={logs}
              onClearLogs={handleClearLogs}
              onRefreshLogs={handleRefreshLogs}
              autoRefresh={settings.autoRefreshLogs}
              onToggleAutoRefresh={(val) => handleSaveSettings({ autoRefreshLogs: val })}
              isRefreshing={isRefreshing}
              wsConnected={isWsConnected}
            />
          )}

          {currentTab === 'stats' && (
            <StatsTab
              statsData={statsData}
              isLoading={isRefreshing && !statsData}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onRestartBot={() => botApi.restartBot()}
              onCheckApiHealth={() => botApi.checkHealth()}
              updateInfo={updateInfo}
              onCheckUpdates={handleCheckUpdates}
              onTriggerUpdate={handleTriggerUpdate}
              onSimulateUpdate={handleSimulateUpdate}
            />
          )}
        </main>
      </div>

      {/* Code Export Modal */}
      <CodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}