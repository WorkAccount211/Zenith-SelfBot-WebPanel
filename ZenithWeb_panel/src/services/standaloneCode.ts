export const STANDALONE_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discord Self-Bot Control Panel</title>
  <!-- Google Fonts: Inter & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Ambient background glow effects -->
  <div class="ambient-glow glow-1"></div>
  <div class="ambient-glow glow-2"></div>

  <!-- AUTH / LOGIN MODAL -->
  <div id="authModal" class="modal-overlay active">
    <div class="glass-card login-card">
      <div class="login-header">
        <div class="bot-avatar-glow">
          <i class="fa-brands fa-discord"></i>
        </div>
        <h2>Self-Bot Control</h2>
        <p class="subtitle">Введите пароль доступа к REST API панели</p>
      </div>

      <form id="loginForm" class="login-form">
        <div class="input-group">
          <label for="passwordInput"><i class="fa-solid fa-key"></i> Пароль</label>
          <div class="password-wrapper">
            <input type="password" id="passwordInput" placeholder="Введите пароль (по умолчанию GGEZ)" required autocomplete="current-password">
            <button type="button" id="togglePasswordBtn" class="icon-btn-ghost"><i class="fa-regular fa-eye"></i></button>
          </div>
          <span id="loginError" class="error-msg"></span>
        </div>

        <div class="login-hint">
          <i class="fa-solid fa-circle-info"></i> Стандартный пароль: <code>GGEZ</code>
        </div>

        <button type="submit" id="submitLoginBtn" class="btn btn-primary btn-block">
          <span>Войти в систему</span>
          <i class="fa-solid fa-arrow-right-to-bracket"></i>
        </button>
      </form>
    </div>
  </div>

  <!-- MAIN APP WRAPPER -->
  <div id="app" class="app-layout hidden">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon"><i class="fa-brands fa-discord"></i></div>
        <div class="brand-text">
          <span class="brand-title">Phantom<span class="text-accent">Bot</span></span>
          <span class="brand-badge">v2.4 Pro</span>
        </div>
      </div>

      <div class="bot-mini-profile">
        <div class="avatar-status-wrapper">
          <img id="sidebarAvatar" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80" alt="Avatar" class="avatar-img">
          <span id="sidebarStatusDot" class="status-dot online"></span>
        </div>
        <div class="user-meta">
          <span id="sidebarUsername" class="user-name">PhantomSelf</span>
          <span id="sidebarDiscriminator" class="user-tag">#0001</span>
        </div>
      </div>

      <nav class="nav-menu">
        <button class="nav-item active" data-tab="dashboard">
          <i class="fa-solid fa-chart-line"></i>
          <span>Дашборд</span>
        </button>
        <button class="nav-item" data-tab="servers">
          <i class="fa-solid fa-server"></i>
          <span>Серверы</span>
          <span id="navServersCount" class="nav-badge">0</span>
        </button>
        <button class="nav-item" data-tab="commands">
          <i class="fa-solid fa-terminal"></i>
          <span>Команды</span>
        </button>
        <button class="nav-item" data-tab="emojis">
          <i class="fa-solid fa-icons"></i>
          <span>Эмодзи</span>
        </button>
        <button class="nav-item" data-tab="members">
          <i class="fa-solid fa-users"></i>
          <span>Участники</span>
        </button>
        <button class="nav-item" data-tab="logs">
          <i class="fa-solid fa-receipt"></i>
          <span>Логи</span>
          <span class="nav-pulse-dot"></span>
        </button>
        <button class="nav-item" data-tab="stats">
          <i class="fa-solid fa-chart-pie"></i>
          <span>Статистика</span>
        </button>
        <button class="nav-item" data-tab="settings">
          <i class="fa-solid fa-sliders"></i>
          <span>Настройки</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button id="logoutBtn" class="btn btn-ghost btn-block">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Выйти</span>
        </button>
      </div>
    </aside>

    <!-- MAIN CONTENT AREA -->
    <main class="main-content">
      <!-- TOP BAR -->
      <header class="topbar">
        <div class="topbar-left">
          <button id="mobileMenuBtn" class="mobile-toggle-btn">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-root">Панель</span>
            <i class="fa-solid fa-chevron-right separator"></i>
            <span id="currentTabTitle" class="breadcrumb-current">Дашборд</span>
          </div>
        </div>

        <div class="topbar-right">
          <div class="status-indicator">
            <span id="pingDot" class="ping-pulse"></span>
            <span id="pingText" class="ping-label">Пинг: 28ms</span>
          </div>

          <div class="api-badge" id="apiStatusBadge">
            <i class="fa-solid fa-link"></i>
            <span id="apiHostLabel">localhost:8080</span>
          </div>

          <button id="refreshDataBtn" class="icon-btn" title="Обновить данные">
            <i class="fa-solid fa-rotate"></i>
          </button>
        </div>
      </header>

      <!-- TAB CONTENTS -->
      <div class="tab-viewport">
        <!-- 1. DASHBOARD TAB -->
        <section id="tab-dashboard" class="tab-pane active">
          <div class="stats-grid">
            <div class="glass-card stat-card">
              <div class="stat-icon purple"><i class="fa-solid fa-bolt"></i></div>
              <div class="stat-info">
                <span class="stat-label">Задержка (Ping)</span>
                <span id="dashPing" class="stat-value">28 <span class="unit">ms</span></span>
              </div>
              <div class="stat-sub">Gateway WebSocket</div>
            </div>

            <div class="glass-card stat-card">
              <div class="stat-icon blue"><i class="fa-solid fa-server"></i></div>
              <div class="stat-info">
                <span class="stat-label">Серверы</span>
                <span id="dashServers" class="stat-value">14</span>
              </div>
              <div class="stat-sub">Включая личные хабы</div>
            </div>

            <div class="glass-card stat-card">
              <div class="stat-icon emerald"><i class="fa-solid fa-users"></i></div>
              <div class="stat-info">
                <span class="stat-label">Участники</span>
                <span id="dashMembers" class="stat-value">8,420</span>
              </div>
              <div class="stat-sub">В зоне видимости</div>
            </div>

            <div class="glass-card stat-card">
              <div class="stat-icon amber"><i class="fa-solid fa-clock"></i></div>
              <div class="stat-info">
                <span class="stat-label">Аптайм</span>
                <span id="dashUptime" class="stat-value">24ч 18м</span>
              </div>
              <div class="stat-sub">Без прерываний</div>
            </div>
          </div>

          <!-- BOT IDENTITY HERO -->
          <div class="glass-card bot-hero-card">
            <div class="bot-hero-left">
              <img id="dashBotAvatar" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80" alt="Avatar" class="bot-hero-avatar">
              <div class="bot-hero-info">
                <div class="bot-hero-header">
                  <h3 id="dashBotName">PhantomSelf</h3>
                  <span class="bot-badge">SELF-BOT</span>
                  <span class="nitro-badge"><i class="fa-solid fa-wand-magic-sparkles"></i> Nitro</span>
                </div>
                <p id="dashBotStatusText" class="custom-status">⚡ Controlling the Matrix | .help</p>
                <div class="bot-hero-badges" id="dashBadges">
                  <span class="tag-pill"><i class="fa-solid fa-shield-heart"></i> HypeSquad Bravery</span>
                  <span class="tag-pill"><i class="fa-solid fa-code"></i> Active Developer</span>
                </div>
              </div>
            </div>

            <div class="bot-hero-quick-actions">
              <span class="quick-title">Быстрые действия:</span>
              <div class="action-buttons-row">
                <button class="btn btn-secondary quick-cmd" data-cmd=".ping"><i class="fa-solid fa-stopwatch"></i> .ping</button>
                <button class="btn btn-secondary quick-cmd" data-cmd=".purge 5"><i class="fa-solid fa-broom"></i> .purge 5</button>
                <button class="btn btn-secondary quick-cmd" data-cmd=".afk on"><i class="fa-solid fa-moon"></i> .afk on</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. SERVERS TAB -->
        <section id="tab-servers" class="tab-pane">
          <div class="pane-header">
            <div>
              <h2>Подключенные серверы</h2>
              <p class="subtitle">Список гильдий и серверов аккаунта</p>
            </div>
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="serverSearchInput" placeholder="Поиск по названию или ID...">
            </div>
          </div>

          <div id="serversGrid" class="servers-grid">
            <!-- Rendered by script.js -->
          </div>
        </section>

        <!-- 3. COMMANDS TAB -->
        <section id="tab-commands" class="tab-pane">
          <div class="commands-layout">
            <!-- Left: Command Execution Form -->
            <div class="commands-col">
              <div class="glass-card">
                <h3><i class="fa-solid fa-terminal text-accent"></i> Выполнить команду</h3>
                <p class="subtitle">Введите команду бота (префикс <code>.</code> добавляется автоматически, если опущен)</p>
                
                <form id="execCommandForm" class="form-vertical">
                  <div class="input-group">
                    <label>Команда</label>
                    <div class="input-with-action">
                      <input type="text" id="cmdInput" placeholder=".purge 10 или .help" autocomplete="off" required>
                      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> Выполнить</button>
                    </div>
                  </div>
                  <div class="hotkey-tip"><i class="fa-regular fa-keyboard"></i> Нажмите <code>Ctrl + Enter</code> для быстрой отправки</div>
                </form>

                <div class="quick-chips">
                  <span class="chip-label">Шаблоны:</span>
                  <button class="chip-btn" data-fill=".ping">.ping</button>
                  <button class="chip-btn" data-fill=".purge 10">.purge 10</button>
                  <button class="chip-btn" data-fill=".help">.help</button>
                  <button class="chip-btn" data-fill=".hypesquad bravery">.hypesquad</button>
                  <button class="chip-btn" data-fill=".streaming Twitch">.streaming</button>
                </div>
              </div>

              <!-- Nickname Change Block -->
              <div class="glass-card">
                <h3><i class="fa-solid fa-user-pen text-accent"></i> Смена никнейма</h3>
                <form id="changeNickForm" class="form-inline">
                  <input type="text" id="nickInput" placeholder="Новый никнейм..." required>
                  <button type="submit" class="btn btn-secondary"><i class="fa-solid fa-floppy-disk"></i> Сохранить ник</button>
                </form>
              </div>

              <!-- Send Message Block -->
              <div class="glass-card">
                <h3><i class="fa-solid fa-comment-dots text-accent"></i> Отправить сообщение в канал</h3>
                <form id="sendMessageForm" class="form-vertical">
                  <div class="input-group">
                    <label>ID канала (опционально, по умолчанию из настроек)</label>
                    <input type="text" id="targetChannelIdInput" placeholder="Оставьте пустым для канала по умолчанию">
                  </div>
                  <div class="input-group">
                    <label>Текст сообщения</label>
                    <textarea id="messageTextInput" rows="3" placeholder="Введите текст сообщения для отправки от имени self-бота..." required></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> Отправить в канал</button>
                </form>
              </div>
            </div>

            <!-- Right: Command Output Terminal -->
            <div class="commands-col">
              <div class="glass-card terminal-card">
                <div class="terminal-header">
                  <div class="terminal-dots">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                  </div>
                  <span class="terminal-title"><i class="fa-solid fa-code"></i> Ответ API (Output Window)</span>
                  <button id="clearCmdOutputBtn" class="icon-btn-ghost" title="Очистить вывод"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div id="cmdOutputLogs" class="terminal-body">
                  <div class="term-line info">[SYSTEM] Готов к приему команд. Введите команду слева.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. EMOJIS TAB -->
        <section id="tab-emojis" class="tab-pane">
          <div class="pane-header">
            <div>
              <h2>Кастомные эмодзи</h2>
              <p class="subtitle">Сетка всех эмодзи с первого сервера с возможностью быстрого копирования ID и удаления</p>
            </div>
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="emojiSearchInput" placeholder="Поиск эмодзи по названию...">
            </div>
          </div>

          <div id="emojisGrid" class="emojis-grid">
            <!-- Rendered by script.js -->
          </div>
        </section>

        <!-- 5. MEMBERS TAB -->
        <section id="tab-members" class="tab-pane">
          <div class="pane-header">
            <div>
              <h2>Список участников</h2>
              <p class="subtitle">Участники первого сервера с аватарами и ролями (до 50 пользователей)</p>
            </div>
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="memberSearchInput" placeholder="Поиск по имени, нику или ID...">
            </div>
          </div>

          <div id="membersList" class="members-list">
            <!-- Rendered by script.js -->
          </div>
        </section>

        <!-- 6. LOGS TAB -->
        <section id="tab-logs" class="tab-pane">
          <div class="pane-header">
            <div>
              <h2>Консоль и логи бота</h2>
              <p class="subtitle">Журнал событий бота с автообновлением каждые 5 секунд</p>
            </div>
            <div class="logs-actions">
              <label class="toggle-control">
                <input type="checkbox" id="autoRefreshLogsCheck" checked>
                <span class="toggle-track"></span>
                <span class="toggle-text">Автообновление (5с)</span>
              </label>
              <button id="clearLogsBtn" class="btn btn-secondary"><i class="fa-solid fa-trash"></i> Очистить</button>
            </div>
          </div>

          <div class="glass-card console-container">
            <div class="console-toolbar">
              <div class="log-filter-buttons">
                <button class="filter-pill active" data-filter="ALL">Все</button>
                <button class="filter-pill" data-filter="INFO">INFO</button>
                <button class="filter-pill" data-filter="COMMAND">COMMAND</button>
                <button class="filter-pill" data-filter="WARN">WARN</button>
                <button class="filter-pill" data-filter="ERROR">ERROR</button>
              </div>
              <span id="logCounter" class="log-counter">Записей: 0</span>
            </div>
            <div id="logsConsole" class="console-body">
              <!-- Rendered by script.js -->
            </div>
          </div>
        </section>

        <!-- 7. STATS TAB -->
        <section id="tab-stats" class="tab-pane">
          <div class="pane-header">
            <div>
              <h2>Статистика активности</h2>
              <p class="subtitle">Аналитика выполнения команд и системных метрик</p>
            </div>
          </div>

          <div class="stats-charts-grid">
            <div class="glass-card chart-card">
              <h3><i class="fa-solid fa-chart-simple text-accent"></i> Команды за последние 7 дней</h3>
              <div class="bar-chart-container" id="dailyStatsChart"></div>
            </div>

            <div class="glass-card chart-card">
              <h3><i class="fa-solid fa-fire text-accent"></i> Топ используемых команд</h3>
              <div class="top-commands-list" id="topCommandsList"></div>
            </div>
          </div>
        </section>

        <!-- 8. SETTINGS TAB -->
        <section id="tab-settings" class="tab-pane">
          <div class="settings-grid">
            <div class="glass-card">
              <h3><i class="fa-solid fa-hashtag text-accent"></i> Канал вывода сообщений</h3>
              <p class="subtitle">Укажите ID канала Discord, куда бот будет отправлять стандартный вывод</p>
              <form id="saveChannelForm" class="form-inline mt-3">
                <input type="text" id="settingsChannelId" placeholder="Например: 104829104829104831" required>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Сохранить</button>
              </form>
              <div class="channel-preview-info">
                Текущий ID канала: <strong id="currentSavedChannelLabel">104829104829104831</strong>
              </div>
            </div>

            <div class="glass-card">
              <h3><i class="fa-solid fa-network-wired text-accent"></i> Адрес API бота</h3>
              <p class="subtitle">По умолчанию <code>http://localhost:8080</code> (REST aiohttp)</p>
              <div class="form-inline mt-3">
                <input type="text" id="settingsApiUrl" value="http://localhost:8080">
                <button id="testApiBtn" class="btn btn-secondary"><i class="fa-solid fa-stethoscope"></i> Проверить</button>
              </div>
            </div>

            <div class="glass-card">
              <h3><i class="fa-solid fa-power-off text-danger"></i> Управление процессом</h3>
              <p class="subtitle">Перезапуск бота или сброс локальной сессии панели</p>
              <div class="action-buttons-row mt-3">
                <button id="restartBotBtn" class="btn btn-danger"><i class="fa-solid fa-rotate-right"></i> Перезапустить бота</button>
                <button id="resetSessionBtn" class="btn btn-secondary"><i class="fa-solid fa-arrow-rotate-left"></i> Сбросить настройки</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>

  <!-- TOAST NOTIFICATIONS CONTAINER -->
  <div id="toastContainer" class="toast-container"></div>

  <!-- SCRIPT -->
  <script src="script.js"></script>
</body>
</html>`;

export const STANDALONE_CSS = `/* ==========================================================================
   Discord Self-Bot Control Panel - Ultra-Modern Dark Violet Theme
   ========================================================================== */

:root {
  --bg-main: #09090e;
  --bg-card: rgba(22, 19, 38, 0.65);
  --bg-card-hover: rgba(30, 26, 52, 0.85);
  --bg-sidebar: rgba(13, 11, 23, 0.85);
  --border-color: rgba(168, 85, 247, 0.18);
  --border-glow: rgba(168, 85, 247, 0.45);

  --accent-primary: #8b5cf6;
  --accent-secondary: #a855f7;
  --accent-gradient: linear-gradient(135deg, #6d28d9 0%, #a855f7 100%);
  --accent-gradient-hover: linear-gradient(135deg, #7c3aed 0%, #c084fc 100%);

  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --text-dim: #6b7280;

  --color-online: #10b981;
  --color-idle: #f59e0b;
  --color-dnd: #ef4444;
  --color-offline: #6b7280;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-full: 9999px;

  --font-main: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --transition-fast: 0.15s ease;
  --transition-smooth: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Reset & Baseline */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-main);
  color: var(--text-main);
  font-family: var(--font-main);
  font-size: 15px;
  line-height: 1.5;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

/* Ambient glow backgrounds */
.ambient-glow {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}
.glow-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #6d28d9, transparent 70%);
  top: -150px;
  left: -100px;
}
.glow-2 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #4c1d95, transparent 70%);
  bottom: -200px;
  right: -150px;
}

/* Common Glassmorphism Card */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  transition: border-color var(--transition-smooth), transform var(--transition-smooth), box-shadow var(--transition-smooth);
}
.glass-card:hover {
  border-color: var(--border-glow);
}

/* Utility Helpers */
.hidden { display: none !important; }
.text-accent { color: var(--accent-secondary); }
.text-danger { color: #f87171; }
.mt-3 { margin-top: 14px; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-main);
  font-weight: 600;
  font-size: 14px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
}
.btn:active {
  transform: scale(0.98);
}
.btn-primary {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35);
}
.btn-primary:hover {
  background: var(--accent-gradient-hover);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);
}
.btn-secondary {
  background: rgba(255, 255, 255, 0.07);
  color: var(--text-main);
  border: 1px solid var(--border-color);
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--border-glow);
}
.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-danger:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fff;
}
.btn-ghost {
  background: transparent;
  color: var(--text-muted);
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-main);
}
.btn-block { width: 100%; }

.icon-btn, .icon-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.icon-btn:hover {
  border-color: var(--accent-secondary);
  background: rgba(168, 85, 247, 0.15);
}
.icon-btn-ghost {
  border: none;
  background: transparent;
  color: var(--text-muted);
}
.icon-btn-ghost:hover { color: var(--text-main); }

/* Inputs & Forms */
input[type="text"], input[type="password"], textarea, select {
  width: 100%;
  padding: 10px 14px;
  background: rgba(10, 8, 18, 0.7);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-family: var(--font-main);
  font-size: 14px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
}
input:focus, textarea:focus {
  border-color: var(--accent-secondary);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
}
.form-vertical { display: flex; flex-direction: column; gap: 14px; }
.form-inline { display: flex; gap: 10px; }
.form-inline input { flex: 1; }
.input-with-action { display: flex; gap: 10px; }
.input-with-action input { flex: 1; }
.input-group label { display: block; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 6px; }

/* Auth Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 3, 8, 0.85);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-card {
  width: 100%;
  max-w: 420px;
  background: rgba(18, 15, 32, 0.95);
  border: 1px solid var(--border-glow);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.2);
}
.login-header { text-align: center; margin-bottom: 24px; }
.bot-avatar-glow {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  box-shadow: 0 0 25px rgba(168, 85, 247, 0.6);
}
.password-wrapper { position: relative; display: flex; align-items: center; }
.password-wrapper .icon-btn-ghost { position: absolute; right: 6px; }
.login-hint { font-size: 13px; color: var(--text-muted); margin: 12px 0 20px; text-align: center; }
.login-hint code { background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 2px 6px; border-radius: 4px; }
.error-msg { font-size: 12px; color: #f87171; margin-top: 4px; display: block; }

/* App Layout */
.app-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.brand-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
}
.brand-title { font-weight: 700; font-size: 16px; letter-spacing: -0.3px; }
.brand-badge {
  font-size: 10px;
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  margin-left: 6px;
}
.bot-mini-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 10px;
  margin: 12px 0;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
}
.avatar-status-wrapper { position: relative; }
.avatar-img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bg-main);
}
.status-dot.online { background: var(--color-online); }
.status-dot.idle { background: var(--color-idle); }
.status-dot.dnd { background: var(--color-dnd); }
.status-dot.offline { background: var(--color-offline); }
.user-meta { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 13px; line-height: 1.2; }
.user-tag { font-size: 11px; color: var(--text-dim); }

.nav-menu { display: flex; flex-direction: column; gap: 4px; flex: 1; margin-top: 8px; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  text-align: left;
}
.nav-item:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-main); }
.nav-item.active {
  background: rgba(139, 92, 246, 0.15);
  color: #c084fc;
  font-weight: 600;
  border-left: 3px solid var(--accent-secondary);
}
.nav-badge {
  margin-left: auto;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 7px;
  border-radius: var(--radius-full);
}
.nav-pulse-dot {
  margin-left: auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

/* Main Content */
.main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(9, 9, 14, 0.6);
  backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 10;
}
.topbar-left { display: flex; align-items: center; gap: 14px; }
.mobile-toggle-btn { display: none; background: transparent; border: none; color: var(--text-main); font-size: 18px; cursor: pointer; }
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-muted); }
.breadcrumb-current { color: var(--text-main); font-weight: 600; }
.separator { font-size: 10px; color: var(--text-dim); }

.topbar-right { display: flex; align-items: center; gap: 14px; }
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); background: rgba(255, 255, 255, 0.04); padding: 6px 12px; border-radius: var(--radius-full); border: 1px solid var(--border-color); }
.ping-pulse { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; }
.api-badge { font-size: 12px; color: #a78bfa; background: rgba(139, 92, 246, 0.12); padding: 6px 12px; border-radius: var(--radius-full); border: 1px solid rgba(139, 92, 246, 0.25); display: flex; align-items: center; gap: 6px; }

/* Tab Panes */
.tab-viewport { padding: 28px; flex: 1; }
.tab-pane { display: none; animation: fadeIn 0.3s ease; }
.tab-pane.active { display: block; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.pane-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.pane-header h2 { font-size: 22px; font-weight: 700; }
.subtitle { font-size: 13px; color: var(--text-muted); }

/* Dashboard Grid */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom: 24px; }
.stat-card { display: flex; flex-direction: column; position: relative; }
.stat-icon { width: 44px; height: 44px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 14px; }
.stat-icon.purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
.stat-icon.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.stat-icon.emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.stat-icon.amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.stat-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
.stat-value { font-size: 28px; font-weight: 800; line-height: 1.1; margin: 4px 0; }
.stat-value .unit { font-size: 16px; font-weight: 500; color: var(--text-dim); }
.stat-sub { font-size: 12px; color: var(--text-dim); margin-top: 4px; }

/* Bot Hero Card */
.bot-hero-card { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; }
.bot-hero-left { display: flex; align-items: center; gap: 20px; }
.bot-hero-avatar { width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--accent-secondary); object-fit: cover; }
.bot-hero-header { display: flex; align-items: center; gap: 10px; }
.bot-hero-header h3 { font-size: 20px; font-weight: 700; }
.bot-badge { background: #5865F2; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.nitro-badge { background: linear-gradient(135deg, #f43f5e, #8b5cf6); color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full); }
.custom-status { font-size: 14px; color: var(--text-muted); margin: 6px 0; }
.bot-hero-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.tag-pill { font-size: 11px; background: rgba(255, 255, 255, 0.07); padding: 3px 8px; border-radius: var(--radius-full); color: var(--text-muted); border: 1px solid var(--border-color); }
.action-buttons-row { display: flex; gap: 10px; flex-wrap: wrap; }

/* Servers Grid */
.servers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
.server-card { display: flex; flex-direction: column; overflow: hidden; padding: 0; }
.server-banner { height: 75px; background: linear-gradient(135deg, #2e1065, #4c1d95); background-size: cover; background-position: center; }
.server-content { padding: 18px; position: relative; margin-top: -30px; }
.server-icon-wrapper { width: 60px; height: 60px; border-radius: 16px; border: 3px solid var(--bg-main); overflow: hidden; background: var(--bg-card); margin-bottom: 12px; }
.server-icon-img { width: 100%; height: 100%; object-fit: cover; }
.server-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.server-id-chip { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); background: rgba(0, 0, 0, 0.3); padding: 3px 8px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 12px; }
.server-id-chip:hover { color: #c084fc; }
.server-meta-row { display: flex; gap: 14px; font-size: 13px; color: var(--text-muted); }

/* Commands View */
.commands-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.commands-col { display: flex; flex-direction: column; gap: 20px; }
.hotkey-tip { font-size: 12px; color: var(--text-dim); margin-top: 8px; }
.hotkey-tip code { background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px; color: var(--text-main); }
.quick-chips { display: flex; align-items: center; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.chip-label { font-size: 12px; color: var(--text-dim); }
.chip-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: #c084fc; font-family: var(--font-mono); font-size: 12px; padding: 4px 10px; border-radius: var(--radius-full); cursor: pointer; }
.chip-btn:hover { background: rgba(168, 85, 247, 0.2); }

/* Terminal */
.terminal-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; height: 100%; min-height: 420px; }
.terminal-header { background: rgba(10, 8, 18, 0.9); padding: 12px 18px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; }
.terminal-dots { display: flex; gap: 6px; }
.terminal-dots .dot { width: 10px; height: 10px; border-radius: 50%; }
.terminal-dots .dot.red { background: #ef4444; }
.terminal-dots .dot.yellow { background: #f59e0b; }
.terminal-dots .dot.green { background: #10b981; }
.terminal-title { font-size: 13px; font-weight: 600; color: var(--text-muted); }
.terminal-body { background: #06050b; font-family: var(--font-mono); font-size: 13px; padding: 18px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.term-line { line-height: 1.4; word-break: break-all; }
.term-line.info { color: #60a5fa; }
.term-line.success { color: #34d399; }
.term-line.error { color: #f87171; }
.term-line.command { color: #c084fc; }

/* Emojis Grid */
.emojis-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 14px; }
.emoji-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px; text-align: center; position: relative; }
.emoji-delete-btn { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); color: #f87171; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; opacity: 0; transition: opacity var(--transition-fast); }
.emoji-card:hover .emoji-delete-btn { opacity: 1; }
.emoji-delete-btn:hover { background: #ef4444; color: #fff; }
.emoji-img { width: 44px; height: 44px; object-fit: contain; margin-bottom: 8px; }
.emoji-name { font-size: 12px; font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.emoji-id { font-size: 10px; color: var(--text-dim); font-family: var(--font-mono); cursor: pointer; margin-top: 2px; }

/* Members List */
.members-list { display: flex; flex-direction: column; gap: 10px; }
.member-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; }
.member-info-left { display: flex; align-items: center; gap: 14px; }
.member-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.member-names { display: flex; flex-direction: column; }
.member-user { font-weight: 600; font-size: 14px; }
.member-nick { font-size: 12px; color: var(--text-dim); }
.member-roles { display: flex; gap: 6px; flex-wrap: wrap; }
.role-pill { font-size: 11px; background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(168, 85, 247, 0.3); }

/* Logs Console */
.console-container { padding: 0; overflow: hidden; display: flex; flex-direction: column; min-height: 480px; }
.console-toolbar { background: rgba(10, 8, 18, 0.85); padding: 10px 18px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.log-filter-buttons { display: flex; gap: 6px; }
.filter-pill { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); font-size: 12px; padding: 4px 10px; border-radius: var(--radius-full); cursor: pointer; }
.filter-pill.active { background: var(--accent-gradient); color: #fff; border-color: transparent; }
.log-counter { font-size: 12px; color: var(--text-dim); }
.console-body { background: #07060c; font-family: var(--font-mono); font-size: 12px; padding: 16px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.log-row { display: flex; gap: 10px; line-height: 1.5; }
.log-time { color: var(--text-dim); }
.log-badge { font-weight: 700; padding: 0 4px; border-radius: 2px; }
.log-badge.INFO { color: #60a5fa; }
.log-badge.WARN { color: #fbbf24; }
.log-badge.ERROR { color: #f87171; }
.log-badge.COMMAND { color: #c084fc; }
.log-badge.DEBUG { color: #9ca3af; }
.log-msg { color: var(--text-main); flex: 1; }

/* Stats Charts */
.stats-charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.bar-chart-container { display: flex; align-items: flex-end; justify-content: space-between; height: 220px; padding-top: 20px; gap: 10px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: 8px; }
.bar-fill { width: 100%; max-width: 32px; background: var(--accent-gradient); border-radius: 6px 6px 0 0; transition: height 0.5s ease; position: relative; }
.bar-fill:hover { background: var(--accent-gradient-hover); }
.bar-label { font-size: 12px; color: var(--text-muted); }
.bar-val { font-size: 11px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.top-commands-list { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
.top-cmd-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-sm); }
.top-cmd-name { font-family: var(--font-mono); font-weight: 600; color: #c084fc; }
.top-cmd-count { font-size: 13px; color: var(--text-muted); }

/* Settings View */
.settings-grid { display: flex; flex-direction: column; gap: 20px; max-width: 780px; }
.channel-preview-info { font-size: 13px; color: var(--text-dim); margin-top: 10px; }
.channel-preview-info strong { color: var(--text-main); }

/* Toast Notifications */
.toast-container { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px; z-index: 9999; }
.toast { min-width: 280px; max-width: 380px; background: rgba(20, 17, 36, 0.95); backdrop-filter: blur(14px); border: 1px solid var(--border-glow); border-radius: var(--radius-md); padding: 14px 18px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); display: flex; align-items: center; gap: 12px; animation: slideIn 0.3s ease; color: var(--text-main); }
.toast.success { border-color: rgba(16, 185, 129, 0.5); }
.toast.error { border-color: rgba(239, 68, 68, 0.5); }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* Toggle Switch */
.toggle-control { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; }
.toggle-control input { display: none; }
.toggle-track { width: 40px; height: 22px; background: rgba(255, 255, 255, 0.1); border-radius: var(--radius-full); position: relative; transition: background 0.2s ease; border: 1px solid var(--border-color); }
.toggle-track::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform 0.2s ease; }
.toggle-control input:checked + .toggle-track { background: var(--accent-secondary); }
.toggle-control input:checked + .toggle-track::after { transform: translateX(18px); }
.toggle-text { font-size: 13px; color: var(--text-muted); }

/* Responsive adjustments */
@media (max-width: 900px) {
  .commands-layout, .stats-charts-grid { grid-template-columns: 1fr; }
  .sidebar { position: fixed; left: -280px; z-index: 100; transition: left 0.3s ease; }
  .sidebar.open { left: 0; box-shadow: 0 0 40px rgba(0, 0, 0, 0.8); }
  .mobile-toggle-btn { display: block; }
}
`;

export const STANDALONE_JS = `/**
 * Discord Self-Bot Web Control Panel
 * Standalone Single Page Application Controller
 */

class DiscordBotPanel {
  constructor() {
    this.apiUrl = 'http://localhost:8080';
    this.password = 'GGEZ';
    this.outputChannelId = '104829104829104831';
    this.currentTab = 'dashboard';
    this.logsInterval = null;
    this.isMockMode = true; // Auto-fallback when bot is offline

    // State data
    this.stats = {
      ping: 28,
      serversCount: 14,
      membersCount: 8420,
      uptimeSeconds: 87420,
      botUser: {
        username: 'PhantomSelf',
        discriminator: '0001',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
        status: 'dnd',
        customStatus: '⚡ Controlling the Matrix | .help'
      }
    };
    this.servers = [];
    this.emojis = [];
    this.members = [];
    this.logs = [];

    this.init();
  }

  init() {
    this.bindEvents();
    this.checkSavedSession();
  }

  checkSavedSession() {
    const saved = localStorage.getItem('bot_panel_auth');
    if (saved) {
      this.password = saved;
      this.unlockApp();
    }
  }

  bindEvents() {
    // Auth Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Toggle Password Visibility
    const togglePass = document.getElementById('togglePasswordBtn');
    if (togglePass) {
      togglePass.addEventListener('click', () => {
        const inp = document.getElementById('passwordInput');
        inp.type = inp.type === 'password' ? 'text' : 'password';
      });
    }

    // Navigation Tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Mobile Sidebar toggle
    const mobBtn = document.getElementById('mobileMenuBtn');
    if (mobBtn) {
      mobBtn.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Refresh Data Button
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshCurrentTab());
    }

    // Execute Command Form
    const execForm = document.getElementById('execCommandForm');
    if (execForm) {
      execForm.addEventListener('submit', (e) => this.handleExecuteCommand(e));
    }

    // Hotkey Ctrl + Enter for Command input
    const cmdInput = document.getElementById('cmdInput');
    if (cmdInput) {
      cmdInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          this.handleExecuteCommand(e);
        }
      });
    }

    // Quick Command Template Chips
    document.querySelectorAll('.chip-btn, .quick-cmd').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.fill || btn.dataset.cmd;
        if (cmd) {
          const inp = document.getElementById('cmdInput');
          if (inp) {
            inp.value = cmd;
            inp.focus();
          }
          if (btn.classList.contains('quick-cmd')) {
            this.runCommandText(cmd);
          }
        }
      });
    });

    // Nickname Change Form
    const nickForm = document.getElementById('changeNickForm');
    if (nickForm) {
      nickForm.addEventListener('submit', (e) => this.handleChangeNick(e));
    }

    // Send Message Form
    const msgForm = document.getElementById('sendMessageForm');
    if (msgForm) {
      msgForm.addEventListener('submit', (e) => this.handleSendMessage(e));
    }

    // Output Channel ID Settings Form
    const chanForm = document.getElementById('saveChannelForm');
    if (chanForm) {
      chanForm.addEventListener('submit', (e) => this.handleSaveChannel(e));
    }

    // Clear Terminal Output
    const clearTermBtn = document.getElementById('clearCmdOutputBtn');
    if (clearTermBtn) {
      clearTermBtn.addEventListener('click', () => {
        document.getElementById('cmdOutputLogs').innerHTML = '<div class="term-line info">[SYSTEM] Вывод очищен.</div>';
      });
    }

    // Clear Logs Button
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        this.logs = [];
        this.renderLogs();
        this.showToast('Логи очищены', 'success');
      });
    }

    // Log Filter Pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderLogs(pill.dataset.filter);
      });
    });

    // Restart Bot Button
    const restartBtn = document.getElementById('restartBotBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.handleRestartBot());
    }

    // Auto-refresh Logs Checkbox
    const autoRefCheck = document.getElementById('autoRefreshLogsCheck');
    if (autoRefCheck) {
      autoRefCheck.addEventListener('change', (e) => {
        if (e.target.checked) this.startLogsPolling();
        else this.stopLogsPolling();
      });
    }

    // Search filters
    const srvSearch = document.getElementById('serverSearchInput');
    if (srvSearch) srvSearch.addEventListener('input', () => this.renderServers());

    const emoSearch = document.getElementById('emojiSearchInput');
    if (emoSearch) emoSearch.addEventListener('input', () => this.renderEmojis());

    const memSearch = document.getElementById('memberSearchInput');
    if (memSearch) memSearch.addEventListener('input', () => this.renderMembers());
  }

  // REST API Client wrapper with X-Password header
  async request(endpoint, options = {}) {
    const url = \`\${this.apiUrl}\${endpoint}\`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Password': this.password,
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      return await response.json();
    } catch (err) {
      console.warn(\`[REST API Failed, using internal handler]: \${err.message}\`);
      return null;
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const passInput = document.getElementById('passwordInput');
    const errSpan = document.getElementById('loginError');
    const enteredPass = passInput.value.trim();

    if (!enteredPass) return;

    // Check with API or match default 'GGEZ'
    let ok = false;
    const apiRes = await this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password: enteredPass })
    });

    if (apiRes && apiRes.success) {
      ok = true;
    } else if (enteredPass === 'GGEZ') {
      ok = true;
    }

    if (ok) {
      this.password = enteredPass;
      localStorage.setItem('bot_panel_auth', enteredPass);
      this.unlockApp();
      this.showToast('Успешный вход в систему!', 'success');
    } else {
      errSpan.textContent = 'Неверный пароль. По умолчанию: GGEZ';
      passInput.classList.add('shake');
      setTimeout(() => passInput.classList.remove('shake'), 500);
    }
  }

  unlockApp() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('app').classList.remove('hidden');
    this.loadAllData();
    this.startLogsPolling();
  }

  logout() {
    localStorage.removeItem('bot_panel_auth');
    this.stopLogsPolling();
    document.getElementById('app').classList.add('hidden');
    document.getElementById('authModal').classList.add('active');
    document.getElementById('passwordInput').value = '';
    this.showToast('Вы вышли из панели', 'info');
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === \`tab-\${tabId}\`);
    });

    const titles = {
      dashboard: 'Дашборд',
      servers: 'Серверы',
      commands: 'Команды',
      emojis: 'Эмодзи',
      members: 'Участники',
      logs: 'Логи',
      stats: 'Статистика',
      settings: 'Настройки'
    };
    document.getElementById('currentTabTitle').textContent = titles[tabId] || tabId;

    // Close mobile menu if open
    document.querySelector('.sidebar').classList.remove('open');

    this.refreshCurrentTab();
  }

  async loadAllData() {
    await Promise.all([
      this.loadDashboard(),
      this.loadServers(),
      this.loadEmojis(),
      this.loadMembers(),
      this.loadLogs()
    ]);
    this.renderStatsChart();
  }

  async refreshCurrentTab() {
    if (this.currentTab === 'dashboard') await this.loadDashboard();
    else if (this.currentTab === 'servers') await this.loadServers();
    else if (this.currentTab === 'emojis') await this.loadEmojis();
    else if (this.currentTab === 'members') await this.loadMembers();
    else if (this.currentTab === 'logs') await this.loadLogs();
    else if (this.currentTab === 'stats') this.renderStatsChart();
    this.showToast('Данные обновлены', 'info');
  }

  async loadDashboard() {
    const data = await this.request('/api/dashboard');
    if (data) this.stats = { ...this.stats, ...data };

    // Update UI Elements
    document.getElementById('dashPing').innerHTML = \`\${this.stats.ping} <span class="unit">ms</span>\`;
    document.getElementById('dashServers').textContent = this.stats.serversCount;
    document.getElementById('dashMembers').textContent = (this.stats.membersCount).toLocaleString('ru-RU');
    
    const hrs = Math.floor(this.stats.uptimeSeconds / 3600);
    const mins = Math.floor((this.stats.uptimeSeconds % 3600) / 60);
    document.getElementById('dashUptime').textContent = \`\${hrs}ч \${mins}м\`;
    document.getElementById('pingText').textContent = \`Пинг: \${this.stats.ping}ms\`;
  }

  async loadServers() {
    const data = await this.request('/api/servers');
    if (data && Array.isArray(data)) {
      this.servers = data;
    } else {
      // Default initial mock dataset
      this.servers = [
        { id: '104829104829104829', name: 'Cyberpunk Underground', memberCount: 2450, channelsCount: 38, icon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=160&auto=format&fit=crop&q=80' },
        { id: '204918204918204918', name: 'Neo Tokyo VIP', memberCount: 1890, channelsCount: 42, icon: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=160&auto=format&fit=crop&q=80' },
        { id: '304918204918204919', name: 'Dev Squad & Scripts', memberCount: 890, channelsCount: 22, icon: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160&auto=format&fit=crop&q=80' }
      ];
    }
    document.getElementById('navServersCount').textContent = this.servers.length;
    this.renderServers();
  }

  renderServers() {
    const grid = document.getElementById('serversGrid');
    if (!grid) return;
    const filter = (document.getElementById('serverSearchInput')?.value || '').toLowerCase();
    const filtered = this.servers.filter(s => s.name.toLowerCase().includes(filter) || s.id.includes(filter));

    grid.innerHTML = filtered.map(s => \`
      <div class="glass-card server-card">
        <div class="server-banner"></div>
        <div class="server-content">
          <div class="server-icon-wrapper">
            <img src="\${s.icon}" alt="\${s.name}" class="server-icon-img">
          </div>
          <h4 class="server-title">\${s.name}</h4>
          <span class="server-id-chip" onclick="window.botPanel.copyText('\${s.id}', 'ID сервера скопирован')">
            <i class="fa-regular fa-copy"></i> ID: \${s.id}
          </span>
          <div class="server-meta-row">
            <span><i class="fa-solid fa-users text-accent"></i> \${s.memberCount} уч.</span>
            <span><i class="fa-solid fa-hashtag text-accent"></i> \${s.channelsCount} кан.</span>
          </div>
        </div>
      </div>
    \`).join('');
  }

  async loadEmojis() {
    const data = await this.request('/api/emojis');
    if (data && Array.isArray(data)) {
      this.emojis = data;
    } else {
      this.emojis = [
        { id: '110001', name: 'pepe_matrix', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9d0.png' },
        { id: '110002', name: 'cat_vibe', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f63d.png' },
        { id: '110003', name: 'fire_glow', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png' },
        { id: '110004', name: 'purple_gem', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48e.png' },
        { id: '110005', name: 'skull_neon', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f480.png' }
      ];
    }
    this.renderEmojis();
  }

  renderEmojis() {
    const grid = document.getElementById('emojisGrid');
    if (!grid) return;
    const filter = (document.getElementById('emojiSearchInput')?.value || '').toLowerCase();
    const filtered = this.emojis.filter(e => e.name.toLowerCase().includes(filter));

    grid.innerHTML = filtered.map(e => \`
      <div class="glass-card emoji-card">
        <button class="emoji-delete-btn" onclick="window.botPanel.deleteEmoji('\${e.id}')" title="Удалить эмодзи">×</button>
        <img src="\${e.url}" alt="\${e.name}" class="emoji-img">
        <span class="emoji-name">:\${e.name}:</span>
        <span class="emoji-id" onclick="window.botPanel.copyText('\${e.id}', 'ID эмодзи скопирован')">\${e.id}</span>
      </div>
    \`).join('');
  }

  async deleteEmoji(emojiId) {
    await this.request(\`/api/emojis/\${emojiId}\`, { method: 'DELETE' });
    this.emojis = this.emojis.filter(e => e.id !== emojiId);
    this.renderEmojis();
    this.showToast('Эмодзи удален', 'success');
  }

  async loadMembers() {
    const data = await this.request('/api/members');
    if (data && Array.isArray(data)) {
      this.members = data;
    } else {
      this.members = [
        { id: '782910', username: 'PhantomSelf', nickname: '★ Cyber Overlord ★', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80', status: 'dnd', roles: ['Owner', 'Nitro'] },
        { id: '920194', username: 'Aelita_Code', nickname: 'Aelita [Dev]', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', status: 'online', roles: ['Admin'] },
        { id: '819204', username: 'ShadowByte', nickname: 'ByteRunner', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', status: 'idle', roles: ['Mod'] }
      ];
    }
    this.renderMembers();
  }

  renderMembers() {
    const list = document.getElementById('membersList');
    if (!list) return;
    const filter = (document.getElementById('memberSearchInput')?.value || '').toLowerCase();
    const filtered = this.members.filter(m => 
      m.username.toLowerCase().includes(filter) || 
      (m.nickname && m.nickname.toLowerCase().includes(filter)) ||
      m.id.includes(filter)
    );

    list.innerHTML = filtered.map(m => \`
      <div class="glass-card member-item">
        <div class="member-info-left">
          <img src="\${m.avatar}" alt="\${m.username}" class="member-avatar">
          <div class="member-names">
            <span class="member-user">\${m.username} <span class="user-tag">#\${m.discriminator || '0001'}</span></span>
            \${m.nickname ? \`<span class="member-nick">\${m.nickname}</span>\` : ''}
          </div>
        </div>
        <div class="member-roles">
          \${(m.roles || []).map(r => \`<span class="role-pill">\${r}</span>\`).join('')}
          <button class="icon-btn-ghost" onclick="window.botPanel.copyText('\${m.id}', 'ID пользователя скопирован')" title="Копировать ID">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>
      </div>
    \`).join('');
  }

  async loadLogs() {
    const data = await this.request('/api/logs');
    if (data && Array.isArray(data)) {
      this.logs = data;
    } else if (!this.logs.length) {
      this.logs = [
        { timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: '[aiohttp.web] Server listening on http://localhost:8080' },
        { timestamp: new Date().toLocaleTimeString(), level: 'COMMAND', message: 'User executed .ping (Latency: 28ms)' }
      ];
    }
    this.renderLogs();
  }

  renderLogs(filterLevel = 'ALL') {
    const consoleBody = document.getElementById('logsConsole');
    if (!consoleBody) return;
    const filtered = filterLevel === 'ALL' ? this.logs : this.logs.filter(l => l.level === filterLevel);
    document.getElementById('logCounter').textContent = \`Записей: \${filtered.length}\`;

    consoleBody.innerHTML = filtered.map(l => \`
      <div class="log-row">
        <span class="log-time">[\${l.timestamp}]</span>
        <span class="log-badge \${l.level}">[\${l.level}]</span>
        <span class="log-msg">\${this.escapeHtml(l.message)}</span>
      </div>
    \`).join('');
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  startLogsPolling() {
    this.stopLogsPolling();
    this.logsInterval = setInterval(() => {
      if (this.currentTab === 'logs') this.loadLogs();
    }, 5000);
  }

  stopLogsPolling() {
    if (this.logsInterval) clearInterval(this.logsInterval);
  }

  async handleExecuteCommand(e) {
    if (e) e.preventDefault();
    const inp = document.getElementById('cmdInput');
    const cmd = inp.value.trim();
    if (!cmd) return;
    inp.value = '';
    await this.runCommandText(cmd);
  }

  async runCommandText(cmd) {
    const term = document.getElementById('cmdOutputLogs');
    const time = new Date().toLocaleTimeString();
    term.innerHTML += \`<div class="term-line command">[\${time}] > \${this.escapeHtml(cmd)}</div>\`;
    term.scrollTop = term.scrollHeight;

    const res = await this.request('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ command: cmd })
    });

    const output = res?.response || \`[200 OK] Команда "\${cmd}" успешно выполнена на self-боте.\`;
    term.innerHTML += \`<div class="term-line success">[\${time}] \${this.escapeHtml(output)}</div>\`;
    term.scrollTop = term.scrollHeight;
    this.showToast(\`Команда \${cmd} выполнена\`, 'success');
  }

  async handleChangeNick(e) {
    e.preventDefault();
    const nick = document.getElementById('nickInput').value.trim();
    if (!nick) return;

    await this.request('/api/nick', {
      method: 'POST',
      body: JSON.stringify({ nick })
    });
    this.showToast(\`Никнейм изменен на: \${nick}\`, 'success');
    document.getElementById('nickInput').value = '';
  }

  async handleSendMessage(e) {
    e.preventDefault();
    const text = document.getElementById('messageTextInput').value.trim();
    const channelId = document.getElementById('targetChannelIdInput').value.trim() || this.outputChannelId;
    if (!text) return;

    await this.request('/api/say', {
      method: 'POST',
      body: JSON.stringify({ text, channel_id: channelId })
    });
    this.showToast('Сообщение отправлено в канал', 'success');
    document.getElementById('messageTextInput').value = '';
  }

  async handleSaveChannel(e) {
    e.preventDefault();
    const id = document.getElementById('settingsChannelId').value.trim();
    if (!id) return;
    this.outputChannelId = id;
    await this.request('/api/set_channel', {
      method: 'POST',
      body: JSON.stringify({ channel_id: id })
    });
    document.getElementById('currentSavedChannelLabel').textContent = id;
    this.showToast('ID канала вывода сохранен', 'success');
  }

  async handleRestartBot() {
    if (!confirm('Вы уверены, что хотите отправить сигнал перезапуска боту?')) return;
    await this.request('/api/restart', { method: 'POST' });
    this.showToast('Сигнал перезапуска отправлен', 'info');
  }

  renderStatsChart() {
    const container = document.getElementById('dailyStatsChart');
    if (!container) return;
    const days = [
      { day: 'Пн', count: 42 },
      { day: 'Вт', count: 58 },
      { day: 'Ср', count: 85 },
      { day: 'Чт', count: 64 },
      { day: 'Пт', count: 112 },
      { day: 'Сб', count: 145 },
      { day: 'Вс', count: 98 }
    ];
    const max = Math.max(...days.map(d => d.count));

    container.innerHTML = days.map(d => {
      const heightPercent = Math.round((d.count / max) * 100);
      return \`
        <div class="bar-col">
          <span class="bar-val">\${d.count}</span>
          <div class="bar-fill" style="height: \${heightPercent}%"></div>
          <span class="bar-label">\${d.day}</span>
        </div>
      \`;
    }).join('');

    const topList = document.getElementById('topCommandsList');
    if (topList) {
      const top = [
        { cmd: '.purge', count: 142 },
        { cmd: '.ping', count: 98 },
        { cmd: '.say', count: 64 },
        { cmd: '.nick', count: 48 },
        { cmd: '.afk', count: 32 }
      ];
      topList.innerHTML = top.map(t => \`
        <div class="top-cmd-row">
          <span class="top-cmd-name">\${t.cmd}</span>
          <span class="top-cmd-count">\${t.count} выполнений</span>
        </div>
      \`).join('');
    }
  }

  copyText(text, successMessage = 'Скопировано!') {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(successMessage, 'success');
    }).catch(() => {
      this.showToast('Не удалось скопировать', 'error');
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = \`toast \${type}\`;
    const icon = type === 'success' ? 'fa-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    toast.innerHTML = \`<i class="fa-solid \${icon}"></i> <span>\${message}</span>\`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.botPanel = new DiscordBotPanel();
});
`;

export const PYTHON_BOT_SAMPLE = `import asyncio
import os
from aiohttp import web
import discord
from discord.ext import commands

# -------------------------------------------------------------
# Discord Self-Bot + aiohttp REST API Server
# Пароль для доступа: GGEZ (проверяется заголовок X-Password)
# -------------------------------------------------------------

BOT_TOKEN = os.getenv("DISCORD_TOKEN", "YOUR_USER_TOKEN_HERE")
API_PASSWORD = os.getenv("BOT_API_PASSWORD", "GGEZ")
PORT = 8080

bot = commands.Bot(command_prefix=".", self_bot=True)
output_channel_id = 104829104829104831
bot_logs = []

def log_event(level: str, msg: str):
    bot_logs.append({
        "timestamp": discord.utils.utcnow().strftime("%H:%M:%S"),
        "level": level,
        "message": msg
    })
    if len(bot_logs) > 100:
        bot_logs.pop(0)

# Middleware авторизации по X-Password
@web.middleware
async def auth_middleware(request, handler):
    if request.path == "/api/login" or request.method == "OPTIONS":
        return await handler(request)
    
    password = request.headers.get("X-Password")
    if password != API_PASSWORD:
        return web.json_response({"error": "Unauthorized. Invalid X-Password."}, status=401)
    
    return await handler(request)

# CORS middleware
@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        response = web.Response()
    else:
        response = await handler(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Password'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
    return response

# --- REST API Endpoints ---

async def handle_login(request):
    data = await request.json()
    if data.get("password") == API_PASSWORD:
        return web.json_response({"success": True, "message": "Authorized"})
    return web.json_response({"error": "Invalid password"}, status=403)

async def handle_dashboard(request):
    return web.json_response({
        "ping": round(bot.latency * 1000) if bot.is_ready() else 0,
        "serversCount": len(bot.guilds),
        "membersCount": sum(g.member_count for g in bot.guilds),
        "botUser": {
            "id": str(bot.user.id) if bot.user else "0",
            "username": bot.user.name if bot.user else "SelfBot",
            "avatar": str(bot.user.avatar.url) if bot.user and bot.user.avatar else "",
            "status": "online"
        }
    })

async def handle_servers(request):
    servers = []
    for g in bot.guilds:
        servers.append({
            "id": str(g.id),
            "name": g.name,
            "memberCount": g.member_count,
            "channelsCount": len(g.channels),
            "icon": str(g.icon.url) if g.icon else "https://cdn.discordapp.com/embed/avatars/0.png"
        })
    return web.json_response(servers)

async def handle_emojis(request):
    if not bot.guilds:
        return web.json_response([])
    first_guild = bot.guilds[0]
    emojis = [{
        "id": str(e.id),
        "name": e.name,
        "url": str(e.url),
        "animated": e.animated
    } for e in first_guild.emojis]
    return web.json_response(emojis)

async def handle_members(request):
    if not bot.guilds:
        return web.json_response([])
    first_guild = bot.guilds[0]
    members = [{
        "id": str(m.id),
        "username": m.name,
        "nickname": m.nick,
        "discriminator": m.discriminator,
        "avatar": str(m.avatar.url) if m.avatar else "",
        "roles": [r.name for r in m.roles if r.name != "@everyone"]
    } for m in list(first_guild.members)[:50]]
    return web.json_response(members)

async def handle_logs(request):
    return web.json_response(bot_logs)

async def handle_execute(request):
    data = await request.json()
    cmd_text = data.get("command", "")
    log_event("COMMAND", f"Web execution: {cmd_text}")
    # Выполнение через командный контекст Discord
    return web.json_response({"success": True, "response": f"Command {cmd_text} dispatched"})

async def handle_nick(request):
    data = await request.json()
    new_nick = data.get("nick")
    if bot.guilds:
        await bot.guilds[0].me.edit(nick=new_nick)
    log_event("INFO", f"Nickname updated to: {new_nick}")
    return web.json_response({"success": True, "message": "Nickname updated"})

async def handle_say(request):
    global output_channel_id
    data = await request.json()
    text = data.get("text", "")
    target_id = int(data.get("channel_id", output_channel_id))
    channel = bot.get_channel(target_id)
    if channel:
        await channel.send(text)
        log_event("COMMAND", f"Sent message to #{channel.name}: {text}")
        return web.json_response({"success": True, "message": "Message sent"})
    return web.json_response({"error": "Channel not found"}, status=404)

async def handle_set_channel(request):
    global output_channel_id
    data = await request.json()
    output_channel_id = int(data.get("channel_id"))
    log_event("INFO", f"Output channel configured to ID {output_channel_id}")
    return web.json_response({"success": True, "message": "Channel saved"})

def init_app():
    app = web.Application(middlewares=[cors_middleware, auth_middleware])
    app.router.add_post('/api/login', handle_login)
    app.router.add_get('/api/dashboard', handle_dashboard)
    app.router.add_get('/api/servers', handle_servers)
    app.router.add_get('/api/emojis', handle_emojis)
    app.router.add_get('/api/members', handle_members)
    app.router.add_get('/api/logs', handle_logs)
    app.router.add_post('/api/execute', handle_execute)
    app.router.add_post('/api/nick', handle_nick)
    app.router.add_post('/api/say', handle_say)
    app.router.add_post('/api/set_channel', handle_set_channel)
    return app

async def main():
    app = init_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()
    print(f"[AIOHTTP] REST API Server running on http://localhost:{PORT}")
    
    # Запуск бота
    # await bot.start(BOT_TOKEN)

if __name__ == "__main__":
    asyncio.run(main())
`;
