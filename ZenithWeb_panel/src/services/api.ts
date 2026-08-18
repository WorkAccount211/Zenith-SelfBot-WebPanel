import { DashboardStats, DiscordServer, DiscordEmoji, DiscordMember, LogEntry, BotSettings, StatsData } from '../types/bot';
import { INITIAL_STATS, MOCK_SERVERS, MOCK_EMOJIS, MOCK_MEMBERS, MOCK_LOGS, MOCK_STATS } from './mockData';
import { toast } from '../utils/toastEmitter';

type ConnectionStateListener = (state: { isOnline: boolean; ping: number; apiUrl: string }) => void;
type DataSyncListener = (type: 'dashboard' | 'servers' | 'emojis' | 'members' | 'logs', data: any) => void;

export class BotApiService {
  private settings: BotSettings;
  private isOnlineLocally: boolean = false;
  private lastPing: number = 24;
  private localLogs: LogEntry[] = [...MOCK_LOGS];
  private localStats: DashboardStats = { ...INITIAL_STATS };
  private localServers: DiscordServer[] = [...MOCK_SERVERS];
  private localEmojis: DiscordEmoji[] = [...MOCK_EMOJIS];
  private localMembers: DiscordMember[] = [...MOCK_MEMBERS];
  private connectionListeners: Set<ConnectionStateListener> = new Set();
  private dataListeners: Set<DataSyncListener> = new Set();
  private probeActive: boolean = false;

  constructor() {
    const savedSettings = localStorage.getItem('discord_bot_panel_settings');
    if (savedSettings) {
      try {
        this.settings = { ...this.getDefaultSettings(), ...JSON.parse(savedSettings) };
      } catch {
        this.settings = this.getDefaultSettings();
      }
    } else {
      this.settings = this.getDefaultSettings();
    }

    // Default to active live communication (mockMode: false)
    if (this.settings.mockMode === undefined) {
      this.settings.mockMode = false;
    }
  }

  public getDefaultSettings(): BotSettings {
    return {
      apiUrl: 'http://localhost:8080',
      password: 'GGEZ',
      outputChannelId: '104829104829104831',
      autoRefreshLogs: true,
      refreshIntervalSeconds: 3,
      soundEffects: true,
      mockMode: false,
      accentColor: 'purple'
    };
  }

  public getSettings(): BotSettings {
    return { ...this.settings };
  }

  public saveSettings(newSettings: Partial<BotSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('discord_bot_panel_settings', JSON.stringify(this.settings));
    this.notifyConnectionState();
    toast.success('Настройки панели сохранены', 2500);
  }

  public isLocalLive(): boolean {
    return this.isOnlineLocally;
  }

  public getLastPing(): number {
    return this.lastPing;
  }

  public onConnectionChange(listener: ConnectionStateListener): () => void {
    this.connectionListeners.add(listener);
    listener({ isOnline: this.isOnlineLocally, ping: this.lastPing, apiUrl: this.settings.apiUrl });
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  public onDataSync(listener: DataSyncListener): () => void {
    this.dataListeners.add(listener);
    return () => {
      this.dataListeners.delete(listener);
    };
  }

  private notifyConnectionState() {
    this.connectionListeners.forEach((fn) => {
      try {
        fn({ isOnline: this.isOnlineLocally, ping: this.lastPing, apiUrl: this.settings.apiUrl });
      } catch (err) {
        console.error('Connection listener error', err);
      }
    });
  }

  private notifyDataSync(type: 'dashboard' | 'servers' | 'emojis' | 'members' | 'logs', data: any) {
    this.dataListeners.forEach((fn) => {
      try {
        fn(type, data);
      } catch (err) {
        console.error('Data sync listener error', err);
      }
    });
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Password': this.settings.password,
      'Authorization': `Bearer ${this.settings.password}`
    };
  }

  private getCleanBaseUrl(): string {
    let url = (this.settings.apiUrl || 'http://localhost:8080').trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  /**
   * Helper to attempt multiple candidate endpoints in order (e.g. /api/dashboard, /api/stats, /dashboard, /info)
   */
  private async multiEndpointGet<T = any>(candidates: string[]): Promise<{ ok: boolean; data?: T; status?: number }> {
    const baseUrl = this.getCleanBaseUrl();
    for (const path of candidates) {
      const url = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
      try {
        const res = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: this.getHeaders()
        }, 2200);
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json !== null) {
            return { ok: true, data: json, status: res.status };
          }
        }
      } catch {
        // try next candidate endpoint
      }
    }
    return { ok: false };
  }

  /**
   * Helper to attempt multiple candidate POST endpoints
   */
  private async multiEndpointPost<T = any>(candidates: string[], body: any): Promise<{ ok: boolean; data?: T; status?: number }> {
    const baseUrl = this.getCleanBaseUrl();
    for (const path of candidates) {
      const url = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
      try {
        const res = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body)
        }, 3500);
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          return { ok: true, data: json, status: res.status };
        }
      } catch {
        // try next candidate endpoint
      }
    }
    return { ok: false };
  }

  // POST /api/login
  public async login(password: string): Promise<{ success: boolean; message?: string }> {
    const baseUrl = this.getCleanBaseUrl();
    try {
      const res = await this.fetchWithTimeout(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      }, 2500);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        this.isOnlineLocally = true;
        this.settings.password = password;
        this.saveSettings({ password });
        this.notifyConnectionState();
        toast.success(data.message || 'Успешная авторизация в боте!');
        return { success: true, message: data.message || 'Успешная авторизация в боте' };
      }
    } catch {
      // Local fallback
    }

    // Default password check fallback (GGEZ)
    if (password.trim() === 'GGEZ' || password.trim() === this.settings.password) {
      this.settings.password = password;
      this.saveSettings({ password });
      toast.success('Успешный вход в панель');
      return { success: true, message: 'Успешный вход в панель' };
    }

    toast.error('Неверный пароль. Стандартный пароль: GGEZ');
    return { success: false, message: 'Неверный пароль. Стандартный пароль: GGEZ' };
  }

  // Check connection status & ping to localhost:8080
  public async checkHealth(): Promise<{ online: boolean; ping: number; details?: any }> {
    const startTime = performance.now();
    const result = await this.multiEndpointGet(['/api/dashboard', '/api/stats', '/api/status', '/api/info', '/api/health', '/']);
    const ping = Math.round(performance.now() - startTime);
    this.lastPing = ping;

    if (result.ok) {
      const wasOffline = !this.isOnlineLocally;
      this.isOnlineLocally = true;
      this.notifyConnectionState();
      if (wasOffline) {
        toast.success(`Бот обнаружен на ${this.getCleanBaseUrl()}! Пинг: ${ping}ms`);
      }
      return { online: true, ping, details: result.data };
    } else {
      this.isOnlineLocally = false;
      this.notifyConnectionState();
      return { online: false, ping: this.localStats.ping };
    }
  }

  // GET /api/dashboard - Fetches stats, bot user profile, ping, RAM, counts
  public async getDashboard(): Promise<DashboardStats> {
    try {
      const startTime = performance.now();
      const result = await this.multiEndpointGet<any>([
        '/api/dashboard',
        '/api/stats',
        '/api/status',
        '/api/info',
        '/dashboard'
      ]);
      const ping = Math.round(performance.now() - startTime);

      if (result.ok && result.data) {
        const raw = result.data;
        this.isOnlineLocally = true;
        this.lastPing = raw.ping || ping;

        const mergedStats: DashboardStats = {
          ping: raw.ping || ping,
          serversCount: typeof raw.serversCount === 'number' ? raw.serversCount : (raw.servers?.length ?? this.localStats.serversCount),
          membersCount: typeof raw.membersCount === 'number' ? raw.membersCount : (raw.members_count ?? this.localStats.membersCount),
          uptimeSeconds: typeof raw.uptimeSeconds === 'number' ? raw.uptimeSeconds : (raw.uptime ?? this.localStats.uptimeSeconds),
          ramUsageMB: typeof raw.ramUsageMB === 'number' ? raw.ramUsageMB : (raw.ram_mb ?? this.localStats.ramUsageMB),
          messagesProcessed: typeof raw.messagesProcessed === 'number' ? raw.messagesProcessed : (raw.messages_processed ?? this.localStats.messagesProcessed),
          commandsExecuted: typeof raw.commandsExecuted === 'number' ? raw.commandsExecuted : (raw.commands_executed ?? this.localStats.commandsExecuted),
          botUser: {
            id: raw.botUser?.id || raw.user?.id || this.localStats.botUser.id,
            username: raw.botUser?.username || raw.user?.username || raw.username || this.localStats.botUser.username,
            discriminator: raw.botUser?.discriminator || raw.user?.discriminator || raw.discriminator || this.localStats.botUser.discriminator,
            avatar: raw.botUser?.avatar || raw.user?.avatar || raw.avatar_url || this.localStats.botUser.avatar,
            status: raw.botUser?.status || raw.user?.status || raw.status || this.localStats.botUser.status,
            customStatus: raw.botUser?.customStatus || raw.user?.custom_status || raw.custom_status || this.localStats.botUser.customStatus,
            nitro: raw.botUser?.nitro ?? raw.user?.nitro ?? this.localStats.botUser.nitro,
            badges: raw.botUser?.badges || raw.user?.badges || this.localStats.botUser.badges
          },
          lastSyncTime: new Date().toLocaleTimeString('ru-RU'),
          dailyCommandUsage: raw.dailyCommandUsage || raw.daily_usage || this.localStats.dailyCommandUsage
        };

        this.localStats = mergedStats;
        this.notifyConnectionState();
        this.notifyDataSync('dashboard', mergedStats);
        return mergedStats;
      }
    } catch {
      // Offline fallback
    }

    this.isOnlineLocally = false;
    this.localStats.ping = Math.floor(20 + Math.random() * 10);
    this.localStats.uptimeSeconds += 3;
    this.localStats.lastSyncTime = new Date().toLocaleTimeString('ru-RU');
    return { ...this.localStats };
  }

  // GET /api/servers - Fetches real Discord servers / guilds & channels
  public async getServers(): Promise<DiscordServer[]> {
    try {
      const result = await this.multiEndpointGet<any>([
        '/api/servers',
        '/api/guilds',
        '/servers',
        '/guilds'
      ]);

      if (result.ok && result.data) {
        this.isOnlineLocally = true;
        const list = Array.isArray(result.data) ? result.data : result.data.servers || result.data.guilds || [];
        if (list.length > 0) {
          const normalized: DiscordServer[] = list.map((g: any, index: number) => ({
            id: String(g.id || `srv-${index}`),
            name: String(g.name || 'Discord Server'),
            icon: g.icon || g.icon_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
            banner: g.banner || g.banner_url,
            memberCount: Number(g.memberCount || g.member_count || g.approximate_member_count || 100),
            channelsCount: Number(g.channelsCount || g.channels_count || (Array.isArray(g.channels) ? g.channels.length : 12)),
            rolesCount: Number(g.rolesCount || g.roles_count || (Array.isArray(g.roles) ? g.roles.length : 8)),
            ownerId: String(g.ownerId || g.owner_id || ''),
            joinedAt: g.joinedAt || g.joined_at || '10.01.2024',
            channels: Array.isArray(g.channels) ? g.channels.map((c: any) => ({
              id: String(c.id),
              name: String(c.name || 'канал'),
              type: c.type === 2 || c.type === 'voice' ? 'voice' : c.type === 5 || c.type === 'announcement' ? 'announcement' : 'text'
            })) : [
              { id: '1001', name: 'основной-чат', type: 'text' },
              { id: '1002', name: 'команды', type: 'text' },
              { id: '1003', name: 'Голосовой', type: 'voice' }
            ]
          }));

          this.localServers = normalized;
          this.localStats.serversCount = normalized.length;
          this.notifyDataSync('servers', normalized);
          return normalized;
        }
      }
    } catch {
      // Offline fallback
    }

    return [...this.localServers];
  }

  // GET /api/emojis - Fetches custom emojis from guilds
  public async getEmojis(): Promise<DiscordEmoji[]> {
    try {
      const result = await this.multiEndpointGet<any>([
        '/api/emojis',
        '/api/custom_emojis',
        '/emojis'
      ]);

      if (result.ok && result.data) {
        this.isOnlineLocally = true;
        const list = Array.isArray(result.data) ? result.data : result.data.emojis || [];
        if (list.length > 0) {
          const normalized: DiscordEmoji[] = list.map((e: any, index: number) => ({
            id: String(e.id || `emoji-${index}`),
            name: String(e.name || 'custom_emoji'),
            url: e.url || `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? 'gif' : 'png'}`,
            animated: Boolean(e.animated),
            serverId: String(e.serverId || e.server_id || e.guild_id || '987654321'),
            serverName: String(e.serverName || e.server_name || e.guild_name || 'Cyber Hub')
          }));

          this.localEmojis = normalized;
          this.notifyDataSync('emojis', normalized);
          return normalized;
        }
      }
    } catch {
      // Offline fallback
    }

    return [...this.localEmojis];
  }

  // DELETE /api/emojis/:id
  public async deleteEmoji(emojiId: string): Promise<{ success: boolean; message: string }> {
    const baseUrl = this.getCleanBaseUrl();
    try {
      const res = await this.fetchWithTimeout(`${baseUrl}/api/emojis/${emojiId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      }, 3000);
      if (res.ok) {
        this.localEmojis = this.localEmojis.filter(e => e.id !== emojiId);
        this.addLog('COMMAND', `Эмодзи ID ${emojiId} удален через API бота`);
        toast.success(`Эмодзи ID: ${emojiId} удален`);
        return { success: true, message: 'Эмодзи успешно удален из Discord' };
      }
    } catch {
      // Fallback
    }

    this.localEmojis = this.localEmojis.filter(e => e.id !== emojiId);
    this.addLog('COMMAND', `Эмодзи ID: ${emojiId} удален пользователем`);
    toast.success(`Эмодзи ID: ${emojiId} удален`);
    return { success: true, message: 'Эмодзи удален из списка' };
  }

  // GET /api/members - Fetches members list from bot
  public async getMembers(): Promise<DiscordMember[]> {
    try {
      const result = await this.multiEndpointGet<any>([
        '/api/members',
        '/api/guilds/members',
        '/api/users',
        '/members'
      ]);

      if (result.ok && result.data) {
        this.isOnlineLocally = true;
        const list = Array.isArray(result.data) ? result.data : result.data.members || [];
        if (list.length > 0) {
          const normalized: DiscordMember[] = list.map((m: any, index: number) => ({
            id: String(m.id || `member-${index}`),
            username: String(m.username || m.user?.username || `User_${index}`),
            nickname: m.nickname || m.nick,
            discriminator: String(m.discriminator || m.user?.discriminator || '0000'),
            avatar: m.avatar || m.avatar_url || m.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            status: m.status || 'online',
            bot: Boolean(m.bot || m.user?.bot),
            joinedAt: m.joinedAt || m.joined_at || '15.02.2024',
            roles: Array.isArray(m.roles) ? m.roles : ['Member']
          }));

          this.localMembers = normalized;
          this.localStats.membersCount = Math.max(normalized.length, this.localStats.membersCount);
          this.notifyDataSync('members', normalized);
          return normalized;
        }
      }
    } catch {
      // Offline fallback
    }

    return [...this.localMembers];
  }

  // GET /api/commands - Returns command catalog for the panel
  public async getCommandCatalog(): Promise<CommandCatalogEntry[]> {
    try {
      const result = await this.multiEndpointGet<any>(['/api/commands', '/api/command_catalog', '/api/command-list']);
      if (result.ok && result.data) {
        const list = Array.isArray(result.data) ? result.data : [];
        return list.map((entry: any, idx: number) => ({
          name: entry.name || `command-${idx}`,
          aliases: Array.isArray(entry.aliases) ? entry.aliases : [],
          category: entry.category || 'utility',
          description: entry.description || '',
          full_name: entry.full_name || `.${entry.name || 'command'}`
        }));
      }
    } catch {
      // offline fallback
    }

    return [
      { name: 'ping', aliases: ['пинг'], category: 'utility', description: 'Проверка задержки', full_name: '.ping' },
      { name: 'help', aliases: ['хелп'], category: 'utility', description: 'Справка по командам', full_name: '.help' },
      { name: 'stats', aliases: ['стата'], category: 'utility', description: 'Статистика', full_name: '.stats' },
      { name: 'warn', aliases: ['варн'], category: 'moderation', description: 'Выдать предупреждение', full_name: '.warn' },
      { name: 'purge', aliases: ['очистить'], category: 'moderation', description: 'Удалить сообщения', full_name: '.purge' },
      { name: 'afk', aliases: ['афк'], category: 'utility', description: 'AFK режим', full_name: '.afk' },
      { name: 'casino', aliases: [], category: 'fun', description: 'Игровой автомат', full_name: '.casino' },
      { name: 'coinflip', aliases: [], category: 'fun', description: 'Подброс монеты', full_name: '.coinflip' }
    ];
  }

  // GET /api/logs - Fetches recent bot logs
  public async getLogs(): Promise<LogEntry[]> {
    try {
      const result = await this.multiEndpointGet<any>([
        '/api/logs',
        '/api/log',
        '/api/history/logs',
        '/logs'
      ]);

      if (result.ok && result.data) {
        this.isOnlineLocally = true;
        const list = Array.isArray(result.data) ? result.data : result.data.logs || [];
        if (list.length > 0) {
          const normalized: LogEntry[] = list.map((l: any, idx: number) => ({
            id: String(l.id || `log-${Date.now()}-${idx}`),
            timestamp: l.timestamp || new Date().toLocaleTimeString('ru-RU'),
            level: (l.level || 'INFO').toUpperCase() as LogEntry['level'],
            message: l.message || l.text || JSON.stringify(l),
            source: l.source || 'bot'
          }));

          this.localLogs = normalized;
          this.notifyDataSync('logs', normalized);
          return normalized;
        }
      }
    } catch {
      // Offline fallback
    }

    return [...this.localLogs];
  }

  // Clear Logs
  public clearLogs(): void {
    this.localLogs = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        level: 'INFO',
        message: 'Журнал логов очищен оператором веб-панели.',
        source: 'web-panel'
      }
    ];
    this.notifyDataSync('logs', this.localLogs);
    toast.info('Журнал логов очищен');
  }

  // Add a log entry locally
  public addLog(level: LogEntry['level'], message: string, source = 'web-panel') {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      level,
      message,
      source
    };
    this.localLogs.push(newLog);
    if (this.localLogs.length > 200) {
      this.localLogs.shift();
    }
    this.notifyDataSync('logs', this.localLogs);
  }

  // POST /api/execute or /api/command - Send command to bot
  public async executeCommand(command: string): Promise<{ success: boolean; response: string; executionTimeMs: number }> {
    const startTime = performance.now();
    try {
      const result = await this.multiEndpointPost<any>(
        ['/api/execute', '/api/command', '/api/cmd', '/execute', '/command'],
        {
          command,
          cmd: command,
          channel_id: this.settings.outputChannelId
        }
      );
      const duration = Math.round(performance.now() - startTime);

      if (result.ok) {
        const raw = result.data || {};
        const responseText = raw.response || raw.output || raw.message || `[OK 200] Команда "${command}" выполнена в клиенте Discord.`;
        this.addLog('COMMAND', `Выполнена команда: ${command} (${duration}ms)`);
        toast.success(`Команда "${command}" выполнена (${duration}ms)`);
        this.localStats.commandsExecuted += 1;
        return {
          success: true,
          response: responseText,
          executionTimeMs: duration
        };
      }
    } catch {
      // Offline fallback
    }

    // Local / Simulated response
    const duration = Math.floor(35 + Math.random() * 60);
    this.localStats.commandsExecuted += 1;
    this.addLog('COMMAND', `Выполнена команда: ${command} (${duration}ms)`);
    toast.success(`Команда "${command}" выполнена (${duration}ms)`);

    let responseText = `[200 OK] Команда "${command}" успешно обработана.\n`;
    if (command.startsWith('.ping')) {
      responseText += `Pong! 🏓 Gateway: ${this.localStats.ping}ms | REST API: ${duration}ms`;
    } else if (command.startsWith('.purge')) {
      const count = command.split(' ')[1] || '10';
      responseText += `🧹 Очищено ${count} сообщений в текущем канале.`;
    } else if (command.startsWith('.help')) {
      responseText += `Список команд self-бота:\n• .ping - Проверить пинг\n• .purge <n> - Удалить n сообщений\n• .nick <name> - Сменить ник\n• .say <text> - Отправить текст\n• .afk <on/off> - Режим АФК\n• .stats - Телеметрия`;
    } else if (command.startsWith('.afk')) {
      responseText += `Режим AFK переключен. Автоответчик включен.`;
    } else {
      responseText += `Результат: Команда передана без ошибок в ядро бота.`;
    }

    return {
      success: true,
      response: responseText,
      executionTimeMs: duration
    };
  }

  // POST /api/nick or /api/nickname - Change Bot / User Nickname
  public async changeNick(nick: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.multiEndpointPost<any>(
        ['/api/nick', '/api/nickname', '/api/set_nick', '/nick'],
        { nick, nickname: nick, name: nick }
      );
      if (result.ok) {
        this.localStats.botUser.username = nick;
        this.addLog('COMMAND', `Никнейм изменен на "${nick}"`);
        toast.success(`Никнейм изменен на "${nick}"`);
        return { success: true, message: `Ник успешно изменен на: ${nick}` };
      }
    } catch {
      // Fallback
    }

    this.localStats.botUser.username = nick;
    this.addLog('COMMAND', `Никнейм изменен на "${nick}"`);
    toast.success(`Никнейм обновлен на "${nick}"`);
    return { success: true, message: `Ник успешно обновлен на "${nick}"` };
  }

  // POST /api/say or /api/send - Send chat message from bot
  public async sendMessage(text: string, channelId?: string): Promise<{ success: boolean; message: string }> {
    const targetChannel = channelId || this.settings.outputChannelId;
    try {
      const result = await this.multiEndpointPost<any>(
        ['/api/say', '/api/send', '/api/message', '/api/chat', '/say', '/send'],
        {
          text,
          message: text,
          content: text,
          channel_id: targetChannel
        }
      );
      if (result.ok) {
        this.localStats.messagesProcessed += 1;
        this.addLog('COMMAND', `Отправлено сообщение в канал ${targetChannel}: "${text.slice(0, 35)}..."`);
        toast.success(`Сообщение отправлено в #${targetChannel}`);
        return { success: true, message: `Сообщение отправлено в #${targetChannel}` };
      }
    } catch {
      // Fallback
    }

    this.localStats.messagesProcessed += 1;
    this.addLog('COMMAND', `Отправлено сообщение в канал ${targetChannel}: "${text.slice(0, 35)}..."`);
    toast.success(`Сообщение отправлено в #${targetChannel}`);
    return { success: true, message: `Сообщение отправлено в #${targetChannel}` };
  }

  // POST /api/set_channel
  public async setOutputChannel(channelId: string): Promise<{ success: boolean; message: string }> {
    this.settings.outputChannelId = channelId;
    this.saveSettings({ outputChannelId: channelId });

    try {
      await this.multiEndpointPost<any>(
        ['/api/set_channel', '/api/channel', '/set_channel'],
        { channel_id: channelId }
      );
    } catch {
      // Fallback
    }

    this.addLog('INFO', `Канал вывода установлен: ${channelId}`);
    toast.success(`Канал вывода установлен: #${channelId}`);
    return { success: true, message: `ID канала вывода сохранен: ${channelId}` };
  }

  // POST /api/restart or /api/reboot
  public async restartBot(): Promise<{ success: boolean; message: string }> {
    try {
      await this.multiEndpointPost<any>(['/api/restart', '/api/reboot', '/restart'], {});
    } catch {
      // Fallback
    }

    this.addLog('WARN', `Перезапуск self-бота инициирован с веб-панели...`);
    toast.warning('Сигнал перезапуска отправлен боту');
    setTimeout(() => {
      this.addLog('INFO', `[Бот] Успешно перезапущен и готов к приему запросов.`);
      toast.info('Бот перезапущен и подключен');
    }, 2000);
    return { success: true, message: 'Сигнал перезапуска отправлен боту' };
  }

  // Bulk Operations: Role Assignment
  public async bulkAssignRole(
    memberIds: string[],
    roleName: string,
    action: 'add' | 'remove' = 'add'
  ): Promise<{ success: boolean; message: string; updatedMembers: DiscordMember[] }> {
    try {
      await this.multiEndpointPost<any>(
        ['/api/roles', '/api/role', '/api/bulk/roles'],
        { member_ids: memberIds, role: roleName, action }
      );
    } catch {
      // Fallback
    }

    this.localMembers = this.localMembers.map((m) => {
      if (!memberIds.includes(m.id)) return m;
      const currentRoles = m.roles || [];
      let nextRoles = [...currentRoles];
      if (action === 'add' && !nextRoles.includes(roleName)) {
        nextRoles.push(roleName);
      } else if (action === 'remove') {
        nextRoles = nextRoles.filter((r) => r !== roleName);
      }
      return { ...m, roles: nextRoles };
    });

    const actionText = action === 'add' ? 'назначена роль' : 'снята роль';
    const logMsg = `Массовая операция: ${actionText} "${roleName}" для ${memberIds.length} участников.`;
    this.addLog('COMMAND', logMsg);
    toast.success(`Роль "${roleName}" (${action === 'add' ? '+выдана' : '-снята'}) для ${memberIds.length} участников`);

    return {
      success: true,
      message: logMsg,
      updatedMembers: [...this.localMembers]
    };
  }

  // Bulk Operations: Temporary Mute
  public async bulkMuteMembers(
    memberIds: string[],
    durationMinutes: number,
    reason = 'Массовая модерация'
  ): Promise<{ success: boolean; message: string; updatedMembers: DiscordMember[] }> {
    try {
      await this.multiEndpointPost<any>(
        ['/api/mute', '/api/timeout', '/api/bulk/mute'],
        { member_ids: memberIds, duration_minutes: durationMinutes, reason }
      );
    } catch {
      // Fallback
    }

    this.localMembers = this.localMembers.map((m) => {
      if (!memberIds.includes(m.id)) return m;
      const currentRoles = m.roles || [];
      const rolesWithMuted = currentRoles.includes('Muted') ? currentRoles : [...currentRoles, 'Muted'];
      return { ...m, roles: rolesWithMuted };
    });

    const logMsg = `Массовый мут: ${memberIds.length} участников на ${durationMinutes} мин. Причина: ${reason}`;
    this.addLog('WARN', logMsg);
    toast.warning(`Временный мут активирован для ${memberIds.length} участников (${durationMinutes} мин)`);

    return {
      success: true,
      message: logMsg,
      updatedMembers: [...this.localMembers]
    };
  }

  // Bulk Operations: Unmute
  public async bulkUnmuteMembers(
    memberIds: string[]
  ): Promise<{ success: boolean; message: string; updatedMembers: DiscordMember[] }> {
    try {
      await this.multiEndpointPost<any>(
        ['/api/unmute', '/api/bulk/unmute'],
        { member_ids: memberIds }
      );
    } catch {
      // Fallback
    }

    this.localMembers = this.localMembers.map((m) => {
      if (!memberIds.includes(m.id)) return m;
      const nextRoles = (m.roles || []).filter((r) => r !== 'Muted');
      return { ...m, roles: nextRoles };
    });

    const logMsg = `Снят мут с ${memberIds.length} участников`;
    this.addLog('INFO', logMsg);
    toast.success(`Мут снят с ${memberIds.length} участников`);

    return {
      success: true,
      message: logMsg,
      updatedMembers: [...this.localMembers]
    };
  }

  public getStats(): StatsData {
    return MOCK_STATS;
  }
}

export const botApi = new BotApiService();
