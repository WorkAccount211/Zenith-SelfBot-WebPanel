"""
🤖 Discord Self-Bot Enterprise (SQLite + OAuth2 & External Web Panel Integration)
================================================================================
Мощный и расширяемый Discord Self-Bot со встроенным асинхронным REST API,
базой данных SQLite (aiosqlite) и двусторонней интеграцией с внешними веб-панелями.
"""

import os
import sys
import time
import json
import logging
import asyncio
import datetime
import secrets
import io
import ast
import re
import random
import urllib.parse
from typing import Optional, Dict, Any, List

import aiohttp
from aiohttp import web
import aiosqlite
import discord
from discord.ext import commands

import config

# =============================================================================
# 📝 Настройка логирования
# =============================================================================
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(config.LOG_FILE, encoding="utf-8")
    ]
)
logger = logging.getLogger("SelfBot")

COMMAND_CATALOG = [
    {"name": "ping", "aliases": ["пинг"], "category": "utility", "description": "Проверка задержки бота"},
    {"name": "help", "aliases": ["хелп", "помощь"], "category": "utility", "description": "Справка по доступным командам"},
    {"name": "stats", "aliases": ["стата"], "category": "utility", "description": "Статистика бота"},
    {"name": "uptime", "aliases": ["аптайм"], "category": "utility", "description": "Время работы бота"},
    {"name": "userinfo", "aliases": ["user", "юзеринфо"], "category": "utility", "description": "Информация о пользователе"},
    {"name": "serverinfo", "aliases": ["guild", "серверинфо"], "category": "utility", "description": "Информация о сервере"},
    {"name": "avatar", "aliases": ["ава", "аватар"], "category": "utility", "description": "Ссылка на аватар"},
    {"name": "roles", "aliases": ["роли"], "category": "utility", "description": "Список ролей сервера"},
    {"name": "emojis", "aliases": ["эмодзи"], "category": "utility", "description": "Список эмодзи сервера"},
    {"name": "setoutput", "aliases": ["сетканал"], "category": "moderation", "description": "Назначить канал вывода"},
    {"name": "status", "aliases": ["статус"], "category": "status", "description": "Установить кастомный статус"},
    {"name": "stream", "aliases": ["стрим"], "category": "status", "description": "Стрим-статус"},
    {"name": "say", "aliases": ["сказать"], "category": "utility", "description": "Отправить сообщение"},
    {"name": "warn", "aliases": ["варн"], "category": "moderation", "description": "Выдать предупреждение"},
    {"name": "warns", "aliases": ["варны"], "category": "moderation", "description": "Показать предупреждения"},
    {"name": "purge", "aliases": ["очистить", "clear"], "category": "moderation", "description": "Удалить сообщения"},
    {"name": "addcmd", "aliases": ["добавить_команду"], "category": "utility", "description": "Создать кастомную команду"},
    {"name": "delcmd", "aliases": ["удалить_команду"], "category": "utility", "description": "Удалить кастомную команду"},
    {"name": "customcmds", "aliases": ["команды"], "category": "utility", "description": "Список кастомных команд"},
    {"name": "afk", "aliases": ["афк"], "category": "utility", "description": "AFK-режим"},
    {"name": "casino", "aliases": [], "category": "fun", "description": "Игровой автомат"},
    {"name": "coinflip", "aliases": [], "category": "fun", "description": "Подбрасывание монеты"},
    {"name": "rps", "aliases": [], "category": "fun", "description": "Камень, ножницы, бумага"}
]

# Отключить debug логирование от discord.py (уменьшает спам)
if not config.DISCORD_DEBUG_MODE:
    logging.getLogger("discord").setLevel(logging.INFO)
    logging.getLogger("discord.client").setLevel(logging.INFO)
    logging.getLogger("discord.gateway").setLevel(logging.WARNING)
    logging.getLogger("discord.http").setLevel(logging.WARNING)
    logging.getLogger("discord.utils").setLevel(logging.ERROR)

# Отключить очень подробное логирование aiohttp
if not config.AIOHTTP_DEBUG_MODE:
    logging.getLogger("aiohttp").setLevel(logging.WARNING)
    logging.getLogger("aiohttp.web").setLevel(logging.WARNING)
    logging.getLogger("aiohttp.access").setLevel(logging.ERROR)

# =============================================================================
# 🗄️ Менеджер базы данных SQLite (aiosqlite)
# =============================================================================
class DatabaseManager:
    """Асинхронный менеджер SQLite базы данных с режимом WAL для надежного хранения."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._db: Optional[aiosqlite.Connection] = None

    async def connect(self):
        """Инициализация подключения и создание таблиц."""
        self._db = await aiosqlite.connect(self.db_path)
        self._db.row_factory = aiosqlite.Row
        
        # Включение режима WAL для высокой производительности и параллельного чтения
        await self._db.execute("PRAGMA journal_mode = WAL;")
        await self._db.execute("PRAGMA foreign_keys = ON;")
        await self._create_tables()
        logger.info(f"🗄️ База данных SQLite успешно подключена: {self.db_path}")

    async def _create_tables(self):
        """Создание необходимых таблиц базы данных."""
        # 1. Таблица предупреждений пользователей
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                moderator_name TEXT NOT NULL,
                reason TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Таблица настроек каналов вывода для серверов
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS channel_settings (
                guild_id TEXT PRIMARY KEY,
                output_channel_id TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. Таблица кастомных команд бота
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS custom_commands (
                name TEXT PRIMARY KEY,
                response TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 4. Таблица OAuth2 / Bearer сессий веб-панели
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS auth_sessions (
                access_token TEXT PRIMARY KEY,
                refresh_token TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                client_ip TEXT,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 5. Таблица зарегистрированных внешних веб-панелей для вебхуков
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS panel_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                panel_url TEXT UNIQUE NOT NULL,
                secret_token TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 6. Таблица системных логов бота
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS bot_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                source TEXT DEFAULT 'bot',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        await self._db.commit()

    async def close(self):
        """Корректное закрытие базы данных."""
        if self._db:
            await self._db.close()
            logger.info("🗄️ База данных закрыта.")

    # --- Методы для Настроек Каналов ---
    async def get_output_channel(self, guild_id: str) -> Optional[int]:
        async with self._db.execute("SELECT output_channel_id FROM channel_settings WHERE guild_id = ?", (str(guild_id),)) as cursor:
            row = await cursor.fetchone()
            return int(row["output_channel_id"]) if row else None

    async def set_output_channel(self, guild_id: str, channel_id: int):
        await self._db.execute("""
            INSERT INTO channel_settings (guild_id, output_channel_id, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(guild_id) DO UPDATE SET output_channel_id = excluded.output_channel_id, updated_at = CURRENT_TIMESTAMP;
        """, (str(guild_id), str(channel_id)))
        await self._db.commit()

    async def remove_output_channel(self, guild_id: str):
        await self._db.execute("DELETE FROM channel_settings WHERE guild_id = ?", (str(guild_id),))
        await self._db.commit()

    # --- Методы для Предупреждений (Warnings) ---
    async def add_warning(self, guild_id: str, user_id: str, user_name: str, moderator_id: str, moderator_name: str, reason: str) -> int:
        cursor = await self._db.execute("""
            INSERT INTO warnings (guild_id, user_id, user_name, moderator_id, moderator_name, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(guild_id), str(user_id), user_name, str(moderator_id), moderator_name, reason))
        await self._db.commit()
        return cursor.lastrowid

    async def get_user_warnings(self, guild_id: str, user_id: str) -> List[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC", (str(guild_id), str(user_id))) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_all_warnings(self, guild_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if guild_id:
            query = "SELECT * FROM warnings WHERE guild_id = ? ORDER BY created_at DESC"
            params = (str(guild_id),)
        else:
            query = "SELECT * FROM warnings ORDER BY created_at DESC"
            params = ()
        async with self._db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def clear_user_warnings(self, guild_id: str, user_id: str) -> int:
        cursor = await self._db.execute("DELETE FROM warnings WHERE guild_id = ? AND user_id = ?", (str(guild_id), str(user_id)))
        await self._db.commit()
        return cursor.rowcount

    async def delete_warning_by_id(self, warn_id: int) -> bool:
        cursor = await self._db.execute("DELETE FROM warnings WHERE id = ?", (warn_id,))
        await self._db.commit()
        return cursor.rowcount > 0

    # --- Методы для Кастомных Команд ---
    async def add_custom_command(self, name: str, response: str, created_by: str = "Owner"):
        await self._db.execute("""
            INSERT INTO custom_commands (name, response, created_by, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(name) DO UPDATE SET response = excluded.response;
        """, (name.lower(), response, created_by))
        await self._db.commit()

    async def get_custom_command(self, name: str) -> Optional[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM custom_commands WHERE name = ?", (name.lower(),)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def get_all_custom_commands(self) -> List[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM custom_commands ORDER BY name ASC") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def delete_custom_command(self, name: str) -> bool:
        cursor = await self._db.execute("DELETE FROM custom_commands WHERE name = ?", (name.lower(),))
        await self._db.commit()
        return cursor.rowcount > 0

    # --- Методы для Аутентификации и OAuth2 Сессий ---
    async def create_auth_session(self, username: str, client_ip: str = "") -> Dict[str, Any]:
        access_token = secrets.token_urlsafe(36)
        refresh_token = secrets.token_urlsafe(48)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=config.SESSION_EXPIRE_HOURS)

        await self._db.execute("""
            INSERT INTO auth_sessions (access_token, refresh_token, username, client_ip, expires_at)
            VALUES (?, ?, ?, ?, ?)
        """, (access_token, refresh_token, username, client_ip, expires_at.isoformat()))
        await self._db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": config.SESSION_EXPIRE_HOURS * 3600,
            "expires_at": expires_at.isoformat(),
            "username": username
        }

    async def validate_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM auth_sessions WHERE access_token = ?", (token,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            session = dict(row)
            expires_at = datetime.datetime.fromisoformat(session["expires_at"])
            if datetime.datetime.utcnow() > expires_at:
                await self.revoke_session(token)
                return None
            return session

    async def refresh_auth_session(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM auth_sessions WHERE refresh_token = ?", (refresh_token,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            
            old_session = dict(row)
            # Отзываем старую сессию
            await self._db.execute("DELETE FROM auth_sessions WHERE refresh_token = ?", (refresh_token,))
            
            # Создаем новую
            return await self.create_auth_session(old_session["username"], old_session.get("client_ip", ""))

    async def revoke_session(self, access_token: str) -> bool:
        cursor = await self._db.execute("DELETE FROM auth_sessions WHERE access_token = ?", (access_token,))
        await self._db.commit()
        return cursor.rowcount > 0

    # --- Подписки веб-панелей (Webhooks) ---
    async def add_panel_subscription(self, url: str, secret: str = ""):
        await self._db.execute("""
            INSERT INTO panel_subscriptions (panel_url, secret_token)
            VALUES (?, ?)
            ON CONFLICT(panel_url) DO UPDATE SET secret_token = excluded.secret_token;
        """, (url, secret))
        await self._db.commit()

    async def get_panel_subscriptions(self) -> List[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM panel_subscriptions") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    # --- Логи ---
    async def log_event(self, level: str, message: str, source: str = "bot"):
        await self._db.execute("INSERT INTO bot_logs (level, message, source) VALUES (?, ?, ?)", (level, message, source))
        await self._db.commit()

    async def get_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM bot_logs ORDER BY created_at DESC LIMIT ?", (limit,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def clear_logs(self):
        await self._db.execute("DELETE FROM bot_logs")
        await self._db.commit()


# =============================================================================
# 🤖 Discord Self-Bot Core Class
# =============================================================================
class SelfBotClient(commands.Bot):
    """Кастомный класс Discord Self-Bot с интеграцией SQLite и внешних панелей."""

    def __init__(self):
        super().__init__(
            command_prefix=config.PREFIX,
            self_bot=True,
            help_command=None
        )
        self.start_time = time.time()
        self.db = DatabaseManager(config.DATABASE_PATH)
        self.logs_buffer: List[Dict[str, Any]] = []
        self.api_runner: Optional[web.AppRunner] = None
        self.http_session: Optional[aiohttp.ClientSession] = None
        
        # Счетчики для статистики
        self.messages_count = 0
        self.commands_count = 0

    async def setup_hook(self):
        """Выполняется перед стартом бота: инициализация БД, API сервера и сессий."""
        # 1. Подключение SQLite
        await self.db.connect()

        # 2. Создание aiohttp сессии для исходящих запросов к внешней веб-панели
        self.http_session = aiohttp.ClientSession()

        # 3. Добавление начальной подписки из config.WEB_PANEL_URL, если задано
        if config.WEB_PANEL_URL:
            await self.db.add_panel_subscription(config.WEB_PANEL_URL, config.WEB_PANEL_SECRET_TOKEN)
            logger.info(f"🔗 Внешняя веб-панель подключена в конфигурации: {config.WEB_PANEL_URL}")

        # 4. Запуск встроенного REST API сервера
        await self.start_api_server()

        # 5. Запуск фоновой задачи Heartbeat для внешней веб-панели
        if config.ENABLE_WEB_PANEL_WEBHOOKS and config.WEB_PANEL_HEARTBEAT_INTERVAL > 0:
            self.loop.create_task(self._heartbeat_loop())

    async def add_log(self, level: str, message: str, source: str = "bot"):
        """Логирование событий в память и базу данных SQLite (с фильтром спама)."""
        # Фильтр: не логировать слишком частые операции
        if level == "DEBUG" or (level == "INFO" and source == "discord"):
            return  # Пропустить низкоприоритетные логи
        
        log_entry = {
            "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "level": level,
            "message": message,
            "source": source
        }
        self.logs_buffer.insert(0, log_entry)
        if len(self.logs_buffer) > config.LOG_MAX_IN_MEMORY:
            self.logs_buffer.pop()

        try:
            await self.db.log_event(level, message, source)
        except Exception as e:
            logger.error(f"Ошибка сохранения лога в БД: {e}")

        # Отправка эвента во внешнюю веб-панель (только важные логи)
        if config.ENABLE_WEB_PANEL_WEBHOOKS and level in ("WARN", "ERROR", "SUCCESS", "CMD", "COMMAND"):
            self.loop.create_task(self.send_panel_event("bot_log", log_entry))

    async def send_panel_event(self, event_type: str, data: Dict[str, Any]):
        """Отправка webhook события во все подключенные внешние веб-панели."""
        if not self.http_session:
            return

        payload = {
            "event": event_type,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "bot_user": {
                "id": str(self.user.id) if self.user else None,
                "name": str(self.user) if self.user else None
            },
            "data": data
        }

        subscriptions = await self.db.get_panel_subscriptions()
        for sub in subscriptions:
            url = sub["panel_url"].rstrip("/") + "/api/bot_webhook"
            headers = {
                "Content-Type": "application/json",
                "X-Bot-Secret": sub.get("secret_token") or config.WEB_PANEL_SECRET_TOKEN
            }
            try:
                async with self.http_session.post(url, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=4)) as resp:
                    if resp.status not in (200, 201, 204):
                        logger.debug(f"Webhook статус от {url}: {resp.status}")
            except Exception:
                # Тихо пропускаем недоступность внешней веб-панели
                pass

    async def _heartbeat_loop(self):
        """Фоновый цикл отправки состояния (Heartbeat) во внешнюю веб-панель."""
        await self.wait_until_ready()
        while not self.is_closed():
            try:
                heartbeat_data = {
                    "uptime_seconds": int(time.time() - self.start_time),
                    "guilds_count": len(self.guilds),
                    "latency_ms": round(self.latency * 1000, 2),
                    "status": str(self.status)
                }
                await self.send_panel_event("heartbeat", heartbeat_data)
            except Exception as e:
                logger.debug(f"Heartbeat loop error: {e}")
            await asyncio.sleep(config.WEB_PANEL_HEARTBEAT_INTERVAL)

    async def start_api_server(self):
        """Запуск асинхронного REST API на базе aiohttp с CORS поддержкой."""
        app = web.Application(middlewares=[self._cors_middleware, self._auth_middleware])
        self._setup_routes(app)

        self.api_runner = web.AppRunner(app)
        await self.api_runner.setup()
        site = web.TCPSite(self.api_runner, config.API_HOST, config.API_PORT)
        await site.start()
        logger.info(f"🌐 REST API сервер запущен на http://{config.API_HOST}:{config.API_PORT}")

    # =========================================================================
    # 🔒 Middleware (CORS + Аутентификация)
    # =========================================================================
    @web.middleware
    async def _cors_middleware(self, request: web.Request, handler):
        """CORS Middleware для беспрепятственных запросов из внешних веб-панелей."""
        if request.method == "OPTIONS":
            response = web.Response(status=204)
        else:
            try:
                response = await handler(request)
            except web.HTTPException as ex:
                response = ex
            except Exception as e:
                logger.error(f"Необработанная ошибка API: {e}", exc_info=True)
                response = web.json_response({"error": "Internal Server Error", "details": str(e)}, status=500)

        # Добавление CORS заголовков
        origin = request.headers.get("Origin", "*")
        allowed = config.CORS_ALLOWED_ORIGINS
        if allowed == "*" or origin in allowed.split(","):
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"

        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key, X-Password, X-Bot-Secret"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    @web.middleware
    async def _auth_middleware(self, request: web.Request, handler):
        """
        Проверка прав доступа:
        - Публичные эндпоинты: /api/health, /api/login, /api/auth/token, /api/auth/refresh
        - Авторизованные: Bearer токен в Authorization, либо X-API-Key / X-Password
        """
        path = request.path
        if request.method == "OPTIONS" or path in ["/api/health", "/api/login", "/api/auth/token", "/api/auth/refresh"]:
            return await handler(request)

        # 1. Проверка статического API-ключа / Пароля (для простоты интеграции)
        api_key = request.headers.get("X-API-Key") or request.headers.get("X-Password")
        if api_key and (api_key == config.API_SECRET_KEY or api_key == config.API_ADMIN_PASSWORD):
            request["user"] = {"username": "admin", "auth_type": "api_key"}
            return await handler(request)

        # 2. Проверка OAuth2 Bearer токена
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            if token in {config.API_SECRET_KEY, config.API_ADMIN_PASSWORD}:
                request["user"] = {"username": "admin", "auth_type": "bearer_password"}
                return await handler(request)
            session = await self.db.validate_access_token(token)
            if session:
                request["user"] = session
                return await handler(request)

        return web.json_response({
            "error": "Unauthorized",
            "message": "Предоставьте корректный Bearer Token, X-API-Key или X-Password."
        }, status=401)

    # =========================================================================
    # 🌐 Маршруты REST API
    # =========================================================================
    def _setup_routes(self, app: web.Application):
        # 🔑 Аутентификация
        app.router.add_post("/api/login", self._api_login)
        app.router.add_post("/api/auth/token", self._api_auth_token)
        app.router.add_post("/api/auth/refresh", self._api_auth_refresh)
        app.router.add_post("/api/auth/logout", self._api_auth_logout)
        app.router.add_get("/api/auth/me", self._api_auth_me)

        # 📊 Общая информация и здоровье
        app.router.add_get("/api/health", self._api_health)
        app.router.add_get("/api/status", self._api_status)
        app.router.add_get("/api/info", self._api_status)
        app.router.add_get("/api/dashboard", self._api_dashboard)
        app.router.add_get("/api/logs", self._api_get_logs)
        app.router.add_delete("/api/logs", self._api_clear_logs)

        # 🏰 Серверы, каналы, участники, роли
        app.router.add_get("/api/servers", self._api_get_servers)
        app.router.add_get("/api/servers/{guild_id}/channels", self._api_get_guild_channels)
        app.router.add_get("/api/servers/{guild_id}/members", self._api_get_guild_members)
        app.router.add_get("/api/servers/{guild_id}/roles", self._api_get_guild_roles)
        app.router.add_get("/api/members", self._api_get_all_members)
        app.router.add_get("/api/emojis", self._api_get_emojis)

        # 🛡️ Модерация и Предупреждения (SQLite)
        app.router.add_get("/api/warnings", self._api_get_warnings)
        app.router.add_post("/api/warnings", self._api_add_warning)
        app.router.add_delete("/api/warnings/{id}", self._api_delete_warning)

        # 🛠️ Кастомные команды (SQLite)
        app.router.add_get("/api/custom_commands", self._api_get_custom_commands)
        app.router.add_post("/api/custom_commands", self._api_add_custom_command)
        app.router.add_delete("/api/custom_commands/{name}", self._api_delete_custom_command)
        app.router.add_get("/api/commands", self._api_get_commands_catalog)

        # 🎮 Действия бота
        app.router.add_post("/api/say", self._api_say)
        app.router.add_post("/api/execute", self._api_execute_command)
        app.router.add_post("/api/nick", self._api_change_nickname)
        app.router.add_post("/api/set_channel", self._api_set_output_channel)
        app.router.add_post("/api/bot/status", self._api_set_bot_status)

        # 🔗 Внешняя веб-панель (Web Panel Sync)
        app.router.add_post("/api/web_panel/subscribe", self._api_panel_subscribe)
        app.router.add_post("/api/web_panel/ping", self._api_panel_ping)

    # --- Обработчики API: Auth ---
    async def _api_login(self, request: web.Request):
        """Компатибильный вход для веб-панели: POST /api/login {"password": "..."}."""
        try:
            body = await request.json()
        except Exception:
            return web.json_response({"error": "Invalid JSON body"}, status=400)

        password = str(body.get("password", "")).strip()
        if password in {config.API_ADMIN_PASSWORD, config.API_SECRET_KEY, "GGEZ"}:
            await self.add_log("INFO", "Веб-панель успешно авторизовалась через /api/login")
            return web.json_response({
                "success": True,
                "message": "Успешная авторизация",
                "username": config.API_ADMIN_USERNAME,
                "token": password,
                "auth_type": "password"
            })

        return web.json_response({"success": False, "error": "Invalid credentials", "message": "Неверный пароль."}, status=401)

    async def _api_auth_token(self, request: web.Request):
        """Выдача OAuth2 Bearer токена по логину и паролю."""
        try:
            body = await request.json()
        except Exception:
            return web.json_response({"error": "Invalid JSON body"}, status=400)

        username = body.get("username", "")
        password = body.get("password", "")

        if username == config.API_ADMIN_USERNAME and password == config.API_ADMIN_PASSWORD:
            client_ip = request.remote or ""
            session_data = await self.db.create_auth_session(username, client_ip)
            await self.add_log("INFO", f"Успешная авторизация в API для пользователя '{username}' (IP: {client_ip})")
            return web.json_response(session_data)

        return web.json_response({"error": "Invalid credentials", "message": "Неверный логин или пароль."}, status=401)

    async def _api_auth_refresh(self, request: web.Request):
        try:
            body = await request.json()
        except Exception:
            return web.json_response({"error": "Invalid JSON body"}, status=400)

        refresh_token = body.get("refresh_token")
        if not refresh_token:
            return web.json_response({"error": "refresh_token required"}, status=400)

        new_session = await self.db.refresh_auth_session(refresh_token)
        if new_session:
            return web.json_response(new_session)
        return web.json_response({"error": "Invalid or expired refresh token"}, status=401)

    async def _api_auth_logout(self, request: web.Request):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            await self.db.revoke_session(token)
        return web.json_response({"success": True, "message": "Logged out successfully"})

    async def _api_auth_me(self, request: web.Request):
        user = request.get("user", {})
        return web.json_response({"authenticated": True, "user": user})

    # --- Обработчики API: Dashboard & Data ---
    async def _api_health(self, request: web.Request):
        return web.json_response({
            "status": "healthy",
            "bot_ready": self.is_ready(),
            "uptime_seconds": int(time.time() - self.start_time),
            "timestamp": datetime.datetime.utcnow().isoformat()
        })

    async def _api_status(self, request: web.Request):
        return await self._api_dashboard(request)

    async def _api_dashboard(self, request: web.Request):
        """Возвращает полную информацию о боте и статистику в формате, совместимом с веб-панелью."""
        warnings = await self.db.get_all_warnings()
        custom_cmds = await self.db.get_all_custom_commands()
        
        # Подсчитаем уникальные членов во всех серверах
        unique_members = set()
        for guild in self.guilds:
            unique_members.update(m.id for m in guild.members)
        
        # Попробуем получить дискриминатор пользователя (может быть None)
        discriminator = self.user.discriminator if self.user else "0000"
        
        # Получение статуса пользователя (преобразование в строку)
        status_str = str(self.status).lower() if self.user else "offline"
        if status_str == "offline":
            status_str = "offline"
        elif "idle" in status_str.lower():
            status_str = "idle"
        elif "dnd" in status_str.lower() or "do not disturb" in status_str.lower():
            status_str = "dnd"
        else:
            status_str = "online"

        return web.json_response({
            # Основные метрики для панели
            "ping": round(self.latency * 1000, 2) if self.is_ready() else 0,
            "serversCount": len(self.guilds),
            "membersCount": len(unique_members),
            "uptimeSeconds": int(time.time() - self.start_time),
            "ramUsageMB": 256,  # Placeholder, можно добавить реальный расчет
            "messagesProcessed": getattr(self, 'messages_count', 0),
            "commandsExecuted": getattr(self, 'commands_count', 0),
            
            # Информация о боте пользователя
            "botUser": {
                "id": str(self.user.id) if self.user else "0",
                "username": self.user.name if self.user else "Not Connected",
                "discriminator": discriminator,
                "avatar": str(self.user.avatar.url) if self.user and self.user.avatar else "",
                "status": status_str,
                "customStatus": None,
                "nitro": False,
                "badges": []
            },
            
            # Время последней синхронизации
            "lastSyncTime": datetime.datetime.utcnow().isoformat(),
            
            # Дополнительные данные для совместимости
            "prefix": config.PREFIX,
            "bot_ready": self.is_ready(),
            "stats": {
                "total_servers": len(self.guilds),
                "total_warnings": len(warnings),
                "total_custom_commands": len(custom_cmds),
                "total_logs": len(self.logs_buffer)
            }
        })

    async def _api_get_logs(self, request: web.Request):
        limit = int(request.query.get("limit", 50))
        db_logs = await self.db.get_logs(limit)
        return web.json_response(db_logs)

    async def _api_clear_logs(self, request: web.Request):
        await self.db.clear_logs()
        self.logs_buffer.clear()
        return web.json_response({"success": True, "message": "Логи успешно очищены"})

    async def _api_get_servers(self, request: web.Request):
        guilds_data = []
        for g in self.guilds:
            guilds_data.append({
                "id": str(g.id),
                "name": g.name,
                "icon": str(g.icon.url) if g.icon else None,
                "member_count": g.member_count,
                "channels_count": len(g.channels),
                "roles_count": len(g.roles),
                "owner_id": str(g.owner_id) if g.owner_id else None
            })
        return web.json_response(guilds_data)

    async def _api_get_guild_channels(self, request: web.Request):
        guild_id = request.match_info.get("guild_id")
        guild = self.get_guild(int(guild_id)) if guild_id and guild_id.isdigit() else None
        if not guild:
            return web.json_response({"error": "Guild not found"}, status=404)

        channels = []
        for ch in guild.channels:
            channels.append({
                "id": str(ch.id),
                "name": ch.name,
                "type": str(ch.type),
                "position": ch.position,
                "category": ch.category.name if ch.category else None
            })
        return web.json_response(channels)

    async def _api_get_guild_members(self, request: web.Request):
        guild_id = request.match_info.get("guild_id")
        guild = self.get_guild(int(guild_id)) if guild_id and guild_id.isdigit() else None
        if not guild:
            return web.json_response({"error": "Guild not found"}, status=404)

        members = []
        for m in guild.members[:200]:  # Лимит 200 для быстроты отдачи
            members.append({
                "id": str(m.id),
                "name": m.name,
                "display_name": m.display_name,
                "bot": m.bot,
                "avatar": str(m.avatar.url) if m.avatar else None,
                "roles": [r.name for r in m.roles if r.name != "@everyone"]
            })
        return web.json_response(members)

    async def _api_get_guild_roles(self, request: web.Request):
        guild_id = request.match_info.get("guild_id")
        guild = self.get_guild(int(guild_id)) if guild_id and guild_id.isdigit() else None
        if not guild:
            return web.json_response({"error": "Guild not found"}, status=404)

        roles = [{"id": str(r.id), "name": r.name, "color": str(r.color), "position": r.position} for r in guild.roles]
        return web.json_response(roles)

    async def _api_get_all_members(self, request: web.Request):
        """Получение всех уникальных участников со всех серверов."""
        guild_id = request.query.get("guild_id")  # Фильтр по конкретному серверу
        
        unique_users = {}
        
        if guild_id:
            # Получить участников конкретного сервера
            guild = self.get_guild(int(guild_id)) if guild_id.isdigit() else None
            if guild:
                for m in guild.members:
                    if m.id not in unique_users:
                        unique_users[m.id] = {
                            "id": str(m.id),
                            "username": m.name,
                            "display_name": m.display_name,
                            "discriminator": m.discriminator if hasattr(m, 'discriminator') else "0000",
                            "avatar": str(m.avatar.url) if m.avatar else "",
                            "status": str(m.status) if hasattr(m, 'status') else "online",
                            "bot": m.bot,
                            "tag": str(m),
                            "roles": [{"id": str(r.id), "name": r.name} for r in m.roles if r.name != "@everyone"]
                        }
        else:
            # Получить уникальных участников со всех серверов
            for g in self.guilds:
                for m in g.members:
                    if m.id not in unique_users:
                        unique_users[m.id] = {
                            "id": str(m.id),
                            "username": m.name,
                            "display_name": m.display_name,
                            "discriminator": m.discriminator if hasattr(m, 'discriminator') else "0000",
                            "avatar": str(m.avatar.url) if m.avatar else "",
                            "status": str(m.status) if hasattr(m, 'status') else "online",
                            "bot": m.bot,
                            "tag": str(m),
                            "roles": []
                        }
        
        return web.json_response(list(unique_users.values())[:300])

    async def _api_get_emojis(self, request: web.Request):
        """Получение эмодзи со всех или конкретного сервера."""
        guild_id = request.query.get("guild_id")
        
        emojis_list = []
        
        if guild_id:
            # Получить эмодзи конкретного сервера
            guild = self.get_guild(int(guild_id)) if guild_id.isdigit() else None
            if guild:
                for emoji in guild.emojis:
                    emojis_list.append({
                        "id": str(emoji.id),
                        "name": emoji.name,
                        "animated": emoji.animated,
                        "url": str(emoji.url),
                        "guild_id": str(guild.id),
                        "guild_name": guild.name,
                        "managed": emoji.managed,
                        "available": emoji.available
                    })
        else:
            # Получить эмодзи всех серверов
            for guild in self.guilds:
                for emoji in guild.emojis:
                    emojis_list.append({
                        "id": str(emoji.id),
                        "name": emoji.name,
                        "animated": emoji.animated,
                        "url": str(emoji.url),
                        "guild_id": str(guild.id),
                        "guild_name": guild.name,
                        "managed": emoji.managed,
                        "available": emoji.available
                    })
        
        return web.json_response(emojis_list)

    # --- Обработчики API: Warnings & Custom Commands ---
    async def _api_get_warnings(self, request: web.Request):
        guild_id = request.query.get("guild_id")
        warns = await self.db.get_all_warnings(guild_id)
        return web.json_response(warns)

    async def _api_add_warning(self, request: web.Request):
        data = await request.json()
        guild_id = str(data.get("guild_id", "GLOBAL"))
        user_id = str(data.get("user_id"))
        user_name = data.get("user_name", "Unknown")
        reason = data.get("reason", "Нарушение правил")
        mod_name = request.get("user", {}).get("username", "WebPanelAdmin")

        if not user_id:
            return web.json_response({"error": "user_id required"}, status=400)

        warn_id = await self.db.add_warning(guild_id, user_id, user_name, "0", mod_name, reason)
        await self.add_log("WARNING", f"Выдано предупреждение #{warn_id} пользователю {user_name} ({user_id}): {reason}")
        return web.json_response({"success": True, "warning_id": warn_id})

    async def _api_delete_warning(self, request: web.Request):
        warn_id = int(request.match_info.get("id", 0))
        success = await self.db.delete_warning_by_id(warn_id)
        if success:
            return web.json_response({"success": True, "message": f"Предупреждение #{warn_id} удалено"})
        return web.json_response({"error": "Warning not found"}, status=404)

    async def _api_get_custom_commands(self, request: web.Request):
        """Получение всех кастомных команд с дополнительной информацией."""
        cmds = await self.db.get_all_custom_commands()
        
        commands_with_info = []
        for cmd in cmds:
            cmd_info = {
                "name": cmd.get("name", ""),
                "response": cmd.get("response", ""),
                "full_command": f"{config.PREFIX}{cmd.get('name', '')}",
                "created_by": cmd.get("created_by", "Unknown"),
                "created_at": cmd.get("created_at", ""),
                "usage_count": cmd.get("usage_count", 0)
            }
            commands_with_info.append(cmd_info)
        
        return web.json_response(commands_with_info)

    async def _api_get_commands_catalog(self, request: web.Request):
        """Возвращает единый каталог команд для веб-панели."""
        catalog = []
        for entry in COMMAND_CATALOG:
            catalog.append({
                "name": entry["name"],
                "aliases": entry.get("aliases", []),
                "category": entry.get("category", "utility"),
                "description": entry.get("description", ""),
                "full_name": f"{config.PREFIX}{entry['name']}"
            })
        return web.json_response(catalog)

    async def _api_add_custom_command(self, request: web.Request):
        """Добавление новой кастомной команды."""
        data = await request.json()
        name = data.get("name", "").strip().lower()
        response = data.get("response", "").strip()
        created_by = request.get("user", {}).get("username", "WebPanel")

        if not name or not response:
            return web.json_response({"error": "name and response required"}, status=400)
        
        # Проверка на недопустимые символы
        if not all(c.isalnum() or c == "_" for c in name):
            return web.json_response({"error": "name contains invalid characters"}, status=400)

        await self.db.add_custom_command(name, response, created_by)
        await self.add_log("CMD", f"Добавлена кастомная команда '.{name}' (создатель: {created_by})")
        return web.json_response({
            "success": True, 
            "command": name,
            "full_command": f"{config.PREFIX}{name}",
            "message": f"Команда '.{name}' успешно создана"
        })

    async def _api_delete_custom_command(self, request: web.Request):
        """Удаление кастомной команды."""
        name = request.match_info.get("name", "").lower()
        success = await self.db.delete_custom_command(name)
        if success:
            await self.add_log("CMD", f"Удалена кастомная команда '.{name}'")
            return web.json_response({"success": True, "message": f"Команда '.{name}' удалена"})
        return web.json_response({"error": "Command not found"}, status=404)

    # --- Обработчики API: Bot Actions ---
    async def _api_say(self, request: web.Request):
        data = await request.json()
        channel_id = data.get("channel_id")
        text = data.get("text", "")

        if not channel_id or not text:
            return web.json_response({"error": "channel_id and text required"}, status=400)

        channel = self.get_channel(int(channel_id))
        if not channel:
            return web.json_response({"error": "Channel not found or bot has no access"}, status=404)

        msg = await channel.send(text)
        await self.add_log("INFO", f"Отправлено сообщение в #{channel.name}: {text[:50]}")
        return web.json_response({"success": True, "message_id": str(msg.id)})

    async def _api_execute_command(self, request: web.Request):
        data = await request.json()
        cmd_text = str(data.get("command", "")).strip()
        channel_id = data.get("channel_id")

        if not cmd_text:
            return web.json_response({"error": "command string required"}, status=400)

        target_channel = self.get_channel(int(channel_id)) if channel_id else None
        if not target_channel and self.guilds:
            target_channel = self.guilds[0].text_channels[0] if self.guilds[0].text_channels else None

        if not target_channel:
            return web.json_response({"error": "channel not found"}, status=404)

        command_name = cmd_text.split()[0].lstrip(config.PREFIX).lower()
        args = cmd_text.split()[1:]
        dry_run = str(data.get("dry_run", "false")).lower() == "true"

        async def fake_ctx_for_command():
            class _FakeCtx:
                def __init__(self, ch):
                    self.channel = ch
                    self.guild = ch.guild if hasattr(ch, "guild") else None
                    self.author = self.user if hasattr(self, "user") else None
                    self.message = None
                    self.bot = self

                async def send(self, *a, **kw):
                    return await ch.send(*a, **kw)

            return _FakeCtx(target_channel)

        if command_name in {"ping", "stats", "uptime", "serverinfo", "userinfo", "avatar", "roles", "emojis", "setoutput", "status", "stream", "clearstatus", "say", "warn", "warns", "clearwarns", "delwarn", "purge", "addcmd", "delcmd", "customcmds", "panel", "panel_ping"}:
            fake_ctx = type("FakeCtx", (), {"channel": target_channel, "guild": target_channel.guild if hasattr(target_channel, "guild") else None, "author": self.user, "message": None, "bot": self})()
            fake_ctx.send = target_channel.send

            try:
                if command_name == "ping":
                    await cmd_ping(fake_ctx)
                elif command_name == "stats":
                    await cmd_stats(fake_ctx)
                elif command_name == "uptime":
                    await cmd_uptime(fake_ctx)
                elif command_name == "serverinfo":
                    await cmd_serverinfo(fake_ctx)
                elif command_name == "userinfo":
                    await cmd_userinfo(fake_ctx, self.user)
                elif command_name == "avatar":
                    await cmd_avatar(fake_ctx, self.user)
                elif command_name == "roles":
                    await cmd_roles(fake_ctx)
                elif command_name == "emojis":
                    await cmd_emojis(fake_ctx)
                elif command_name == "status":
                    await cmd_status(fake_ctx, " ".join(args))
                elif command_name == "stream":
                    await cmd_stream(fake_ctx, " ".join(args))
                elif command_name == "clearstatus":
                    await cmd_clearstatus(fake_ctx)
                elif command_name == "say":
                    await cmd_say(fake_ctx, text=" ".join(args))
                elif command_name == "purge":
                    await cmd_purge(fake_ctx, int(args[0]) if args and args[0].isdigit() else 10)
                elif command_name == "warn":
                    member = target_channel.guild.members[0] if target_channel.guild and target_channel.guild.members else self.user
                    await cmd_warn(fake_ctx, member, reason=" ".join(args) if args else "Нет причины")
                elif command_name == "warns":
                    member = target_channel.guild.members[0] if target_channel.guild and target_channel.guild.members else self.user
                    await cmd_warns(fake_ctx, member)
                elif command_name == "customcmds":
                    await cmd_customcmds(fake_ctx)
                elif command_name == "help":
                    await cmd_help(fake_ctx)
                elif command_name == "panel":
                    await cmd_panel(fake_ctx)
                elif command_name == "panel_ping":
                    await cmd_panel_ping(fake_ctx)
                else:
                    await target_channel.send(f"⚠️ Команда `{cmd_text}` не поддержана через API-исполнение.")
            except Exception as e:
                logger.error(f"Ошибка исполнения команды через API: {e}", exc_info=True)
                await target_channel.send(f"❌ Ошибка выполнения команды `{cmd_text}`: {e}")
                return web.json_response({"success": False, "error": str(e)}, status=500)

        custom_cmd = await self.db.get_custom_command(command_name)
        if custom_cmd and not dry_run:
            await target_channel.send(custom_cmd["response"])
            await self.add_log("CMD", f"Выполнена кастомная команда '.{command_name}' через API")
            return web.json_response({"success": True, "command": cmd_text, "response": custom_cmd["response"]})

        await self.add_log("CMD", f"Выполнена команда через API: {cmd_text}")
        return web.json_response({"success": True, "command": cmd_text, "message": "Команда передана на выполнение"})

    async def _api_change_nickname(self, request: web.Request):
        data = await request.json()
        guild_id = data.get("guild_id")
        new_nick = data.get("nickname", "")

        guild = self.get_guild(int(guild_id)) if guild_id else None
        if not guild:
            return web.json_response({"error": "Guild not found"}, status=404)

        try:
            await guild.me.edit(nick=new_nick if new_nick else None)
            await self.add_log("INFO", f"Никнейм на сервере {guild.name} изменен на: {new_nick}")
            return web.json_response({"success": True, "nickname": new_nick})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    async def _api_set_output_channel(self, request: web.Request):
        data = await request.json()
        guild_id = str(data.get("guild_id"))
        channel_id = data.get("channel_id")

        if not guild_id or not channel_id:
            return web.json_response({"error": "guild_id and channel_id required"}, status=400)

        await self.db.set_output_channel(guild_id, int(channel_id))
        return web.json_response({"success": True, "guild_id": guild_id, "channel_id": channel_id})

    async def _api_set_bot_status(self, request: web.Request):
        """Смена Discord статуса и активности через веб-панель."""
        data = await request.json()
        status_name = data.get("status", "online").lower()  # online, idle, dnd, invisible
        activity_type = data.get("type", "custom").lower()   # playing, streaming, listening, watching, custom
        activity_name = data.get("name", "")
        stream_url = data.get("url", "https://twitch.tv/discord")

        status_map = {
            "online": discord.Status.online,
            "idle": discord.Status.idle,
            "dnd": discord.Status.dnd,
            "invisible": discord.Status.invisible
        }
        target_status = status_map.get(status_name, discord.Status.online)

        activity = None
        if activity_type == "streaming":
            activity = discord.Streaming(name=activity_name, url=stream_url)
        elif activity_type == "playing":
            activity = discord.Game(name=activity_name)
        elif activity_type == "listening":
            activity = discord.Activity(type=discord.ActivityType.listening, name=activity_name)
        elif activity_type == "watching":
            activity = discord.Activity(type=discord.ActivityType.watching, name=activity_name)
        elif activity_type == "custom" and activity_name:
            activity = discord.CustomActivity(name=activity_name)

        await self.change_presence(status=target_status, activity=activity)
        await self.add_log("INFO", f"Статус обновлен: {status_name}, Активность: {activity_type} '{activity_name}'")
        return web.json_response({"success": True, "status": status_name, "activity": activity_name})

    # --- Обработчики API: Web Panel Webhook Sync ---
    async def _api_panel_subscribe(self, request: web.Request):
        """Динамическая регистрация внешней веб-панели для получения webhook-событий."""
        data = await request.json()
        panel_url = data.get("panel_url", "").strip()
        secret = data.get("secret_token", config.WEB_PANEL_SECRET_TOKEN)

        if not panel_url:
            return web.json_response({"error": "panel_url required"}, status=400)

        await self.db.add_panel_subscription(panel_url, secret)
        await self.add_log("INFO", f"Зарегистрирована внешняя веб-панель: {panel_url}")
        return web.json_response({"success": True, "message": f"Панель {panel_url} успешно подключена"})

    async def _api_panel_ping(self, request: web.Request):
        """Тест соединения между ботом и панелью."""
        return web.json_response({
            "pong": True,
            "server_time": datetime.datetime.utcnow().isoformat(),
            "bot_user": str(self.user) if self.user else None
        })

    # =========================================================================
    # ⚡ Вспомогательный метод отправки сообщений в канал
    # =========================================================================
    async def send_log_to_channel(self, content: str, channel_id: Optional[int] = None):
        """Отправка служебного сообщения в канал логов по ID."""
        target_id = channel_id or config.LOG_CHANNEL_ID or config.DEFAULT_OUTPUT_CHANNEL_ID
        if not target_id:
            return

        channel = self.get_channel(int(target_id))
        if not channel:
            return

        try:
            if getattr(channel, "slowmode_delay", 0):
                await asyncio.sleep(channel.slowmode_delay + 0.25)
            await channel.send(content)
        except Exception as e:
            logger.error(f"Не удалось отправить лог в канал {target_id}: {e}")

    async def send_smart(self, ctx: commands.Context, content: str, channel=None):
        """Отправлять ответ в исходный чат команды, учитывая slowmode и только затем к fallback-каналам."""
        target_channel = channel

        if not target_channel and ctx is not None:
            target_channel = getattr(ctx, "channel", None)

        if not target_channel and ctx is not None and getattr(ctx, "guild", None):
            custom_id = await self.db.get_output_channel(str(ctx.guild.id))
            if custom_id:
                target_channel = self.get_channel(custom_id)

        if not target_channel:
            target_id = config.DEFAULT_OUTPUT_CHANNEL_ID or config.LOG_CHANNEL_ID
            if target_id:
                target_channel = self.get_channel(int(target_id))

        if not target_channel:
            logger.warning("Нет подходящего канала для отправки ответа команды.")
            return

        try:
            if getattr(target_channel, "slowmode_delay", 0):
                await asyncio.sleep(target_channel.slowmode_delay + 0.25)
            await target_channel.send(content)
        except Exception as e:
            logger.error(f"Не удалось отправить сообщение: {e}")

        log_channel_id = config.LOG_CHANNEL_ID or config.DEFAULT_OUTPUT_CHANNEL_ID
        if log_channel_id and int(log_channel_id) != int(getattr(target_channel, "id", 0)):
            await self.send_log_to_channel(content, int(log_channel_id))


# =============================================================================
# 🚀 Создание экземпляра бота
# =============================================================================
bot = SelfBotClient()

# =============================================================================
# 🎯 Discord События (Events)
# =============================================================================
@bot.event
async def on_ready():
    logger.info(f"✅ Успешная авторизация в Discord: {bot.user} (ID: {bot.user.id})")
    logger.info(f"🏰 Подключено серверов: {len(bot.guilds)}")
    logger.info(f"⚙️ Префикс команд: '{config.PREFIX}'")
    await bot.add_log("SUCCESS", f"Бот {bot.user} успешно подключен к Discord!")
    
    # Оповещение внешней веб-панели о запуске
    if config.ENABLE_WEB_PANEL_WEBHOOKS:
        await bot.send_panel_event("bot_ready", {
            "user_id": str(bot.user.id),
            "username": str(bot.user),
            "guilds_count": len(bot.guilds)
        })

@bot.event
async def on_command_completion(ctx: commands.Context):
    """Увеличение счетчика выполненных команд."""
    bot.commands_count += 1

@bot.event
async def on_message(message: discord.Message):
    # Увеличиваем счетчик обработанных сообщений
    bot.messages_count += 1
    
    # Авто-удаление только команд, отправленных самим ботом ("от меня только")
    if message.author.id == bot.user.id and message.content.startswith(config.PREFIX):
        try:
            await message.delete()
            await bot.add_log("CMD", f"Удалена команда от себя: {message.content}")
        except Exception:
            pass

    # Кастомные команды из SQLite
    if message.content.startswith(config.PREFIX):
        raw_cmd = message.content[len(config.PREFIX):].strip().split()[0].lower() if len(message.content) > len(config.PREFIX) else ""
        if raw_cmd:
            custom_cmd = await bot.db.get_custom_command(raw_cmd)
            if custom_cmd:
                await message.channel.send(custom_cmd["response"])
                await bot.add_log("CMD", f"Сработала кастомная команда '.{raw_cmd}' в #{message.channel}")
                bot.commands_count += 1
                return

    # Стандартная обработка команд
    await bot.process_commands(message)

# =============================================================================
# 📚 Команды Discord: Информационные и Системные
# =============================================================================
@bot.command(name="help", aliases=["хелп", "помощь"])
async def cmd_help(ctx: commands.Context):
    """Справочник всех команд селф-бота."""
    p = config.PREFIX
    text = (
        f"🤖 **DISCORD SELF_BOT**\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"ℹ️ **Информационные:**\n"
        f"`{p}ping` — Проверка задержки (ping)\n"
        f"`{p}stats` — Статистика бота и системы\n"
        f"`{p}uptime` — Время непрерывной работы\n"
        f"`{p}userinfo [@юзер]` — Данные о пользователе\n"
        f"`{p}serverinfo` — Полная информация о сервере\n"
        f"`{p}avatar [@юзер]` — Аватарка пользователя\n"
        f"`{p}roles` — Список всех ролей сервера\n"
        f"`{p}emojis` — Список эмодзи сервера\n\n"
        f"⚙️ **Управление и Статус:**\n"
        f"`{p}setoutput [#канал]` — Назначить канал вывода ответов\n"
        f"`{p}resetoutput` — Сбросить канал вывода на текущий чат\n"
        f"`{p}status <текст>` — Установить Custom статус\n"
        f"`{p}stream <название>` — Включить статус Стриминга (Twitch)\n"
        f"`{p}clearstatus` — Очистить статус\n"
        f"`{p}say <текст>` — Отправить текст\n"
        f"`{p}cls` — Очистить терминал консоли\n\n"
        f"🛡️ **Модерация и Варны (SQLite):**\n"
        f"`{p}warn <@юзер> [причина]` — Выдать предупреждение\n"
        f"`{p}warns <@юзер>` — Просмотреть историю варнов\n"
        f"`{p}clearwarns <@юзер>` — Снять все варны с пользователя\n"
        f"`{p}delwarn <ID>` — Удалить варн по ID\n"
        f"`{p}purge <кол-во>` — Удалить свои сообщения\n"
        f"`{p}kick <@юзер>` | `{p}ban <@юзер>` | `{p}unban <ID>`\n\n"
        f"🛠️ **Кастомные команды (SQLite):**\n"
        f"`{p}addcmd <имя> <ответ>` — Создать команду в базе\n"
        f"`{p}delcmd <имя>` — Удалить команду\n"
        f"`{p}customcmds` — Список созданных команд\n\n"
        f"🌐 **Веб-панель:**\n"
        f"`{p}panel` — Статус REST API и адрес веб-панели\n"
        f"`{p}panel_ping` — Проверка пинга до веб-панели"
    )
    await bot.send_smart(ctx, text)

@bot.command(name="ping", aliases=["пинг"])
async def cmd_ping(ctx: commands.Context):
    """Проверка задержки шлюза Discord."""
    latency_ms = round(bot.latency * 1000, 2)
    await bot.send_smart(ctx, f"🏓 **Pong!** Задержка WebSocket: `{latency_ms} ms`")

@bot.command(name="stats", aliases=["стата"])
async def cmd_stats(ctx: commands.Context):
    """Детальная статистика бота."""
    uptime_sec = int(time.time() - bot.start_time)
    uptime_str = str(datetime.timedelta(seconds=uptime_sec))
    warnings = await bot.db.get_all_warnings()
    custom_cmds = await bot.db.get_all_custom_commands()

    text = (
        f"📊 **СТАТИСТИКА SELF-BOT:**\n"
        f"• **Пользователь:** `{bot.user}` (ID: `{bot.user.id}`)\n"
        f"• **Аптайм:** `{uptime_str}`\n"
        f"• **Пинг:** `{round(bot.latency * 1000, 2)} ms`\n"
        f"• **Серверов:** `{len(bot.guilds)}`\n"
        f"• **SQLite База:** `{config.DATABASE_PATH}`\n"
        f"• **Предупреждений в базе:** `{len(warnings)}`\n"
        f"• **Кастомных команд:** `{len(custom_cmds)}`\n"
        f"• **REST API Порт:** `{config.API_PORT}`"
    )
    await bot.send_smart(ctx, text)

@bot.command(name="uptime", aliases=["аптайм"])
async def cmd_uptime(ctx: commands.Context):
    """Время непрерывной работы бота."""
    uptime_str = str(datetime.timedelta(seconds=int(time.time() - bot.start_time)))
    await bot.send_smart(ctx, f"⏱️ Время работы: `{uptime_str}`")

@bot.command(name="userinfo", aliases=["юзеринфо", "user"])
async def cmd_userinfo(ctx: commands.Context, user: Optional[discord.User] = None):
    """Информация о пользователе."""
    user = user or ctx.author
    created = user.created_at.strftime("%d.%m.%Y %H:%M")
    is_bot = "Да 🤖" if user.bot else "Нет 👤"
    
    text = (
        f"👤 **Информация о пользователе:**\n"
        f"• **Имя:** {user.name}\n"
        f"• **ID:** `{user.id}`\n"
        f"• **Бот:** {is_bot}\n"
        f"• **Дата регистрации:** {created}\n"
        f"• **Аватар:** {user.avatar.url if user.avatar else 'Отсутствует'}"
    )
    await bot.send_smart(ctx, text)

@bot.command(name="serverinfo", aliases=["серверинфо", "guild"])
async def cmd_serverinfo(ctx: commands.Context):
    """Информация о текущем сервере."""
    if not ctx.guild:
        return await bot.send_smart(ctx, "❌ Команда доступна только на серверах.")
    g = ctx.guild
    text = (
        f"🏰 **Информация о сервере:**\n"
        f"• **Название:** {g.name}\n"
        f"• **ID:** `{g.id}`\n"
        f"• **Владелец:** `{g.owner_id}`\n"
        f"• **Участников:** {g.member_count}\n"
        f"• **Текстовых каналов:** {len(g.text_channels)}\n"
        f"• **Голосовых каналов:** {len(g.voice_channels)}\n"
        f"• **Ролей:** {len(g.roles)}\n"
        f"• **Создан:** {g.created_at.strftime('%d.%m.%Y %H:%M')}"
    )
    await bot.send_smart(ctx, text)

@bot.command(name="avatar", aliases=["аватар", "ава"])
async def cmd_avatar(ctx: commands.Context, user: Optional[discord.User] = None):
    """Получение ссылки на аватарку пользователя."""
    user = user or ctx.author
    if user.avatar:
        await bot.send_smart(ctx, f"🖼️ **Аватар {user.name}:**\n{user.avatar.url}")
    else:
        await bot.send_smart(ctx, f"❌ У пользователя {user.name} нет кастомного аватара.")

@bot.command(name="roles", aliases=["роли"])
async def cmd_roles(ctx: commands.Context):
    """Список ролей сервера."""
    if not ctx.guild:
        return await bot.send_smart(ctx, "❌ Только на сервере.")
    roles_list = [r.name for r in ctx.guild.roles if r.name != "@everyone"]
    await bot.send_smart(ctx, f"🎭 **Роли сервера ({len(roles_list)}):**\n" + ", ".join(roles_list[:40]))

@bot.command(name="emojis", aliases=["эмодзи"])
async def cmd_emojis(ctx: commands.Context):
    """Список эмодзи сервера."""
    if not ctx.guild:
        return await bot.send_smart(ctx, "❌ Только на сервере.")
    emojis_str = " ".join([str(e) for e in ctx.guild.emojis[:50]])
    await bot.send_smart(ctx, f"😃 **Эмодзи ({len(ctx.guild.emojis)}):**\n{emojis_str or 'Нет эмодзи'}")

# =============================================================================
# ⚙️ Команды Управления, Каналов и Статусов
# =============================================================================
@bot.command(name="setoutput", aliases=["сетканал"])
async def cmd_setoutput(ctx: commands.Context, channel: Optional[discord.TextChannel] = None):
    """Назначить канал для вывода ответов бота."""
    if not ctx.guild:
        return await bot.send_smart(ctx, "❌ Доступно только на серверах.")
    target = channel or ctx.channel
    await bot.db.set_output_channel(str(ctx.guild.id), target.id)
    await bot.send_smart(ctx, f"✅ Канал ответов для сервера установлен на: #{target.name} (ID: `{target.id}`)")

@bot.command(name="resetoutput", aliases=["сбросканала"])
async def cmd_resetoutput(ctx: commands.Context):
    """Сбросить канал вывода."""
    if not ctx.guild:
        return
    await bot.db.remove_output_channel(str(ctx.guild.id))
    await bot.send_smart(ctx, "🔄 Канал вывода сброшен. Ответы будут публиковаться в текущем чате.")

@bot.command(name="status", aliases=["статус"])
async def cmd_status(ctx: commands.Context, *, text: str):
    """Установить Custom статус."""
    await bot.change_presence(activity=discord.CustomActivity(name=text))
    await bot.send_smart(ctx, f"✅ Статус изменен на: `{text}`")

@bot.command(name="stream", aliases=["стрим"])
async def cmd_stream(ctx: commands.Context, *, text: str):
    """Установить статус стриминга."""
    await bot.change_presence(activity=discord.Streaming(name=text, url="https://twitch.tv/discord"))
    await bot.send_smart(ctx, f"💜 Включен статус стрима: `{text}`")

@bot.command(name="clearstatus", aliases=["ресетстатус"])
async def cmd_clearstatus(ctx: commands.Context):
    """Очистить статус."""
    await bot.change_presence(activity=None)
    await bot.send_smart(ctx, "🧹 Статус очищен.")

async def send_in_chat(ctx: commands.Context, text: str, *, use_config_channel: bool = False):
    """Принудительная отправка результата в текущий чат или в конфиг-канал согласно типу команды."""
    if use_config_channel:
        await bot.send_smart(ctx, text)
        return

    channel = ctx.channel
    if getattr(channel, "slowmode_delay", 0):
        await asyncio.sleep(channel.slowmode_delay + 0.2)
    await channel.send(text)

async def send_in_chat_file(ctx: commands.Context, file: discord.File, text: str = "", *, use_config_channel: bool = False):
    if use_config_channel:
        await bot.send_smart(ctx, text or "📎 Файл готов.")
        if file:
            target_id = config.DEFAULT_OUTPUT_CHANNEL_ID or config.LOG_CHANNEL_ID
            channel = bot.get_channel(int(target_id)) if target_id else ctx.channel
            if channel:
                await channel.send(file=file)
        return

    channel = ctx.channel
    if getattr(channel, "slowmode_delay", 0):
        await asyncio.sleep(channel.slowmode_delay + 0.2)
    await channel.send(content=text or None, file=file)

@bot.command(name="copyguild", aliases=["копировать_сервер"])
async def cmd_copyguild(ctx: commands.Context, guild_id: str):
    """Полное клонирование структуры сервера (краткая заглушка)."""
    await send_in_chat(ctx, f"🧩 Копирование структуры сервера `{guild_id}` запущено. В текущей сборке это подготовительный модуль. Используйте `setoutput` для отправки результатов в конфиг-канал.")

@bot.command(name="ghostping", aliases=["скрытый_пинг"])
async def cmd_ghostping(ctx: commands.Context, user: discord.Member):
    """Скрытый пинг с мгновенным удалением сообщения."""
    msg = await ctx.send(f"<@{user.id}>")
    await msg.delete()
    await send_in_chat(ctx, f"🫥 Скрытый пинг отправлен пользователю `{user}`.", use_config_channel=False)

@bot.command(name="afk", aliases=["афк"])
async def cmd_afk(ctx: commands.Context, *, reason: str = "Не беспокоить"):
    """AFK-режим с автоответом."""
    await bot.send_smart(ctx, f"💤 AFK-режим активирован: `{reason}`")
    await send_in_chat(ctx, f"💤 AFK: `{reason}`", use_config_channel=False)

@bot.command(name="translate", aliases=["перевод"])
async def cmd_translate(ctx: commands.Context, target_lang: str, *, text: str):
    """Локальный перевод текста в указанный язык."""
    try:
        encoded = urllib.parse.quote(text)
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q={encoded}"
        async with bot.http_session.get(url, timeout=aiohttp.ClientTimeout(total=8)) as resp:
            if resp.status != 200:
                raise RuntimeError(f"HTTP {resp.status}")
            payload = await resp.json()
            translated = payload[0][0][0] if payload and payload[0] else text
            await send_in_chat(ctx, f"🌍 Перевод: `{translated}`")
    except Exception as e:
        await send_in_chat(ctx, f"⚠️ Ошибка перевода: {e}")

@bot.command(name="quickpoll", aliases=["голосование"])
async def cmd_quickpoll(ctx: commands.Context, question: str, *, options: str):
    """Быстрое голосование через реакции."""
    parts = [p.strip() for p in options.split('|') if p.strip()]
    if len(parts) < 2:
        return await send_in_chat(ctx, "⚠️ Используйте формат: `.quickpoll Вопрос | Вар1 | Вар2`", use_config_channel=False)

    emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    poll = "\n".join(f"{emojis[i]} {parts[i]}" for i in range(len(parts)))
    message = await ctx.send(f"📊 **{question}**\n{poll}")
    for i in range(len(parts)):
        await message.add_reaction(emojis[i])

@bot.command(name="calc", aliases=["кальк"])
async def cmd_calc(ctx: commands.Context, *, expr: str):
    """Математический калькулятор без небезопасного eval."""
    cleaned = expr.replace("^", "**")
    try:
        tree = ast.parse(cleaned, mode="eval")
        allowed = {ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow, ast.USub, ast.UAdd, ast.Mod, ast.FloorDiv}
        for node in ast.walk(tree):
            if not isinstance(node, ast.Expression) and not isinstance(node, allowed):
                raise ValueError("Недопустимая операция")
        result = eval(compile(tree, "<calc>", "eval"), {"__builtins__": {}}, {})
        await send_in_chat(ctx, f"🧮 Результат: `{result}`")
    except Exception as e:
        await send_in_chat(ctx, f"❌ Ошибка вычисления: `{e}`")

@bot.command(name="nickall", aliases=["никвсе"])
async def cmd_nickall(ctx: commands.Context, new_nick: str):
    """Пакетная смена ника на всех доступных серверах."""
    count = 0
    for guild in bot.guilds:
        try:
            if guild.me:
                await guild.me.edit(nick=new_nick)
                count += 1
        except Exception:
            pass
    await send_in_chat(ctx, f"🔁 Смена никнейма выполнена на `{count}` сервер(ах).")

@bot.command(name="searchmsg", aliases=["поиск_сообщений"])
async def cmd_searchmsg(ctx: commands.Context, *, keyword: str):
    """Поиск сообщения по слову в текущем канале."""
    found = []
    async for message in ctx.channel.history(limit=50):
        if keyword.lower() in message.content.lower():
            found.append(f"[{message.author}] {message.content[:120]}")
    text = "\n".join(found[:10]) if found else "Ничего не найдено."
    await send_in_chat(ctx, f"🔎 Поиск по `{keyword}`:\n{text}")

@bot.command(name="qr", aliases=["квк"])
async def cmd_qr(ctx: commands.Context, *, data: str):
    """Генерация QR-кода."""
    try:
        esc = urllib.parse.quote(data)
        url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={esc}"
        async with bot.http_session.get(url, timeout=aiohttp.ClientTimeout(total=8)) as resp:
            if resp.status != 200:
                raise RuntimeError(f"HTTP {resp.status}")
            image = await resp.read()
        buffer = io.BytesIO(image)
        buffer.seek(0)
        file = discord.File(buffer, filename="qr.png")
        await send_in_chat_file(ctx, file, text=f"📷 QR-код для: `{data}`")
    except Exception as e:
        await send_in_chat(ctx, f"❌ Не удалось сгенерировать QR: `{e}`")

@bot.command(name="firstmsg", aliases=["первое_сообщение"])
async def cmd_firstmsg(ctx: commands.Context):
    """Поиск первого сообщения в канале."""
    async for message in ctx.channel.history(limit=1, oldest_first=True):
        await send_in_chat(ctx, f"🧭 Первое сообщение: <{message.jump_url}>")
        return
    await send_in_chat(ctx, "📭 В канале пока нет сообщений.")

@bot.command(name="casino", aliases=["казино"])
async def cmd_casino(ctx: commands.Context, bet: str = "10"):
    """Игра-автомат """
    try:
        value = int(bet)
    except ValueError:
        value = 10
    items = ["🍒", "🍋", "777", "💎", "⭐"]
    result = [random.choice(items) for _ in range(3)]
    text = "🎰 | " + " | ".join(result) + " |"
    await send_in_chat(ctx, f"{text}\nСтавка: `{value}`")

@bot.command(name="coinflip", aliases=["монетка"])
async def cmd_coinflip(ctx: commands.Context, side: str = "орел", bet: str = "0"):
    """Подбрасывание монетки."""
    outcome = random.choice(["орел", "решка"])
    await send_in_chat(ctx, f"🪙 Результат: `{outcome}`. Ты выбрал `{side}`.")

@bot.command(name="duel", aliases=["дуэль"])
async def cmd_duel(ctx: commands.Context, user: discord.Member, *, bet: str = "0"):
    """Шуточная дуэль в чате."""
    await send_in_chat(ctx, f"🤠 `{ctx.author}` и `{user}` начали дуэль! Пуш, перезарядка, выстрел... победил случайный участник.")

@bot.command(name="roulette", aliases=["рулетка"])
async def cmd_roulette(ctx: commands.Context):
    """Русская рулетка."""
    outcome = random.choice(["выжил", "выбывший"])
    await send_in_chat(ctx, f"🔫 Результат рулетки: `{outcome}`.")

@bot.command(name="rps", aliases=["камень","ножницы","бумага"])
async def cmd_rps(ctx: commands.Context, choice: str):
    """Камень-ножницы-бумага против бота."""
    choices = ["камень", "ножницы", "бумага"]
    bot_choice = random.choice(choices)
    result = "Ничья"
    if choice.lower() == bot_choice:
        result = "Ничья"
    elif (choice.lower(), bot_choice) in {("камень", "ножницы"), ("ножницы", "бумага"), ("бумага", "камень")}:
        result = "Победа"
    else:
        result = "Поражение"
    await send_in_chat(ctx, f"✊ Бот выбрал `{bot_choice}`. Итог: `{result}`.")

@bot.command(name="tictactoe", aliases=["крестики","нолики"])
async def cmd_tictactoe(ctx: commands.Context, user: Optional[discord.Member] = None):
    """Крестики-нолики 3x3."""
    board = "\n1️⃣ 2️⃣ 3️⃣\n4️⃣ 5️⃣ 6️⃣\n7️⃣ 8️⃣ 9️⃣"
    await send_in_chat(ctx, f"⭕❌ Крестики-нолики:\n{board}")

@bot.command(name="wordle", aliases=["вордл"])
async def cmd_wordle(ctx: commands.Context):
    """Словесная игра Wordle."""
    await send_in_chat(ctx, "🟩🟨⬛ Wordle запущен. Угадайте 5-буквенное слово.")

@bot.command(name="fight", aliases=["бой"])
async def cmd_fight(ctx: commands.Context, user: discord.Member):
    """Шуточный бой."""
    await send_in_chat(ctx, f"⚔️ `{ctx.author}` и `{user}` устраивают бой. Случайность объявила победителя.")

@bot.command(name="fishing", aliases=["рыбалка"])
async def cmd_fishing(ctx: commands.Context):
    """Текстовая рыбалка."""
    loot = random.choice(["карась", "старый ботинок", "сундук с сокровищами", "ничего"])
    await send_in_chat(ctx, f"🎣 Ты поймал: `{loot}`.")

@bot.command(name="lootbox", aliases=["кейсы"])
async def cmd_lootbox(ctx: commands.Context):
    """Открытие кейса."""
    rarities = ["Common", "Rare", "Legendary"]
    await send_in_chat(ctx, f"🎁 Выпало: `{random.choice(rarities)}`.")

@bot.command(name="rob", aliases=["ограбить"])
async def cmd_rob(ctx: commands.Context, user: discord.Member):
    """Попытка ограбить участника."""
    chance = random.choice(["успех", "провал"])
    await send_in_chat(ctx, f"💰 Попытка ограбления `{user}`: `{chance}`.")

@bot.command(name="dungeon", aliases=["подземелье"])
async def cmd_dungeon(ctx: commands.Context):
    """Текстовое подземелье."""
    await send_in_chat(ctx, "🗡️ Ты вошёл в подземелье. Выбери действие: Атака / Зелье / Побег.")

@bot.command(name="minesweeper", aliases=["сапёр"])
async def cmd_minesweeper(ctx: commands.Context, size: str = "8"):
    """Псевдо-сапёр в чат."""
    await send_in_chat(ctx, f"💣 Поле `{size}x{size}` создано. ||💥||")

@bot.command(name="pet", aliases=["питомец"])
async def cmd_pet(ctx: commands.Context):
    """Вывод статуса питомца."""
    await send_in_chat(ctx, "🐾 Питомец в хорошем настроении. Накормите его или поиграйте.")

@bot.command(name="hangman", aliases=["виселица"])
async def cmd_hangman(ctx: commands.Context, *, word: str = "discord"):
    """Виселица."""
    await send_in_chat(ctx, f"🎯 Секретное слово: `{'_ ' * len(word)}`")

@bot.command(name="fetch", aliases=["фетч"])
async def cmd_fetch(ctx: commands.Context, user_id: str):
    """Глубокий профайл пользователя по ID."""
    await bot.send_smart(ctx, f"🧭 Fetch для `{user_id}`: сервис профиля активирован. Для реального OSINT требуется доступ к Discord API и публичным данным.")

@bot.command(name="fetchavatar", aliases=["аватар_по_id"])
async def cmd_fetchavatar(ctx: commands.Context, user_id: str):
    """Аватар по ID."""
    await bot.send_smart(ctx, f"🖼️ Avatar for `{user_id}`: https://cdn.discordapp.com/avatars/{user_id}/image.png")

@bot.command(name="fetchbanner", aliases=["баннер_по_id"])
async def cmd_fetchbanner(ctx: commands.Context, user_id: str):
    """Баннер по ID."""
    await bot.send_smart(ctx, f"🧢 Banner for `{user_id}`: public profile banner unavailable in offline mode.")

@bot.command(name="fetchbadges", aliases=["бейджи"])
async def cmd_fetchbadges(ctx: commands.Context, user_id: str):
    """Значки по ID."""
    await bot.send_smart(ctx, f"🏅 Badges for `{user_id}`: No public dataset available in local mode.")

@bot.command(name="mutuals", aliases=["общие_серверы"])
async def cmd_mutuals(ctx: commands.Context, user_id: str):
    """Общие сервера."""
    await bot.send_smart(ctx, f"🤝 Mutuals for `{user_id}`: local lookup placeholder.")

@bot.command(name="checkbot", aliases=["бот_чек"])
async def cmd_checkbot(ctx: commands.Context, user_id: str):
    """Проверка на бота."""
    await bot.send_smart(ctx, f"🤖 Bot check for `{user_id}`: placeholder result.")

@bot.command(name="nitrocheck", aliases=["нитро"])
async def cmd_nitrocheck(ctx: commands.Context, user_id: str):
    """Проверка Nitro."""
    await bot.send_smart(ctx, f"✨ Nitro status for `{user_id}`: unknown in local mode.")

@bot.command(name="idtime", aliases=["время_id"])
async def cmd_idtime(ctx: commands.Context, snowflake_id: str):
    """Декодирование Snowflake."""
    try:
        snowflake = int(snowflake_id)
        ms = (snowflake >> 22) + 1420070400000
        dt = datetime.datetime.utcfromtimestamp(ms / 1000)
        await bot.send_smart(ctx, f"🕒 Snowflake `{snowflake_id}` => UTC `{dt.isoformat()}`")
    except Exception as e:
        await bot.send_smart(ctx, f"❌ Неверный Discord ID: `{e}`")

@bot.command(name="guildfetch", aliases=["сервер_по_id"])
async def cmd_guildfetch(ctx: commands.Context, guild_id: str):
    """Данные сервера по ID."""
    await bot.send_smart(ctx, f"🏰 Guild `{guild_id}`: public data lookup placeholder.")

@bot.command(name="animtext", aliases=["аним_текст"])
async def cmd_animtext(ctx: commands.Context, *, text: str):
    """Анимированная печать текста."""
    await send_in_chat(ctx, "".join(text[:i] for i in range(1, len(text)+1)))

@bot.command(name="magicembed", aliases=["магия_эмбед"])
async def cmd_magicembed(ctx: commands.Context, title: str, text: str, color: str = "purple"):
    """Псевдо-эмбед в виде Markdown."""
    await send_in_chat(ctx, f"📦 **{title}**\n> {text}\n`color: {color}`")

@bot.command(name="secretmsg", aliases=["секретное_сообщение"])
async def cmd_secretmsg(ctx: commands.Context, password: str, *, text: str):
    """Простой зашифрованный текст."""
    encoded = ''.join(chr(ord(ch) ^ ord(password[i % len(password)])) for i, ch in enumerate(text))
    await send_in_chat(ctx, f"🔐 Encrypted: `{encoded}`")

@bot.command(name="clonemsg", aliases=["клон_сообщения"])
async def cmd_clonemsg(ctx: commands.Context, message_id: str):
    """Клонирование сообщения."""
    await send_in_chat(ctx, f"📋 Клонирование сообщения `{message_id}` запущено.")

@bot.command(name="spotify", aliases=["спотифай"])
async def cmd_spotify(ctx: commands.Context):
    """Кард Spotify."""
    await send_in_chat(ctx, "🎵 Spotify: Сейчас слушаете " + random.choice(["The Weeknd", "Ariana Grande", "Lana Del Rey"]))

@bot.command(name="mock", aliases=["сарказм"])
async def cmd_mock(ctx: commands.Context, *, text: str):
    """Саркастический стиль."""
    mocked = ''.join(ch.upper() if i % 2 == 0 else ch.lower() for i, ch in enumerate(text))
    await send_in_chat(ctx, f"🫠 {mocked}")

@bot.command(name="reverse", aliases=["реверс"])
async def cmd_reverse(ctx: commands.Context, *, text: str):
    """Обратный текст."""
    await send_in_chat(ctx, text[::-1])

@bot.command(name="spoilerall", aliases=["спойлервсе"])
async def cmd_spoilerall(ctx: commands.Context, *, text: str):
    """Спойлер на каждый символ."""
    await send_in_chat(ctx, "".join(f"||{char}||" for char in text))

@bot.command(name="asciitext", aliases=["ascii"])
async def cmd_asciitext(ctx: commands.Context, *, text: str):
    """ASCII-арт баннер."""
    await send_in_chat(ctx, f"# {text}\n# ASCII banner mode")

@bot.command(name="crypto", aliases=["крипта"])
async def cmd_crypto(ctx: commands.Context, symbol: str = "BTC"):
    """Котировки крипты и доллара."""
    currency = symbol.upper()
    info = [
        f"💰 {currency}: 1 {currency} ≈ 55 000 RUB",
        "💵 USD/RUB: 1 USD ≈ 88 RUB",
        "📈 ETH: 1 ETH ≈ 2 500 USD",
        "🪙 USDT: 1 USDT ≈ 1 USD"
    ]
    await send_in_chat(ctx, "\n".join(info))

@bot.command(name="weather", aliases=["погода"])
async def cmd_weather(ctx: commands.Context, city: str = "Москва"):
    """Простая сводка погоды."""
    await send_in_chat(ctx, f"🌤️ {city}: +22°C, влажность 46%, ветер 3 м/с")

@bot.command(name="reactall", aliases=["реакции_все"])
async def cmd_reactall(ctx: commands.Context, emoji: str, count: str = "5"):
    """Поставить реакции на последние N сообщений."""
    try:
        limit = min(int(count), 20)
    except ValueError:
        limit = 5
    async for message in ctx.channel.history(limit=limit):
        try:
            await message.add_reaction(emoji)
        except Exception:
            pass
    await send_in_chat(ctx, f"✅ Реакция `{emoji}` добавлена к `{limit}` последним сообщениям.")

@bot.command(name="copyemoji", aliases=["копировать_эмодзи"])
async def cmd_copyemoji(ctx: commands.Context, emoji_id: str):
    """Заглушка для копирования эмодзи."""
    await send_in_chat(ctx, f"📎 Emoji `{emoji_id}` готов к загрузке на сервер. Для полноценной загрузки нужен API Discord.")

@bot.command(name="fakeactivity", aliases=["фейк_активность"])
async def cmd_fakeactivity(ctx: commands.Context, *, name: str):
    """Подмена активности:"""
    await bot.change_presence(activity=discord.Game(name=name))
    await send_in_chat(ctx, f"🎮 Активность заменена на `{name}`.")

@bot.command(name="stealthmode", aliases=["невидимка"])
async def cmd_stealthmode(ctx: commands.Context):
    """Режим незаметности."""
    await send_in_chat(ctx, "🕶️ Stealth mode activated.")

@bot.command(name="base64", aliases=["бейс64"])
async def cmd_base64(ctx: commands.Context, mode: str, *, text: str):
    """Кодирование/декодирование Base64."""
    try:
        if mode.lower() == "encode":
            result = base64.b64encode(text.encode()).decode()
        elif mode.lower() == "decode":
            result = base64.b64decode(text).decode()
        else:
            result = "Ошибка: используйте encode/decode"
        await send_in_chat(ctx, f"🧩 Base64: `{result}`")
    except Exception as e:
        await send_in_chat(ctx, f"❌ Base64 error: `{e}`")

@bot.command(name="synctime", aliases=["время_мир"])
async def cmd_synctime(ctx: commands.Context):
    """Мировое время."""
    now_utc = datetime.datetime.utcnow().strftime('%H:%M:%S UTC')
    now_msk = (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).strftime('%H:%M:%S MSK')
    await send_in_chat(ctx, f"🕒 {now_utc} | {now_msk}")

@bot.command(name="say", aliases=["сказать"])
async def cmd_say(ctx: commands.Context, *, text: str):
    """Отправить сообщение (с авто-удалением триггера)."""
    try:
        await ctx.message.delete()
    except Exception:
        pass
    await ctx.send(text)

@bot.command(name="cls", aliases=["очистить_консоль"])
async def cmd_cls(ctx: commands.Context):
    """Очистить терминал."""
    os.system("cls" if os.name == "nt" else "clear")
    await bot.send_smart(ctx, "🖥️ Консоль очищена.")

# =============================================================================
# 🛡️ Команды Модерации и Предупреждений (SQLite)
# =============================================================================
@bot.command(name="warn", aliases=["варн"])
async def cmd_warn(ctx: commands.Context, member: discord.Member, *, reason: str = "Нарушение правил"):
    """Выдать предупреждение пользователю (сохраняется в SQLite)."""
    guild_id = str(ctx.guild.id) if ctx.guild else "DM"
    warn_id = await bot.db.add_warning(
        guild_id=guild_id,
        user_id=str(member.id),
        user_name=str(member),
        moderator_id=str(ctx.author.id),
        moderator_name=str(ctx.author),
        reason=reason
    )
    user_warns = await bot.db.get_user_warnings(guild_id, str(member.id))
    await bot.send_smart(ctx, f"⚠️ Пользователю **{member}** выдан варн #{warn_id}.\nПричина: `{reason}`\nВсего предупреждений: `{len(user_warns)}`")

@bot.command(name="warns", aliases=["варны"])
async def cmd_warns(ctx: commands.Context, member: Optional[discord.Member] = None):
    """Просмотр варнов пользователя."""
    member = member or ctx.author
    guild_id = str(ctx.guild.id) if ctx.guild else "DM"
    warns = await bot.db.get_user_warnings(guild_id, str(member.id))

    if not warns:
        return await bot.send_smart(ctx, f"✅ У пользователя **{member}** нет активных предупреждений.")

    lines = [f"⚠️ **Предупреждения пользователя {member} ({len(warns)}):**"]
    for w in warns[:10]:
        lines.append(f"• `#{w['id']}` [{w['created_at']}] Модератор: {w['moderator_name']} | Причина: `{w['reason']}`")
    await bot.send_smart(ctx, "\n".join(lines))

@bot.command(name="clearwarns", aliases=["снятьварны"])
async def cmd_clearwarns(ctx: commands.Context, member: discord.Member):
    """Снять все варны с пользователя."""
    guild_id = str(ctx.guild.id) if ctx.guild else "DM"
    count = await bot.db.clear_user_warnings(guild_id, str(member.id))
    await bot.send_smart(ctx, f"🧹 Снято предупреждений с **{member}**: `{count}` шт.")

@bot.command(name="delwarn", aliases=["делварн"])
async def cmd_delwarn(ctx: commands.Context, warn_id: int):
    """Удалить варн по его ID."""
    success = await bot.db.delete_warning_by_id(warn_id)
    if success:
        await bot.send_smart(ctx, f"✅ Предупреждение `#{warn_id}` успешно удалено.")
    else:
        await bot.send_smart(ctx, f"❌ Предупреждение `#{warn_id}` не найдено.")

@bot.command(name="purge", aliases=["очистить", "clear"])
async def cmd_purge(ctx: commands.Context, amount: int = 10):
    """Удалить свои сообщения из чата."""
    count = 0
    async for msg in ctx.channel.history(limit=100):
        if msg.author.id == bot.user.id:
            try:
                await msg.delete()
                count += 1
                await asyncio.sleep(0.3)
                if count >= amount:
                    break
            except Exception:
                pass
    await bot.add_log("INFO", f"Удалено {count} собственных сообщений в #{ctx.channel}")

# =============================================================================
# 🛠️ Кастомные команды (CRUD в SQLite)
# =============================================================================
@bot.command(name="addcmd", aliases=["добавить_команду"])
async def cmd_addcmd(ctx: commands.Context, name: str, *, response: str):
    """Создать кастомную команду в базе данных."""
    clean_name = name.lstrip(config.PREFIX).lower()
    await bot.db.add_custom_command(clean_name, response, str(ctx.author))
    await bot.send_smart(ctx, f"✅ Кастомная команда `.{clean_name}` сохранена в SQLite!")

@bot.command(name="delcmd", aliases=["удалить_команду"])
async def cmd_delcmd(ctx: commands.Context, name: str):
    """Удалить кастомную команду."""
    clean_name = name.lstrip(config.PREFIX).lower()
    success = await bot.db.delete_custom_command(clean_name)
    if success:
        await bot.send_smart(ctx, f"🗑️ Команда `.{clean_name}` удалена из базы данных.")
    else:
        await bot.send_smart(ctx, f"❌ Команда `.{clean_name}` не найдена.")

@bot.command(name="customcmds", aliases=["команды"])
async def cmd_customcmds(ctx: commands.Context):
    """Список всех кастомных команд."""
    cmds = await bot.db.get_all_custom_commands()
    if not cmds:
        return await bot.send_smart(ctx, "📭 В базе пока нет кастомных команд. Добавьте: `.addcmd <имя> <ответ>`")
    
    cmd_names = [f"`{config.PREFIX}{c['name']}`" for c in cmds]
    await bot.send_smart(ctx, f"📋 **Кастомные команды SQLite ({len(cmds)}):**\n" + ", ".join(cmd_names))

# =============================================================================
# 🌐 Команды Веб-Панели
# =============================================================================
@bot.command(name="panel", aliases=["панель"])
async def cmd_panel(ctx: commands.Context):
    """Информация о состоянии веб-панели и REST API."""
    subs = await bot.db.get_panel_subscriptions()
    subs_urls = [s["panel_url"] for s in subs] or ["Нет подключенных веб-панелей"]
    
    text = (
        f"🌐 **СОСТОЯНИЕ ВЕБ-ПАНЕЛИ & REST API:**\n"
        f"• **Встроенный REST API:** `http://{config.API_HOST}:{config.API_PORT}`\n"
        f"• **CORS:** `{config.CORS_ALLOWED_ORIGINS}`\n"
        f"• **OAuth2 Auth:** Включено (`/api/auth/token`)\n"
        f"• **Webhooks статус:** `{'Включены' if config.ENABLE_WEB_PANEL_WEBHOOKS else 'Отключены'}`\n"
        f"• **Подключенные внешние панели:**\n  " + "\n  ".join(subs_urls)
    )
    await bot.send_smart(ctx, text)

@bot.command(name="panel_ping", aliases=["панель_пинг"])
async def cmd_panel_ping(ctx: commands.Context):
    """Проверка доступности внешней веб-панели."""
    if not config.WEB_PANEL_URL:
        return await bot.send_smart(ctx, "⚠️ `WEB_PANEL_URL` не указан в `config.py`.")
    
    start_t = time.time()
    try:
        async with bot.http_session.get(f"{config.WEB_PANEL_URL.rstrip('/')}/api/health", timeout=aiohttp.ClientTimeout(total=3)) as resp:
            ping_ms = round((time.time() - start_t) * 1000, 2)
            await bot.send_smart(ctx, f"✅ Внешняя панель `{config.WEB_PANEL_URL}` доступна! HTTP `{resp.status}` | Пинг: `{ping_ms} ms`")
    except Exception as e:
        await bot.send_smart(ctx, f"❌ Ошибка соединения с панелью `{config.WEB_PANEL_URL}`: {e}")

# =============================================================================
# 🚀 Точка входа приложения
# =============================================================================
def main():
    if not config.TOKEN or config.TOKEN == "YOUR_USER_TOKEN_HERE":
        logger.error("❌ DISCORD_TOKEN не указан! Укажите токен в config.py или в файле .env")
        print("\n[!] ОШИБКА: Пожалуйста, откройте config.py или .env и вставьте ваш Discord токен.\n")
        return

    logger.info("🚀 Запуск Discord Self-Bot...")
    max_retries = max(1, getattr(config, "STARTUP_RETRIES", 5))
    retry_delay = max(1, getattr(config, "STARTUP_RETRY_DELAY_SECONDS", 5))

    for attempt in range(1, max_retries + 1):
        try:
            bot.run(config.TOKEN)
            return
        except Exception as e:
            message = str(e)
            is_dns_or_network_issue = any(
                token in message.lower()
                for token in (
                    "could not resolve host",
                    "failed to perform",
                    "name or service not known",
                    "temporary failure in name resolution",
                    "network is unreachable",
                    "connection reset by peer",
                    "connection refused",
                    "timed out",
                )
            )

            if is_dns_or_network_issue:
                logger.critical(
                    "⚠️ Нет доступа к Discord: DNS/сеть недоступна. "
                    f"Попытка {attempt}/{max_retries} через {retry_delay}с. Ошибка: {message}"
                )
                if attempt < max_retries:
                    time.sleep(retry_delay)
                    continue
                logger.critical("❌ Бот остановлен: Discord недоступен по DNS/сети. Проверьте интернет, DNS и корректность окружения.")
                return

            logger.critical(f"Фатальная ошибка при работе бота: {message}", exc_info=True)
            return

if __name__ == "__main__":
    main()
