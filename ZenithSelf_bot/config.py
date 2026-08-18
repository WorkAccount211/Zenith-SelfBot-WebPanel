import os
import secrets
from dotenv import load_dotenv

# Загрузка переменных окружения из .env файла
load_dotenv()

# =============================================================================
# 🔑 Discord User Token & Bot Settings
# =============================================================================
# Токен личной учетной записи Discord (User Token)
# Получение: DevTools (F12 в браузере) -> Network -> Header 'authorization'
TOKEN = os.getenv("DISCORD_TOKEN", "ВАШ_ТОКЕН_ЗАМЕНИТЕ")

# Префикс команд в чате Discord (по умолчанию '.')
PREFIX = os.getenv("BOT_PREFIX", ".")

# ID канала по умолчанию для перенаправления ответов бота (None = текущий чат)
DEFAULT_OUTPUT_CHANNEL_ID = int(os.getenv("DEFAULT_OUTPUT_CHANNEL_ID", 1474494686344384634))
# ID канала для логов команд и статусов. Если не задан, используется DEFAULT_OUTPUT_CHANNEL_ID.
LOG_CHANNEL_ID = int(os.getenv("LOG_CHANNEL_ID", DEFAULT_OUTPUT_CHANNEL_ID))

# =============================================================================
# 🗄️ SQLite Database Configuration (aiosqlite)
# =============================================================================
# Путь к файлу базы данных SQLite для сохранения всех настроек, варнов и сессий
DATABASE_PATH = os.getenv("DATABASE_PATH", "bot_database.sqlite")

# =============================================================================
# 🌐 Web REST API Server (Входящие запросы от внешней веб-панели)
# =============================================================================
# Хост и порт для запуска встроенного aiohttp REST API сервера
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8080))

# Разрешенные CORS источники (Origin) для веб-панелей на других доменах / портах
# Используйте "*", чтобы принимать запросы с любого хоста, или конкретный URL панели:
# Например: "http://localhost:3000,http://localhost:5173,https://my-panel.vercel.app"
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "*")

# =============================================================================
# 🔒 Безопасность и OAuth2 / Bearer Token аутентификация
# =============================================================================
# Логин и пароль администратора для получения сессионного Bearer токена через /api/auth/token
API_ADMIN_USERNAME = os.getenv("API_ADMIN_USERNAME", "admin")
API_ADMIN_PASSWORD = os.getenv("API_ADMIN_PASSWORD", "GGEZ")

# Статический API-ключ для быстрой прямой интеграции без генерации сессий (через заголовок X-API-Key или X-Password)
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "GGEZ")

# Срок жизни OAuth2 Bearer сессии в часах
SESSION_EXPIRE_HOURS = int(os.getenv("SESSION_EXPIRE_HOURS", 24))

# =============================================================================
# 🔗 Взаимодействие с ВНЕШНЕЙ веб-панелью (Исходящие события и синхронизация)
# =============================================================================
# URL внешней веб-панели управления (из другого проекта / хостинга / репозитория)
# Например: "http://localhost:3000" или "https://your-external-webpanel.com"
WEB_PANEL_URL = os.getenv("WEB_PANEL_URL", "http://localhost:3000")

# Отправлять ли webhook-уведомления и события во внешнюю веб-панель при изменении состояния бота
# (старт, смена статуса, выполнение команд, выдача варнов, новые логи)
ENABLE_WEB_PANEL_WEBHOOKS = os.getenv("ENABLE_WEB_PANEL_WEBHOOKS", "true").lower() in ("true", "1", "yes")

# Секретный токен для подписи исходящих вебхуков (передается в заголовке X-Bot-Secret во внешнюю панель)
WEB_PANEL_SECRET_TOKEN = os.getenv("WEB_PANEL_SECRET_TOKEN", "WEB_PANEL_SYNC_SECRET")

# Интервал отправки Heartbeat пинга во внешнюю панель (в секундах, 0 для отключения)
WEB_PANEL_HEARTBEAT_INTERVAL = int(os.getenv("WEB_PANEL_HEARTBEAT_INTERVAL", 30))

# =============================================================================
# 📝 Настройки логирования
# =============================================================================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "bot.log")
LOG_MAX_IN_MEMORY = int(os.getenv("LOG_MAX_IN_MEMORY", 100))

# Отключить debug логирование от discord.py (уменьшает спам)
DISCORD_DEBUG_MODE = os.getenv("DISCORD_DEBUG_MODE", "false").lower() in ("true", "1", "yes")

# Отключить очень подробное логирование aiohttp
AIOHTTP_DEBUG_MODE = os.getenv("AIOHTTP_DEBUG_MODE", "false").lower() in ("true", "1", "yes")

# Минимальный уровень логирования для веб-панели (избежать спама)
WEB_PANEL_LOG_MIN_LEVEL = os.getenv("WEB_PANEL_LOG_MIN_LEVEL", "INFO")  # INFO, WARN, ERROR

# Количество повторных попыток запуска при отсутствии доступа к Discord / DNS-ошибках
STARTUP_RETRIES = int(os.getenv("STARTUP_RETRIES", "5"))
STARTUP_RETRY_DELAY_SECONDS = int(os.getenv("STARTUP_RETRY_DELAY_SECONDS", "5"))
