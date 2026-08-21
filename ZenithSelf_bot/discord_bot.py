import asyncio
import datetime
import logging
import os
import sys
from typing import Optional

import discord
from discord.ext import commands

from config import (
    TOKEN,
    PREFIX,
    DEFAULT_OUTPUT_CHANNEL_ID,
    LOG_CHANNEL_ID,
    DATABASE_PATH,
    API_HOST,
    API_PORT,
    DISCORD_DEBUG_MODE,
    LOG_FILE,
    LOG_LEVEL,
    STARTUP_RETRIES,
    STARTUP_RETRY_DELAY_SECONDS
)
from database import DatabaseManager
from api_server import APIServer
from commands_utility import register_utility_commands, record_deleted_message, record_edited_message
from commands_games import register_games_commands
from commands_osint import register_osint_commands
from commands_unique import register_unique_commands
from commands_moderation import register_moderation_commands
from commands_text import register_text_commands
from commands_ai import register_ai_commands  # импорт AI модуля

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG if DISCORD_DEBUG_MODE else getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8")
    ]
)
logger = logging.getLogger("SelfBot.Core")

# Набор команд, которые ВСЕГДА отправляют результат в текущий чат (где была вызвана команда)
CHAT_LOCAL_COMMANDS = {
    # Все игры, казино, дуэли и экономика
    "blackjack", "casino", "dice", "cupgame", "wheel", "coinflip", "highlow", "roulette",
    "lottery", "scratch", "darts", "bowling", "football", "basket", "archery", "fishing",
    "hunt", "golf", "racing", "boxing", "duel", "fight", "dungeon", "bossfight", "pet",
    "lootbox", "rps", "tictactoe", "minesweeper", "heist", "quiz", "typerace", "slotsmatrix",
    "magicball", "russianroulette_duel", "spin", "slotmachine", "gamble", "craft", "guessthenumber",
    "balance", "daily", "work", "crime", "shop", "buy", "inventory", "transfer", "rob", "mine",
    "craftitem", "useitem", "petfeed", "pettrain", "petplay", "level", "slots", "coin",

    # Форматирование текста, шрифты и ASCII
    "ascii", "asciitext", "asciibig", "cursive", "fraktur", "double", "smallcaps", "bubble",
    "squares", "flip", "vapor", "superscript", "subscript", "ansibox", "aesthetic", "neonframe",
    "bigquote", "fancycard", "glitch", "crossout", "underline", "boxedtitle", "divider",
    "morse", "binary", "hex", "leet", "rot13", "cipher", "reverse", "mock", "spoilerall",
    "spaced", "codeblock", "bracket", "startext", "sparkletext", "hearttext", "arrowbox",
    "bulletlist", "numlist", "warnbox", "infobox", "bigemoji",

    # Интерактивные чат-утилиты и опросы
    "quickpoll", "say", "ghostping", "calc", "calcpercent", "remind", "snipe", "editsnipe",
    "afk", "unafk", "magicembed", "secretmsg", "clonemsg", "crypto", "spotify", "echo",
    "reverseecho", "rainbowreact", "reactall", "typing", "quote", "synctime", "streamroll", "steamroll"
}


class ZenithContext(commands.Context):
    """Кастомный контекст команд с интеллектуальной маршрутизацией вывода."""

    async def send(self, content=None, force_current=False, **kwargs):
        bot = self.bot
        cmd_name = self.command.name.lower() if self.command else ""

        # 1. Если команда игровая, текстовая или интерактивная — отправляем строго в текущий чат
        if force_current or (cmd_name in CHAT_LOCAL_COMMANDS):
            await bot.handle_slowmode(self.channel)
            return await super().send(content, **kwargs)

        # 2. Иначе отправляем в базовый канал вывода по ID
        target_id = DEFAULT_OUTPUT_CHANNEL_ID or 1474494686344384634
        target_channel = None

        if target_id and int(target_id) != self.channel.id:
            target_channel = bot.get_channel(int(target_id))
            if not target_channel:
                try:
                    target_channel = await bot.fetch_channel(int(target_id))
                except Exception:
                    target_channel = None

        if target_channel:
            try:
                await bot.handle_slowmode(target_channel)
                return await target_channel.send(content, **kwargs)
            except Exception as e:
                logger.warning(f"Не удалось отправить в базовый канал {target_id}: {e}")

        # Fallback: отправка в текущий канал
        await bot.handle_slowmode(self.channel)
        return await super().send(content, **kwargs)


class ZenithSelfBot(commands.Bot):
    """Главный класс Zenith Self-Bot Enterprise."""

    def __init__(self):
        super().__init__(
            command_prefix=PREFIX,
            self_bot=True,
            help_command=None,
            case_insensitive=True
        )
        self.start_time = datetime.datetime.utcnow()
        self.commands_executed_count = 0
        self.db = DatabaseManager(DATABASE_PATH)
        self.api_server: Optional[APIServer] = None
        self._commands_registered = False
        self._api_server_started = False
        self.ai_handler = None  # будет хранить обработчик AI сообщений

    async def get_context(self, message, *, cls=ZenithContext):
        return await super().get_context(message, cls=cls)

    async def setup_hook(self):
        """Хук инициализации перед запуском шлюза Discord."""
        # 1. Подключение к SQLite базе данных
        await self.db.connect()
        await self.db.log_event("INFO", "Zenith Self-Bot запускается...", "core")

        # 2. Регистрация всех категорий команд (с защитой от повторной регистрации)
        if not self._commands_registered:
            register_utility_commands(self)
            register_games_commands(self)
            register_text_commands(self)
            register_osint_commands(self)
            register_unique_commands(self)
            register_moderation_commands(self)
            # Регистрируем AI команды и сохраняем обработчик
            self.ai_handler = register_ai_commands(self)
            self._commands_registered = True

        # 3. Запуск встроенного REST API сервера для веб-панели
        if not self._api_server_started:
            self.api_server = APIServer(self, self.db)
            await self.api_server.start()
            self._api_server_started = True

    async def on_ready(self):
        logger.info(f"✨ Zenith Self-Bot успешно авторизован: {self.user} (ID: {self.user.id})")
        logger.info(f"🌐 Серверов: {len(self.guilds)} | Префикс команд: '{self.command_prefix}'")
        logger.info(f"📡 REST API доступен по адресу: http://{API_HOST}:{API_PORT}")
        await self.db.log_event("INFO", f"Бот готов к работе: {self.user.name} ({len(self.guilds)} серверов)", "core")

    async def handle_slowmode(self, channel):
        """Ожидание кулдауна медленного режима чата (slowmode delay), если он активен."""
        try:
            delay = getattr(channel, "slowmode_delay", 0)
            if delay and delay > 0:
                logger.debug(f"⏳ Обнаружен slowmode delay ({delay}s) в канале {channel.id}")
                await asyncio.sleep(min(delay, 5))
        except Exception:
            pass

    async def send_routed(self, ctx, content: str, route_type: str = "chat"):
        """
        Интеллектуальная маршрутизация ответов бота по требованиям:
        - route_type='chat': (игры, калькулятор, крипта, текст, snipe) -> отправляется в текущий чат!
        - route_type='osint': (личные данные, OSINT, ID) -> отправляется в канал конфига DEFAULT_OUTPUT_CHANNEL_ID.
        - route_type='moderation'/'utility': -> в назначенный канал сервера или DEFAULT_OUTPUT_CHANNEL_ID.
        """
        if route_type == "chat":
            await self.handle_slowmode(ctx.channel)
            return await ctx.send(content)

        target_channel_id = None
        if route_type == "osint":
            target_channel_id = DEFAULT_OUTPUT_CHANNEL_ID or LOG_CHANNEL_ID
        elif ctx.guild:
            target_channel_id = await self.db.get_output_channel(str(ctx.guild.id))

        if not target_channel_id and DEFAULT_OUTPUT_CHANNEL_ID:
            target_channel_id = DEFAULT_OUTPUT_CHANNEL_ID

        if target_channel_id and target_channel_id != ctx.channel.id:
            target_chan = self.get_channel(int(target_channel_id))
            if target_chan:
                try:
                    await target_chan.send(f"📬 **[Перенаправлено из {ctx.channel.mention}]**\n{content}")
                    notice = await ctx.send("🔒 *Результат команды перенаправлен в защищенный канал вывода.*")
                    await asyncio.sleep(3)
                    try:
                        await notice.delete()
                    except Exception:
                        pass
                    return
                except Exception as ex:
                    logger.warning(f"Не удалось отправить в канал {target_channel_id}: {ex}")

        await self.handle_slowmode(ctx.channel)
        return await ctx.send(content)

    async def on_message_delete(self, message: discord.Message):
        """Перехват удаленных сообщений для .snipe."""
        record_deleted_message(message)

    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        """Перехват отредактированных сообщений для .editsnipe."""
        record_edited_message(before, after)

    # =====================================================================
    #  ГЛАВНЫЙ ОБРАБОТЧИК СООБЩЕНИЙ (on_message)
    #  Находится здесь, в классе ZenithSelfBot
    # =====================================================================
    async def on_message(self, message: discord.Message):
        # Проверка AFK автоответчика (если бот упомянут или написано в ЛС)
        if message.author.id != self.user.id and not message.author.bot:
            afk_data = await self.db.get_afk(str(self.user.id))
            if afk_data:
                is_dm = isinstance(message.channel, discord.DMChannel)
                is_mentioned = self.user in message.mentions
                if is_dm or is_mentioned:
                    await message.channel.send(
                        f"💤 **[Автоответчик AFK]** Владелец сейчас недоступен.\n"
                        f"> **Причина:** *{afk_data['reason']}*\n"
                        f"> **С момента:** `{str(afk_data['afk_since'])[:16]}`"
                    )

        # Обработка команд только от владельца селф-бота
        if message.author.id == self.user.id:
            content = message.content.strip()
            if content.startswith(self.command_prefix):
                try:
                    await message.delete()
                except Exception:
                    pass

                # Проверка кастомных команд из SQLite
                cmd_name = content[len(self.command_prefix):].split(" ")[0].lower()
                custom_cmd = await self.db.get_custom_command(cmd_name)
                if custom_cmd:
                    self.commands_executed_count += 1
                    target_id = DEFAULT_OUTPUT_CHANNEL_ID or 1474494686344384634
                    chan = self.get_channel(int(target_id)) if target_id else message.channel
                    if not chan and target_id:
                        try:
                            chan = await self.fetch_channel(int(target_id))
                        except Exception:
                            chan = message.channel
                    await chan.send(custom_cmd["response"])
                    return  # кастомная команда обработана, выходим

                # обычные команды обрабатываются ниже через process_commands

        # =================================================================
        #  AI ОБРАБОТЧИК (интеграция с DeepSeek)
        #  Вызывается только для сообщений от пользователей (не от бота)
        # =================================================================
        if hasattr(self, 'ai_handler') and self.ai_handler and message.author.id != self.user.id:
            handled = await self.ai_handler(message)
            if handled:
                # сообщение обработано AI, дальше не идём
                return

        # Обработка стандартных команд бота
        await self.process_commands(message)

    async def on_command(self, ctx):
        """Гарантированное удаление сообщения вызова команды перед исполнением."""
        try:
            if ctx.message and ctx.message.author.id == self.user.id:
                await ctx.message.delete()
        except Exception:
            pass

    async def on_command_completion(self, ctx):
        self.commands_executed_count += 1
        await self.db.log_event("INFO", f"Выполнена команда: {ctx.command.name} (канал: {ctx.channel.id})", "command")

    async def on_command_error(self, ctx, error):
        if isinstance(error, commands.CommandNotFound):
            return
        logger.error(f"Ошибка в команде {ctx.command}: {error}")
        await self.db.log_event("ERROR", f"Ошибка команды {ctx.command}: {str(error)}", "command")
        try:
            await ctx.send(f"❌ **Ошибка выполнения:** `{str(error)}`")
        except Exception:
            pass

    async def update_custom_presence(self, status_str: str, activity_text: str = ""):
        """Смена статуса через веб-панель."""
        mapping = {
            "online": discord.Status.online,
            "idle": discord.Status.idle,
            "dnd": discord.Status.dnd,
            "invisible": discord.Status.invisible
        }
        status = mapping.get(status_str.lower(), discord.Status.online)
        activity = discord.Game(name=activity_text) if activity_text else None
        await self.change_presence(status=status, activity=activity)

    async def close(self):
        if self.api_server:
            await self.api_server.stop()
        if self.db:
            await self.db.close()
        await super().close()


async def main():
    """Точка входа для запуска селф-бота с механизмом повторных попыток."""
    if not TOKEN or TOKEN == "ВАШ_ТОКЕН_ЗАМЕНИТЕ":
        logger.error("❌ DISCORD_TOKEN не указан в файле config.py или .env!")
        logger.info("👉 Пожалуйста, укажите валидный User Token в config.py или переменной окружения DISCORD_TOKEN.")
        return

    for attempt in range(1, STARTUP_RETRIES + 1):
        bot = ZenithSelfBot()
        try:
            logger.info(f"🚀 Запуск Zenith Self-Bot (Попытка {attempt}/{STARTUP_RETRIES})...")
            await bot.start(TOKEN)
            break
        except discord.LoginFailure:
            logger.critical("❌ Неверный токен Discord (LoginFailure). Проверьте токен в config.py")
            try:
                await bot.close()
            except Exception:
                pass
            break
        except Exception as e:
            logger.warning(f"⚠️ Ошибка подключения: {e}. Повтор через {STARTUP_RETRY_DELAY_SECONDS} сек...")
            try:
                await bot.close()
            except Exception:
                pass
            if attempt < STARTUP_RETRIES:
                await asyncio.sleep(STARTUP_RETRY_DELAY_SECONDS)
            else:
                logger.error("❌ Превышено максимальное количество попыток подключения к Discord.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛑 Бот остановлен пользователем.")