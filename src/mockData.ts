import { Account, GamePreset, ActiveSession, AppSettings, LogEntry } from './types';

export const INITIAL_GAME_PRESETS: GamePreset[] = [
  {
    id: 'project-delta',
    name: 'Project Delta [Hardcore Survival]',
    placeId: '7346416636',
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    genre: 'Survival FPS',
    tags: ['Survival', 'PVP', 'FPS', 'Hardcore'],
    activePlayers: '14.2K'
  },
  {
    id: 'blox-fruits',
    name: 'Blox Fruits [Update 24]',
    placeId: '2753915549',
    icon: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80',
    genre: 'Anime RPG',
    tags: ['Sea 3', 'Raids', 'PVP', 'Adventure'],
    activePlayers: '482.6K'
  },
  {
    id: 'deepwoken',
    name: 'Deepwoken: Verse 2',
    placeId: '5735553160',
    icon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    genre: 'Roguelike RPG',
    tags: ['Hardcore', 'Permadeath', 'Action', 'RPG'],
    activePlayers: '28.9K'
  },
  {
    id: 'da-hood',
    name: 'Da Hood [REVAMP]',
    placeId: '2788229376',
    icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    genre: 'Action Shooter',
    tags: ['PVP', 'Bank', 'Gangs', 'Economy'],
    activePlayers: '34.5K'
  },
  {
    id: 'arsenal',
    name: 'Arsenal [Summer Update]',
    placeId: '2860908339',
    icon: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    genre: 'Competitive FPS',
    tags: ['Standard', 'Gun Rotation', 'Arcade', 'Multiplayer'],
    activePlayers: '19.1K'
  },
  {
    id: 'fisch',
    name: 'Fisch [Atlantis Expedition]',
    placeId: '16732667825',
    icon: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
    genre: 'Simulation Adventure',
    tags: ['Deep Ocean', 'Rod Enchant', 'Events', 'Fishing'],
    activePlayers: '95.4K'
  }
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    robloxId: '109283741',
    username: 'Saver',
    displayName: 'Saver_Main_R6',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=160&auto=format&fit=crop&q=80',
    headshotUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=160&auto=format&fit=crop&q=80',
    robuxBalance: 4250,
    createdDate: '14.03.2019',
    lastLogin: 'Сегодня, 11:42',
    isPinned: true,
    isBanned: false,
    status: 'online',
    customMac: '02:4B:91:AA:5E:12',
    customHwid: 'BFEBFBFF000906EA-UUID-991A',
    notes: 'Основной аккаунт для Project Delta'
  },
  {
    id: 'acc-2',
    robloxId: '482019485',
    username: 'ShadowNinja99',
    displayName: 'Zenith_Operative',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
    headshotUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
    robuxBalance: 820,
    createdDate: '28.11.2021',
    lastLogin: 'Вчера, 22:15',
    isPinned: true,
    isBanned: false,
    status: 'online',
    customMac: '02:8C:33:F1:04:88',
    customHwid: 'BFEBFBFF000906EA-UUID-442C',
    notes: 'Фарм-аккаунт Blox Fruits Sea 3'
  },
  {
    id: 'acc-3',
    robloxId: '774810294',
    username: 'GhostSniper_RU',
    displayName: 'Delta_Ghost',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80',
    headshotUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80',
    robuxBalance: 150,
    createdDate: '05.08.2022',
    lastLogin: '3 дня назад',
    isPinned: false,
    isBanned: false,
    status: 'offline',
    customMac: '02:D5:77:BC:88:1A',
    customHwid: 'BFEBFBFF000906EA-UUID-771E',
    notes: 'Разведчик и снайпер'
  },
  {
    id: 'acc-4',
    robloxId: '992817451',
    username: 'DeltaVanguard',
    displayName: 'Vanguard_PD',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80',
    headshotUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80',
    robuxBalance: 90,
    createdDate: '12.01.2023',
    lastLogin: '5 дней назад',
    isPinned: false,
    isBanned: false,
    status: 'offline',
    customMac: '02:11:4E:99:6B:33',
    customHwid: 'BFEBFBFF000906EA-UUID-1049',
    notes: 'Запасной профиль'
  },
  {
    id: 'acc-5',
    robloxId: '339182740',
    username: 'Rox_Legendary',
    displayName: 'Legend_Rox',
    avatarUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=160&auto=format&fit=crop&q=80',
    headshotUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=160&auto=format&fit=crop&q=80',
    robuxBalance: 12400,
    createdDate: '19.06.2018',
    lastLogin: 'Сегодня, 09:30',
    isPinned: false,
    isBanned: false,
    status: 'online',
    customMac: '02:FA:21:8D:CC:01',
    customHwid: 'BFEBFBFF000906EA-UUID-8833',
    notes: 'Трейд аккаунт с лимитками'
  },
  {
    id: 'acc-6',
    robloxId: '817264019',
    username: 'TestBanWatcher',
    displayName: 'Banned_Sample',
    avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=160&auto=format&fit=crop&q=80',
    headshotUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=160&auto=format&fit=crop&q=80',
    robuxBalance: 0,
    createdDate: '02.04.2023',
    lastLogin: '18.07.2024',
    isPinned: false,
    isBanned: true,
    banReason: 'Account Deleted (Violated Terms of Service)',
    status: 'banned',
    customMac: '02:EE:99:11:22:33',
    customHwid: 'BFEBFBFF000906EA-UUID-0000',
    notes: 'Тестовый аккаунт для проверки детектора'
  }
];

export const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'sess-101',
    pid: 14280,
    accountId: 'acc-1',
    robloxId: '109283741',
    accountUsername: 'Saver',
    accountAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=160&auto=format&fit=crop&q=80',
    placeId: '7346416636',
    gameName: 'Project Delta',
    gameIcon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
    serverId: '98fa201b-c12e-48a9-9812-78d91f1a23e1',
    startTime: '2026-08-21T10:14:00Z',
    uptimeSeconds: 1420,
    macAddress: '02:4B:91:AA:5E:12',
    hwid: 'BFEBFBFF000906EA-UUID-991A',
    volumeSerial: '4F89-A12C',
    status: 'active',
    cpuUsage: 7.4,
    memoryMb: 1140,
    gpuUsage: 14.2,
    vramMb: 420,
    screenshotUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'sess-102',
    pid: 18944,
    accountId: 'acc-2',
    robloxId: '482019485',
    accountUsername: 'ShadowNinja99',
    accountAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
    placeId: '2753915549',
    gameName: 'Blox Fruits',
    gameIcon: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=150&auto=format&fit=crop&q=80',
    serverId: '41cb8801-447f-4422-9011-4091a1df67cc',
    startTime: '2026-08-21T10:25:00Z',
    uptimeSeconds: 760,
    macAddress: '02:8C:33:F1:04:88',
    hwid: 'BFEBFBFF000906EA-UUID-442C',
    volumeSerial: '8B34-991F',
    status: 'active',
    cpuUsage: 5.8,
    memoryMb: 980,
    gpuUsage: 11.5,
    vramMb: 360,
    screenshotUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  general: {
    language: 'ru',
    theme: 'dark_purple',
    autoStartWithWindows: true,
    checkUpdatesOnStart: true,
    greetingName: 'Командир',
    customGreetingText: 'С возвращением в Zenith RAM V3.4.0',
    showGreetingBanner: true
  },
  ui: {
    cardSize: 'small',
    showIdInCard: true,
    showBalanceInCard: true,
    showRegDateInCard: false,
    animationsEnabled: true,
    sidebarCollapseDelay: 250,
    appearanceEffect: 'slide'
  },
  spoofer: {
    macEnabled: true,
    selectedAdapter: 'Ethernet (Realtek PCIe 2.5GbE)',
    currentMac: '02:4B:91:AA:5E:12',
    macFormat: '02_random',
    hwidEnabled: true,
    currentHwid: 'BFEBFBFF000906EA-UUID-991A',
    diskSerialEnabled: true,
    currentDiskSerial: '4F89-A12C',
    guidHwid: 'e39c41a0-8a12-4fe2-9214-419bcf8912d0',
    cleanCacheOnLaunch: true,
    restoreOnExit: true,
    zenithBypassActive: true,
    directMemoryPatch: true,
    gpuLimiterActive: true,
    gpuFpsLimit: 15,
    ocrAntiBanActive: true,
    changeIntervalMinutes: 30
  },
  discordRpc: {
    enabled: true,
    showGameName: true,
    showPlaceId: true,
    showElapsedTime: true,
    hideAccountDetails: true,
    statusText: 'Zenith RAM V3.4.0'
  },
  launch: {
    authMethod: 'cookie',
    maxWindows: 4,
    windowLayout: 'center_small',
    minimizeOnLaunch: false,
    killPreviousSessions: false,
    robloxPath: 'C:\\Users\\User\\AppData\\Local\\Roblox\\Versions\\version-Zenith\\RobloxPlayerBeta.exe'
  },
  network: {
    serverPort: 4080,
    proxyEnabled: false,
    proxyType: 'socks5',
    proxyAddress: '127.0.0.1:9050',
    telegramBotToken: '7829103912:AAG-SampleToken-ZenithRAM',
    telegramOwnerId: '519283741',
    twoFactorEnabled: false
  },
  security: {
    masterPasswordEnabled: false,
    masterPasswordHash: '',
    autoLockMinutes: 15,
    clearClipboardAfterSeconds: 5,
    requireSpooferForLaunch: false
  },
  logging: {
    logLevel: 'info',
    maxFileSizeMb: 50,
    logRotationDaily: true,
    clearLogsOnExit: false,
    autoLockAfterInactivity: true,
    autoLockMinutes: 15
  }
};

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    level: 'info',
    module: 'CORE',
    message: 'Zenith RAM V3.4.0 Engine успешно инициализирован на Windows 11 x64'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3550000).toISOString(),
    level: 'info',
    module: 'SERVER',
    message: 'Локальный REST-сервер запущен на http://127.0.0.1:4080 (SQLite синхронизирована)'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    level: 'info',
    module: 'MUTEX',
    message: 'Модуль Zenith Bypass V1.4.5 (ROBLOX_singletonEvent) активирован: мульти-клиент разблокирован'
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 3400000).toISOString(),
    level: 'info',
    module: 'SPOOFER',
    message: 'Спуфер MAC применен для адаптера Realtek PCIe: 02:4B:91:AA:5E:12'
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 3300000).toISOString(),
    level: 'info',
    module: 'OCR',
    message: 'Модуль OCR & Anti-Ban Detector активен (фильтрация сообщений киков/банов)'
  },
  {
    id: 'log-6',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    level: 'warning',
    module: 'API',
    message: 'Аккаунт TestBanWatcher помечен флагом блокировки в Roblox API (403 Forbidden)'
  }
];
