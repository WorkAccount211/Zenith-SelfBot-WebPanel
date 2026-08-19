export interface BotUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  nitro: boolean;
  badges: string[];
}

export interface DailyUsageItem {
  day: string;
  date: string;
  commands: number;
  messages: number;
}

export interface DashboardStats {
  ping: number;
  serversCount: number;
  membersCount: number;
  uptimeSeconds: number;
  ramUsageMB: number;
  messagesProcessed: number;
  commandsExecuted: number;
  botUser: BotUser;
  lastSyncTime: string;
  dailyCommandUsage?: DailyUsageItem[];
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
}

export interface DiscordServer {
  id: string;
  name: string;
  icon: string;
  banner?: string;
  memberCount: number;
  channelsCount: number;
  rolesCount: number;
  ownerId: string;
  joinedAt: string;
  channels: DiscordChannel[];
}

export interface DiscordEmoji {
  id: string;
  name: string;
  url: string;
  animated: boolean;
  serverId: string;
  serverName: string;
}

export interface DiscordMember {
  id: string;
  username: string;
  nickname?: string;
  discriminator: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  bot: boolean;
  joinedAt: string;
  roles: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'COMMAND';
  message: string;
  source?: string;
}

export interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  response: string;
  executionTimeMs: number;
}

export interface CommandPreset {
  id: string;
  label: string;
  command: string;
  description?: string;
  category?: 'utility' | 'moderation' | 'fun' | 'status' | 'custom' | string;
}

export interface CommandCatalogEntry {
  name: string;
  aliases?: string[];
  category: string;
  description: string;
  usage?: string;
  cooldown?: number;
  full_name?: string;
}

export interface NicknameRotatorConfig {
  enabled: boolean;
  intervalSeconds: number;
  mode: 'sequential' | 'random';
  originalNickname: string;
  nicknames: string[];
}

export interface BotSettings {
  apiUrl: string;
  password: string;
  outputChannelId: string;
  autoRefreshLogs: boolean;
  refreshIntervalSeconds: number;
  soundEffects: boolean;
  mockMode: boolean;
  accentColor: 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose';
}

export interface StatsData {
  commandUsageDaily: { day: string; count: number }[];
  hourlyActivity: { hour: string; count: number }[];
  topCommands: { command: string; count: number }[];
  latencyHistory: { time: string; ping: number }[];
}

export interface FirmwareUpdateInfo {
  currentFirmwareVersion: string;
  currentApiVersion: string;
  swVersion: string;
  hasUpdate: boolean;
  pendingFirmwareVersion?: string;
  pendingApiVersion?: string;
  releaseDate?: string;
  changelog?: string[];
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'updated' | 'error';
  lastChecked?: string;
  progress?: number;
  currentStepMessage?: string;
  isServiceWorkerActive?: boolean;
}
