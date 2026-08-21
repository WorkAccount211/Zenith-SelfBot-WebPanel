export interface ServerHealth {
  status: string;
  version: string;
  port: number;
  serverUptime?: number;
  activeInstances?: number;
  totalAccounts?: number;
  mutexBypass?: boolean;
  spoofersActive?: boolean;
  roblox?: {
    isRunning: boolean;
    processCount: number;
    version: string;
    clientChannel: string;
    directory: string;
    executable: string;
    lastDetected: string;
  };
}

export interface Account {
  id: string;
  robloxId?: string;
  username: string;
  password?: string;
  displayName: string;
  avatarUrl: string;
  headshotUrl: string;
  robuxBalance: number;
  createdDate: string;
  lastLogin: string;
  isPinned: boolean;
  isBanned: boolean;
  banReason?: string;
  customMac?: string;
  customHwid?: string;
  cookie?: string;
  notes?: string;
  status: 'offline' | 'online' | 'in_game' | 'banned' | 'launching';
  currentGame?: string;
}

export interface GamePreset {
  id: string;
  name: string;
  placeId: string;
  icon: string;
  banner: string;
  genre: string;
  tags?: string[];
  activePlayers?: string;
}

export interface ActiveSession {
  id: string;
  pid: number;
  accountId: string;
  robloxId?: string;
  accountUsername: string;
  accountAvatar: string;
  placeId: string;
  gameName: string;
  gameIcon: string;
  serverId: string;
  startTime: string;
  uptimeSeconds: number;
  macAddress: string;
  hwid: string;
  volumeSerial: string;
  status: 'active' | 'frozen' | 'starting' | 'idle';
  cpuUsage: number;
  memoryMb: number;
  gpuUsage?: number;
  vramMb?: number;
  screenshotUrl?: string;
}

export interface PlayerSearchResult {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  inGame: boolean;
  currentGame?: {
    placeId: string;
    gameName: string;
    gameIcon?: string;
    serverId: string;
    playerCount: number;
    maxPlayers: number;
    pingMs: number;
  };
  lastSeen?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  module: 'UI' | 'API' | 'SPOOFER' | 'SERVER' | 'MUTEX' | 'CORE' | 'OCR' | 'DISCORD';
  message: string;
  repeatCount?: number;
  details?: string;
}

export interface SpooferState {
  macEnabled: boolean;
  selectedAdapter: string;
  currentMac: string;
  macFormat: '02_random' | 'custom' | 'preserve';
  hwidEnabled: boolean;
  currentHwid: string;
  diskSerialEnabled: boolean;
  currentDiskSerial: string;
  guidHwid: string;
  cleanCacheOnLaunch: boolean;
  restoreOnExit: boolean;
  zenithBypassActive: boolean;
  directMemoryPatch: boolean;
  gpuLimiterActive: boolean;
  gpuFpsLimit: number;
  ocrAntiBanActive: boolean;
  changeIntervalMinutes: number;
}

export interface DiscordRpcState {
  enabled: boolean;
  showGameName: boolean;
  showPlaceId: boolean;
  showElapsedTime: boolean;
  hideAccountDetails: boolean;
  statusText: string;
}

export interface AppSettings {
  general: {
    language: 'ru' | 'en' | 'auto';
    theme: 'dark_purple' | 'midnight' | 'cyberpunk';
    autoStartWithWindows: boolean;
    checkUpdatesOnStart: boolean;
    greetingName: string;
    customGreetingText: string;
    showGreetingBanner: boolean;
  };
  ui: {
    cardSize: 'small' | 'medium' | 'large';
    showIdInCard: boolean;
    showBalanceInCard: boolean;
    showRegDateInCard: boolean;
    animationsEnabled: boolean;
    sidebarCollapseDelay: number;
    appearanceEffect: 'slide' | 'fade' | 'zoom';
  };
  spoofer: SpooferState;
  discordRpc: DiscordRpcState;
  launch: {
    authMethod: 'cookie' | 'web_view';
    maxWindows: number; // 0 for unlimited, 1..N
    windowLayout: 'center_small' | 'grid' | 'cascade';
    minimizeOnLaunch: boolean;
    killPreviousSessions: boolean;
    robloxPath: string;
  };
  network: {
    serverPort: number;
    proxyEnabled: boolean;
    proxyType: 'http' | 'socks5';
    proxyAddress: string;
    telegramBotToken: string;
    telegramOwnerId: string;
    twoFactorEnabled: boolean;
  };
  security: {
    masterPasswordEnabled: boolean;
    masterPasswordHash?: string;
    autoLockMinutes: number;
    clearClipboardAfterSeconds: number;
    requireSpooferForLaunch: boolean;
  };
  logging: {
    logLevel: 'error' | 'warning' | 'info' | 'debug';
    maxFileSizeMb: number;
    logRotationDaily: boolean;
    clearLogsOnExit: boolean;
    autoLockAfterInactivity: boolean;
    autoLockMinutes: number;
  };
}

export interface LaunchStep {
  id: number;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  detail?: string;
}
