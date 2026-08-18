import { DashboardStats, DiscordServer, DiscordEmoji, DiscordMember, LogEntry, StatsData } from '../types/bot';

export const INITIAL_STATS: DashboardStats = {
  ping: 28,
  serversCount: 14,
  membersCount: 8420,
  uptimeSeconds: 87420, // ~1 day, 18 mins
  ramUsageMB: 142.6,
  messagesProcessed: 14930,
  commandsExecuted: 384,
  botUser: {
    id: '782910482910482910',
    username: 'PhantomSelf',
    discriminator: '0001',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    status: 'dnd',
    customStatus: '⚡ Controlling the Matrix | .help',
    nitro: true,
    badges: ['HypeSquad Bravery', 'Early Supporter', 'Active Developer']
  },
  lastSyncTime: new Date().toLocaleTimeString('ru-RU'),
  dailyCommandUsage: [
    { day: 'Пн', date: '12 Авг', commands: 42, messages: 1820 },
    { day: 'Вт', date: '13 Авг', commands: 58, messages: 2140 },
    { day: 'Ср', date: '14 Авг', commands: 85, messages: 2890 },
    { day: 'Чт', date: '15 Авг', commands: 64, messages: 2430 },
    { day: 'Пт', date: '16 Авг', commands: 112, messages: 3650 },
    { day: 'Сб', date: '17 Авг', commands: 145, messages: 4120 },
    { day: 'Вс', date: '18 Авг', commands: 98, messages: 3290 }
  ]
};

export const MOCK_SERVERS: DiscordServer[] = [
  {
    id: '104829104829104829',
    name: 'Cyberpunk Underground',
    icon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=160&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    memberCount: 2450,
    channelsCount: 38,
    rolesCount: 24,
    ownerId: '782910482910482910',
    joinedAt: '2023-11-14',
    channels: [
      { id: '104829104829104830', name: '💬-general-chat', type: 'text' },
      { id: '104829104829104831', name: '🤖-bot-commands', type: 'text' },
      { id: '104829104829104832', name: '📢-announcements', type: 'announcement' },
      { id: '104829104829104833', name: '🔊-lounge-room', type: 'voice' },
      { id: '104829104829104834', name: '🎮-gaming-hub', type: 'text' }
    ]
  },
  {
    id: '204918204918204918',
    name: 'Neo Tokyo VIP',
    icon: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=160&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    memberCount: 1890,
    channelsCount: 42,
    rolesCount: 19,
    ownerId: '984719284719284719',
    joinedAt: '2024-01-20',
    channels: [
      { id: '204918204918204919', name: '✨-vip-lounge', type: 'text' },
      { id: '204918204918204920', name: '🔥-memes-drop', type: 'text' },
      { id: '204918204918204921', name: '💎-crypto-alpha', type: 'text' }
    ]
  },
  {
    id: '304918204918204919',
    name: 'Dev Squad & Scripts',
    icon: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160&auto=format&fit=crop&q=80',
    memberCount: 890,
    channelsCount: 22,
    rolesCount: 12,
    ownerId: '782910482910482910',
    joinedAt: '2024-03-05',
    channels: [
      { id: '304918204918204920', name: '💻-code-review', type: 'text' },
      { id: '304918204918204921', name: '🐍-python-aiohttp', type: 'text' },
      { id: '304918204918204922', name: '🚀-releases', type: 'announcement' }
    ]
  },
  {
    id: '404918204918204920',
    name: 'Vaporwave Sanctuary',
    icon: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=160&auto=format&fit=crop&q=80',
    memberCount: 1420,
    channelsCount: 18,
    rolesCount: 15,
    ownerId: '472918204918204920',
    joinedAt: '2024-04-12',
    channels: [
      { id: '404918204918204921', name: '🌴-chill-zone', type: 'text' },
      { id: '404918204918204922', name: '🎵-synth-beats', type: 'voice' }
    ]
  },
  {
    id: '504918204918204921',
    name: 'Private Testing Lab',
    icon: 'https://images.unsplash.com/photo-1516116211227-bbc13c7784fb?w=160&auto=format&fit=crop&q=80',
    memberCount: 6,
    channelsCount: 8,
    rolesCount: 5,
    ownerId: '782910482910482910',
    joinedAt: '2024-05-01',
    channels: [
      { id: '504918204918204922', name: '🛠-debug-console', type: 'text' },
      { id: '504918204918204923', name: '🧪-webhook-test', type: 'text' }
    ]
  }
];

export const MOCK_EMOJIS: DiscordEmoji[] = [
  {
    id: '110000000000000001',
    name: 'pepe_matrix',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9d0.png',
    animated: false,
    serverId: '104829104829104829',
    serverName: 'Cyberpunk Underground'
  },
  {
    id: '110000000000000002',
    name: 'cat_hypervibing',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f63d.png',
    animated: true,
    serverId: '104829104829104829',
    serverName: 'Cyberpunk Underground'
  },
  {
    id: '110000000000000003',
    name: 'neon_fire',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png',
    animated: true,
    serverId: '104829104829104829',
    serverName: 'Cyberpunk Underground'
  },
  {
    id: '110000000000000004',
    name: 'purple_diamond',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48e.png',
    animated: false,
    serverId: '104829104829104829',
    serverName: 'Cyberpunk Underground'
  },
  {
    id: '110000000000000005',
    name: 'skull_glitch',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f480.png',
    animated: true,
    serverId: '104829104829104829',
    serverName: 'Cyberpunk Underground'
  },
  {
    id: '110000000000000006',
    name: 'cyber_crown',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f451.png',
    animated: false,
    serverId: '104829104829104829',
    serverName: 'Cyberpunk Underground'
  },
  {
    id: '110000000000000007',
    name: 'radioactive_glow',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2622.png',
    animated: true,
    serverId: '104829104829104829',
    serverName: 'Cyberpunk Underground'
  },
  {
    id: '110000000000000008',
    name: 'nitro_booster',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2728.png',
    animated: false,
    serverId: '104829104829104829',
    serverName: 'Cyberpunk Underground'
  }
];

export const MOCK_MEMBERS: DiscordMember[] = [
  {
    id: '782910482910482910',
    username: 'PhantomSelf',
    nickname: '★ Cyber Overlord ★',
    discriminator: '0001',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    status: 'dnd',
    bot: false,
    joinedAt: '2023-11-14',
    roles: ['Owner', 'Cyber Legend', 'Nitro Booster']
  },
  {
    id: '920194820194820194',
    username: 'Aelita_Code',
    nickname: 'Aelita [Dev]',
    discriminator: '1337',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    status: 'online',
    bot: false,
    joinedAt: '2023-11-15',
    roles: ['Admin', 'Frontend Lead']
  },
  {
    id: '819204819204819204',
    username: 'ShadowByte',
    nickname: 'ByteRunner',
    discriminator: '4040',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    status: 'idle',
    bot: false,
    joinedAt: '2023-12-01',
    roles: ['Moderator', 'Security']
  },
  {
    id: '719284719284719284',
    username: 'Midjourney_Bot',
    discriminator: '0000',
    avatar: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=120&auto=format&fit=crop&q=80',
    status: 'online',
    bot: true,
    joinedAt: '2023-12-05',
    roles: ['Bot', 'Generative AI']
  },
  {
    id: '619284719284719284',
    username: 'Valkyrie_Rose',
    nickname: 'Val 🌹',
    discriminator: '7777',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    status: 'offline',
    bot: false,
    joinedAt: '2024-01-10',
    roles: ['VIP Member', 'Graphic Designer']
  },
  {
    id: '519284719284719284',
    username: 'Kairo_Synth',
    nickname: 'Synthwave DJ',
    discriminator: '8080',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    status: 'online',
    bot: false,
    joinedAt: '2024-02-14',
    roles: ['Music Curator', 'Audio Master']
  },
  {
    id: '419284719284719284',
    username: 'GlitchMaster_99',
    discriminator: '9999',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    status: 'dnd',
    bot: false,
    joinedAt: '2024-03-02',
    roles: ['Elite Member']
  },
  {
    id: '319284719284719284',
    username: 'ZeroCool',
    nickname: 'Zero',
    discriminator: '0101',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    status: 'idle',
    bot: false,
    joinedAt: '2024-03-18',
    roles: ['Member']
  }
];

export const MOCK_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '02:08:12',
    level: 'INFO',
    message: '[aiohttp.web] Server started at http://localhost:8080 (REST API active)',
    source: 'system'
  },
  {
    id: 'log-2',
    timestamp: '02:08:14',
    level: 'INFO',
    message: '[discord.py-self] Logged in as PhantomSelf#0001 (ID: 782910482910482910)',
    source: 'discord'
  },
  {
    id: 'log-3',
    timestamp: '02:08:15',
    level: 'DEBUG',
    message: 'Loaded cogs: cogs.general, cogs.utility, cogs.moderation, cogs.fun',
    source: 'loader'
  },
  {
    id: 'log-4',
    timestamp: '02:08:29',
    level: 'COMMAND',
    message: 'User executed command: .ping (Latency: 28ms)',
    source: 'commands'
  },
  {
    id: 'log-5',
    timestamp: '02:08:44',
    level: 'INFO',
    message: 'Syncing guild cache: 14 servers, 8,420 total members cached.',
    source: 'cache'
  },
  {
    id: 'log-6',
    timestamp: '02:09:02',
    level: 'WARN',
    message: 'Rate limit bucket approaching for channel 104829104829104830 (delay 0.45s applied)',
    source: 'rate_limiter'
  },
  {
    id: 'log-7',
    timestamp: '02:09:18',
    level: 'COMMAND',
    message: 'User executed command: .purge 5 in channel 104829104829104830 -> 5 messages deleted',
    source: 'commands'
  },
  {
    id: 'log-8',
    timestamp: '02:09:25',
    level: 'INFO',
    message: 'Output channel set to 104829104829104831 (#bot-commands)',
    source: 'api'
  },
  {
    id: 'log-9',
    timestamp: '02:09:30',
    level: 'DEBUG',
    message: 'Heartbeat acknowledged by Discord Gateway (seq: 4892)',
    source: 'gateway'
  }
];

export const MOCK_STATS: StatsData = {
  commandUsageDaily: [
    { day: 'Пн', count: 42 },
    { day: 'Вт', count: 58 },
    { day: 'Ср', count: 85 },
    { day: 'Чт', count: 64 },
    { day: 'Пт', count: 112 },
    { day: 'Сб', count: 145 },
    { day: 'Вс', count: 98 }
  ],
  hourlyActivity: [
    { hour: '00:00', count: 12 },
    { hour: '03:00', count: 4 },
    { hour: '06:00', count: 8 },
    { hour: '09:00', count: 34 },
    { hour: '12:00', count: 68 },
    { hour: '15:00', count: 92 },
    { hour: '18:00', count: 130 },
    { hour: '21:00', count: 110 }
  ],
  topCommands: [
    { command: '.purge', count: 142 },
    { command: '.ping', count: 98 },
    { command: '.say', count: 64 },
    { command: '.nick', count: 48 },
    { command: '.afk', count: 32 }
  ],
  latencyHistory: [
    { time: '02:00', ping: 32 },
    { time: '02:02', ping: 29 },
    { time: '02:04', ping: 35 },
    { time: '02:06', ping: 27 },
    { time: '02:08', ping: 28 },
    { time: '02:09', ping: 26 }
  ]
};
