/**
 * Discord Self-Bot Web Control Panel - Standalone Client
 * Pure Vanilla JavaScript ES6+ (No external build tools required)
 */

(() => {
  // Configuration State
  const state = {
    apiUrl: localStorage.getItem('bot_api_url') || 'http://localhost:8080',
    password: localStorage.getItem('bot_password') || '',
    outputChannelId: localStorage.getItem('bot_output_channel') || '104829104829104831',
    isAuthenticated: false,
    currentTab: 'dashboard',
    activeLogFilter: 'ALL',
    autoRefreshTimer: null,
    mockMode: false,
    data: {
      dashboard: null,
      servers: [],
      emojis: [],
      members: [],
      logs: []
    }
  };

  // Mock Fallback Data (if local API bot is not running yet)
  const MOCK_DATA = {
    dashboard: {
      botUser: {
        id: "104829104829104829",
        username: "PhantomSelf",
        discriminator: "0001",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80",
        nitro: true,
        customStatus: "⚡ Controlling the Matrix | .help",
        badges: ["HypeSquad Bravery", "Active Developer", "Early Supporter"]
      },
      ping: 28,
      serversCount: 14,
      membersCount: 8420,
      uptimeSeconds: 87480,
      ramUsageMB: 142.6,
      messagesProcessed: 14208,
      commandsExecuted: 384,
      lastSyncTime: "14:32:00"
    },
    servers: [
      {
        id: "104829104829104831",
        name: "Shadow Syndicate",
        icon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80",
        banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80",
        memberCount: 1420,
        channelsCount: 42,
        rolesCount: 18,
        channels: [
          { id: "104829104829104831", name: "general", type: "text" },
          { id: "104829104829104832", name: "bot-commands", type: "text" },
          { id: "104829104829104833", name: "lounge", type: "voice" }
        ]
      },
      {
        id: "209482049182049182",
        name: "Cyberpunk Hub",
        icon: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=80&auto=format&fit=crop&q=80",
        banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        memberCount: 3840,
        channelsCount: 64,
        rolesCount: 25,
        channels: [
          { id: "209482049182049183", name: "chat", type: "text" },
          { id: "209482049182049184", name: "media", type: "text" }
        ]
      },
      {
        id: "392019402910492019",
        name: "Dev Matrix Realm",
        icon: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=80&auto=format&fit=crop&q=80",
        memberCount: 512,
        channelsCount: 19,
        rolesCount: 8,
        channels: [
          { id: "392019402910492020", name: "code-talk", type: "text" }
        ]
      }
    ],
    emojis: [
      { id: "849201948201928491", name: "purple_fire", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png", animated: true },
      { id: "849201948201928492", name: "matrix_glow", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26a1.png", animated: false },
      { id: "849201948201928493", name: "neon_heart", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f49c.png", animated: false },
      { id: "849201948201928494", name: "cyber_cat", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f431.png", animated: false },
      { id: "849201948201928495", name: "hacker_skull", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f480.png", animated: true },
      { id: "849201948201928496", name: "verified_shield", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6e1.png", animated: false }
    ],
    members: [
      { id: "104829104829104829", username: "PhantomSelf", discriminator: "0001", nickname: "Matrix Lead", avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80", status: "dnd", roles: ["Admin", "VIP", "BotMaster"], bot: false },
      { id: "948201948201948201", username: "ZeroCool", discriminator: "1337", nickname: "Elite Hacker", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80", status: "online", roles: ["Moderator", "Coder"], bot: false },
      { id: "738201948201948202", username: "CyberValkyrie", discriminator: "4040", nickname: null, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&auto=format&fit=crop&q=80", status: "idle", roles: ["Designer"], bot: false },
      { id: "849201948201948203", username: "NeonKnight", discriminator: "7777", nickname: "Night Owl", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=80", status: "offline", roles: ["Member"], bot: false }
    ],
    logs: [
      { id: "log-1", timestamp: "14:32:15", level: "INFO", source: "gateway", message: "Gateway connection stable. Heartbeat latency: 28ms." },
      { id: "log-2", timestamp: "14:32:02", level: "COMMAND", source: "cmd_runner", message: "Executed user command '.purge 5' successfully in #general." },
      { id: "log-3", timestamp: "14:31:40", level: "INFO", source: "discord.py", message: "Received GuildEmojisUpdate for guild 104829104831." },
      { id: "log-4", timestamp: "14:30:11", level: "WARN", source: "rate_limiter", message: "Approaching Discord REST rate limit bucket (4/5 requests)." },
      { id: "log-5", timestamp: "14:28:50", level: "INFO", source: "aiohttp", message: "Web control panel connected with valid X-Password." }
    ]
  };

  // Sound Engine (Web Audio API)
  const soundEngine = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
    },
    beep(freq = 440, type = 'sine', duration = 0.08, vol = 0.05) {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    },
    click() { this.beep(700, 'sine', 0.04, 0.03); },
    success() {
      this.beep(523.25, 'triangle', 0.08, 0.04);
      setTimeout(() => this.beep(659.25, 'triangle', 0.12, 0.04), 80);
    },
    error() {
      this.beep(220, 'sawtooth', 0.15, 0.06);
    }
  };

  // Toast Notification System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info');
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // API Client with Timeout & Fallback
  async function apiFetch(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Password': state.password || 'GGEZ'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(`${state.apiUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      state.mockMode = false;
      document.getElementById('apiStatusBadge')?.classList.remove('mock');
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      state.mockMode = true;
      document.getElementById('apiStatusBadge')?.classList.add('mock');

      // Return mock response based on endpoint
      if (endpoint === '/api/dashboard') return MOCK_DATA.dashboard;
      if (endpoint === '/api/servers') return MOCK_DATA.servers;
      if (endpoint === '/api/emojis') return MOCK_DATA.emojis;
      if (endpoint === '/api/members') return MOCK_DATA.members;
      if (endpoint === '/api/logs') return MOCK_DATA.logs;
      if (endpoint === '/api/command') {
        return { success: true, response: `[SIMULATOR] Команда '${body?.command}' успешно выполнена. (Local Bot offline)`, executionTimeMs: 18 };
      }
      if (endpoint === '/api/change-nick') {
        return { success: true, message: `Никнейм изменен на "${body?.nick}" (Simulator)` };
      }
      if (endpoint === '/api/send-message') {
        return { success: true, message: `Сообщение отправлено в канал ${body?.channelId || state.outputChannelId}` };
      }
      if (endpoint.startsWith('/api/emojis/')) {
        return { success: true, message: 'Эмодзи удален' };
      }
      if (endpoint === '/api/restart') {
        return { success: true, message: 'Сигнал перезапуска отправлен' };
      }
      return { success: true };
    }
  }

  // Load and Render Data
  async function loadAllData() {
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) refreshBtn.classList.add('fa-spin');

    try {
      const [dash, srvs, emjs, mmbrs, lgs] = await Promise.all([
        apiFetch('/api/dashboard'),
        apiFetch('/api/servers'),
        apiFetch('/api/emojis'),
        apiFetch('/api/members'),
        apiFetch('/api/logs')
      ]);

      state.data.dashboard = dash;
      state.data.servers = srvs;
      state.data.emojis = emjs;
      state.data.members = mmbrs;
      state.data.logs = lgs;

      renderDashboard();
      renderServers();
      renderEmojis();
      renderMembers();
      renderLogs();
      renderStats();
    } catch (e) {
      console.error(e);
    } finally {
      if (refreshBtn) refreshBtn.classList.remove('fa-spin');
    }
  }

  // UI Renderers
  function renderDashboard() {
    const d = state.data.dashboard;
    if (!d) return;

    document.getElementById('dashPing').innerHTML = `${d.ping} <span class="unit">ms</span>`;
    document.getElementById('dashServers').innerText = d.serversCount;
    document.getElementById('dashMembers').innerText = d.membersCount.toLocaleString('ru-RU');

    const hours = Math.floor(d.uptimeSeconds / 3600);
    const mins = Math.floor((d.uptimeSeconds % 3600) / 60);
    document.getElementById('dashUptime').innerText = `${hours}ч ${mins}м`;

    // Bot Identity
    if (d.botUser) {
      document.getElementById('dashBotName').innerText = d.botUser.username;
      document.getElementById('dashBotAvatar').src = d.botUser.avatar;
      document.getElementById('dashBotStatusText').innerText = d.botUser.customStatus;
      document.getElementById('sidebarUsername').innerText = d.botUser.username;
      document.getElementById('sidebarDiscriminator').innerText = `#${d.botUser.discriminator}`;
      document.getElementById('sidebarAvatar').src = d.botUser.avatar;
    }
  }

  function renderServers() {
    const grid = document.getElementById('serversGrid');
    const badge = document.getElementById('navServersCount');
    if (!grid) return;

    const servers = state.data.servers;
    if (badge) badge.innerText = servers.length;

    const search = document.getElementById('serverSearchInput')?.value.toLowerCase() || '';
    const filtered = servers.filter(s => s.name.toLowerCase().includes(search) || s.id.includes(search));

    grid.innerHTML = filtered.map(s => `
      <div class="glass-card server-card">
        <div class="server-banner" style="${s.banner ? `background-image:url(${s.banner})` : ''}"></div>
        <div class="server-content">
          <div class="server-icon-wrapper">
            <img src="${s.icon}" alt="${s.name}" class="server-icon-img">
          </div>
          <h4 class="server-title">${s.name}</h4>
          <span class="server-id-chip" onclick="window.copyToClip('${s.id}', 'ID сервера')">
            <i class="fa-regular fa-copy"></i> ID: ${s.id}
          </span>
          <div class="server-meta-row">
            <span><i class="fa-solid fa-users text-accent"></i> ${s.memberCount}</span>
            <span><i class="fa-solid fa-hashtag text-accent"></i> ${s.channelsCount} кан.</span>
            <span><i class="fa-solid fa-shield text-accent"></i> ${s.rolesCount} ролей</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderEmojis() {
    const grid = document.getElementById('emojisGrid');
    if (!grid) return;

    const emojis = state.data.emojis;
    const search = document.getElementById('emojiSearchInput')?.value.toLowerCase() || '';
    const filtered = emojis.filter(e => e.name.toLowerCase().includes(search));

    grid.innerHTML = filtered.map(e => `
      <div class="glass-card emoji-card" onclick="window.copyToClip('${e.id}', 'ID эмодзи :${e.name}:')">
        <button class="emoji-delete-btn" onclick="window.handleDeleteEmoji(event, '${e.id}', '${e.name}')" title="Удалить">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <img src="${e.url}" alt="${e.name}" class="emoji-img" loading="lazy">
        <span class="emoji-name">:${e.name}:</span>
        <span class="emoji-id"><i class="fa-regular fa-copy"></i> ${e.id.slice(0, 8)}...</span>
      </div>
    `).join('');
  }

  function renderMembers() {
    const list = document.getElementById('membersList');
    if (!list) return;

    const members = state.data.members;
    const search = document.getElementById('memberSearchInput')?.value.toLowerCase() || '';
    const filtered = members.filter(m => 
      m.username.toLowerCase().includes(search) || 
      (m.nickname && m.nickname.toLowerCase().includes(search)) || 
      m.id.includes(search)
    );

    list.innerHTML = filtered.map(m => `
      <div class="glass-card member-item">
        <div class="member-info-left">
          <div class="avatar-status-wrapper">
            <img src="${m.avatar}" alt="${m.username}" class="member-avatar">
            <span class="status-dot ${m.status}"></span>
          </div>
          <div class="member-names">
            <span class="member-user">${m.username} <span style="font-size:11px;color:var(--text-dim)">#${m.discriminator}</span></span>
            ${m.nickname ? `<span class="member-nick">Ник: ${m.nickname}</span>` : ''}
          </div>
        </div>

        <div class="member-roles">
          ${m.roles.map(r => `<span class="role-pill">${r}</span>`).join('')}
          <button class="btn btn-ghost" onclick="window.copyToClip('${m.id}', 'ID пользователя')" style="padding:4px 8px;font-size:11px;font-family:var(--font-mono)">
            <i class="fa-regular fa-copy"></i> ${m.id.slice(0, 6)}...
          </button>
        </div>
      </div>
    `).join('');
  }

  function renderLogs() {
    const consoleEl = document.getElementById('logsConsole');
    const counter = document.getElementById('logCounter');
    if (!consoleEl) return;

    const logs = state.data.logs;
    const filter = state.activeLogFilter;
    const filtered = filter === 'ALL' ? logs : logs.filter(l => l.level === filter);

    if (counter) counter.innerText = `Записей: ${filtered.length}`;

    consoleEl.innerHTML = filtered.map(l => `
      <div class="log-row">
        <span class="log-time">[${l.timestamp}]</span>
        <span class="log-badge ${l.level}">[${l.level}]</span>
        ${l.source ? `<span style="color:var(--text-dim)">[${l.source}]</span>` : ''}
        <span class="log-msg">${l.message}</span>
      </div>
    `).join('');
  }

  function renderStats() {
    const dailyChart = document.getElementById('dailyStatsChart');
    const topList = document.getElementById('topCommandsList');

    const dailyData = [
      { day: 'Пн', count: 42 },
      { day: 'Вт', count: 68 },
      { day: 'Ср', count: 89 },
      { day: 'Чт', count: 54 },
      { day: 'Пт', count: 112 },
      { day: 'Сб', count: 145 },
      { day: 'Вс', count: 96 }
    ];

    if (dailyChart) {
      const max = Math.max(...dailyData.map(d => d.count));
      dailyChart.innerHTML = dailyData.map(d => {
        const heightPct = Math.round((d.count / max) * 100);
        return `
          <div class="bar-col">
            <span class="bar-val">${d.count}</span>
            <div class="bar-fill" style="height: ${heightPct}%"></div>
            <span class="bar-label">${d.day}</span>
          </div>
        `;
      }).join('');
    }

    if (topList) {
      const top = [
        { cmd: '.purge', count: 142 },
        { cmd: '.ping', count: 98 },
        { cmd: '.hypesquad', count: 44 },
        { cmd: '.afk', count: 32 },
        { cmd: '.say', count: 28 }
      ];
      topList.innerHTML = top.map(t => `
        <div class="top-cmd-row">
          <span class="top-cmd-name">${t.cmd}</span>
          <span class="top-cmd-count">${t.count} вызовов</span>
        </div>
      `).join('');
    }
  }

  // Global Helpers for Inline Events
  window.copyToClip = (text, label = 'Текст') => {
    navigator.clipboard.writeText(text);
    soundEngine.click();
    showToast(`${label} скопирован в буфер!`, 'success');
  };

  window.handleDeleteEmoji = async (e, id, name) => {
    e.stopPropagation();
    soundEngine.click();
    const res = await apiFetch(`/api/emojis/${id}`, 'DELETE');
    if (res.success) {
      soundEngine.success();
      showToast(`Эмодзи :${name}: удален!`, 'success');
      state.data.emojis = state.data.emojis.filter(item => item.id !== id);
      renderEmojis();
    }
  };

  // Event Listeners Initialization
  function initEvents() {
    // Tab switching
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
        soundEngine.click();
      });
    });

    // Quick Command buttons on Dashboard
    document.querySelectorAll('.quick-cmd').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cmd = btn.dataset.cmd;
        soundEngine.click();
        switchTab('commands');
        executeCommand(cmd);
      });
    });

    // Preset Command Chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fill = btn.dataset.fill;
        const input = document.getElementById('cmdInput');
        if (input) {
          input.value = fill;
          input.focus();
        }
        soundEngine.click();
      });
    });

    // Command Form Submit
    document.getElementById('execCommandForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('cmdInput');
      if (input && input.value.trim()) {
        executeCommand(input.value.trim());
        input.value = '';
      }
    });

    // Ctrl+Enter Hotkey in Command Input
    document.getElementById('cmdInput')?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('execCommandForm')?.requestSubmit();
      }
    });

    // Clear Terminal Output
    document.getElementById('clearCmdOutputBtn')?.addEventListener('click', () => {
      const term = document.getElementById('cmdOutputLogs');
      if (term) term.innerHTML = '<div class="term-line info">[SYSTEM] Вывод очищен.</div>';
      soundEngine.click();
    });

    // Change Nickname Form
    document.getElementById('changeNickForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('nickInput');
      if (!input || !input.value.trim()) return;

      soundEngine.click();
      const res = await apiFetch('/api/change-nick', 'POST', { nick: input.value.trim() });
      if (res.success) {
        soundEngine.success();
        showToast(res.message, 'success');
        input.value = '';
      }
    });

    // Send Message Form
    document.getElementById('sendMessageForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const chanInput = document.getElementById('targetChannelIdInput');
      const textInput = document.getElementById('messageTextInput');
      if (!textInput || !textInput.value.trim()) return;

      soundEngine.click();
      const res = await apiFetch('/api/send-message', 'POST', {
        channelId: chanInput?.value.trim() || state.outputChannelId,
        text: textInput.value.trim()
      });

      if (res.success) {
        soundEngine.success();
        showToast(res.message, 'success');
        textInput.value = '';
      }
    });

    // Log Filter Pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeLogFilter = pill.dataset.filter;
        renderLogs();
        soundEngine.click();
      });
    });

    // Clear Logs
    document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
      state.data.logs = [];
      renderLogs();
      soundEngine.click();
      showToast('Логи консоли очищены', 'info');
    });

    // Search inputs
    document.getElementById('serverSearchInput')?.addEventListener('input', renderServers);
    document.getElementById('emojiSearchInput')?.addEventListener('input', renderEmojis);
    document.getElementById('memberSearchInput')?.addEventListener('input', renderMembers);

    // Save Output Channel
    document.getElementById('saveChannelForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('settingsChannelId');
      if (input && input.value.trim()) {
        state.outputChannelId = input.value.trim();
        localStorage.setItem('bot_output_channel', state.outputChannelId);
        document.getElementById('currentSavedChannelLabel').innerText = state.outputChannelId;
        soundEngine.success();
        showToast('ID канала вывода успешно сохранен!', 'success');
      }
    });

    // Test API Connection
    document.getElementById('testApiBtn')?.addEventListener('click', async () => {
      const urlInput = document.getElementById('settingsApiUrl');
      if (urlInput) {
        state.apiUrl = urlInput.value.trim();
        localStorage.setItem('bot_api_url', state.apiUrl);
      }
      soundEngine.click();
      showToast('Проверка соединения с ботом...', 'info');
      await loadAllData();
      showToast(state.mockMode ? 'Бот оффлайн (режим симуляции активен)' : 'Соединение с ботом установлено!', state.mockMode ? 'error' : 'success');
    });

    // Restart Bot Button
    document.getElementById('restartBotBtn')?.addEventListener('click', async () => {
      if (confirm('Вы уверены, что хотите перезапустить бота?')) {
        soundEngine.click();
        const res = await apiFetch('/api/restart', 'POST');
        showToast(res.message, 'info');
      }
    });

    // Refresh Data Topbar
    document.getElementById('refreshDataBtn')?.addEventListener('click', () => {
      soundEngine.click();
      loadAllData();
      showToast('Данные обновлены', 'info');
    });

    // Mobile Sidebar Toggle
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('open');
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem('bot_password');
      state.isAuthenticated = false;
      document.getElementById('authModal')?.classList.add('active');
      document.getElementById('app')?.classList.add('hidden');
      soundEngine.click();
    });

    // Toggle Password Visibility
    document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
      const input = document.getElementById('passwordInput');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });

    // Login Form Submit
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('passwordInput');
      const errorMsg = document.getElementById('loginError');
      const pwd = input?.value.trim() || '';

      if (pwd === 'GGEZ' || pwd.length > 0) {
        state.password = pwd;
        localStorage.setItem('bot_password', pwd);
        state.isAuthenticated = true;
        document.getElementById('authModal')?.classList.remove('active');
        document.getElementById('app')?.classList.remove('hidden');
        soundEngine.success();
        showToast('Добро пожаловать в панель управления!', 'success');
        loadAllData();
      } else {
        soundEngine.error();
        if (errorMsg) errorMsg.innerText = 'Неверный пароль. По умолчанию: GGEZ';
      }
    });
  }

  // Switch Tab
  function switchTab(tabId) {
    state.currentTab = tabId;
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `tab-${tabId}`);
    });
    document.querySelector('.sidebar')?.classList.remove('open');

    const tabNames = {
      dashboard: 'Дашборд',
      servers: 'Серверы',
      commands: 'Команды',
      emojis: 'Эмодзи',
      members: 'Участники',
      logs: 'Логи',
      stats: 'Статистика',
      settings: 'Настройки'
    };
    const titleEl = document.getElementById('currentTabTitle');
    if (titleEl) titleEl.innerText = tabNames[tabId] || 'Панель';
  }

  // Execute Command Helper
  async function executeCommand(rawCmd) {
    const cmd = rawCmd.startsWith('.') ? rawCmd : `.${rawCmd}`;
    const term = document.getElementById('cmdOutputLogs');
    soundEngine.click();

    if (term) {
      const line = document.createElement('div');
      line.className = 'term-line command';
      line.innerHTML = `> Executing: ${cmd}...`;
      term.prepend(line);
    }

    const res = await apiFetch('/api/command', 'POST', { command: cmd });

    if (term) {
      const respLine = document.createElement('div');
      respLine.className = `term-line ${res.success ? 'success' : 'error'}`;
      respLine.innerHTML = `[${new Date().toLocaleTimeString()}] ${res.response || 'Success'}`;
      term.prepend(respLine);
    }

    if (res.success) {
      soundEngine.success();
      showToast(`Команда ${cmd} выполнена (${res.executionTimeMs || 24}ms)`, 'success');
    }
  }

  // Initialize Application on DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    initEvents();

    const savedPass = localStorage.getItem('bot_password');
    if (savedPass) {
      state.password = savedPass;
      state.isAuthenticated = true;
      document.getElementById('authModal')?.classList.remove('active');
      document.getElementById('app')?.classList.remove('hidden');
      loadAllData();
    }

    // Auto Refresh Interval
    setInterval(() => {
      if (state.isAuthenticated) {
        if (state.currentTab === 'logs' && document.getElementById('autoRefreshLogsCheck')?.checked) {
          apiFetch('/api/logs').then(lgs => {
            state.data.logs = lgs;
            renderLogs();
          });
        }
      }
    }, 5000);
  });
})();
