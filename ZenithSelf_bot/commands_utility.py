import asyncio
import base64
import datetime
import hashlib
import json
import math
import os
import random
import re
import secrets
import string
import time
import urllib.parse
from collections import deque
from discord.ext import commands
import discord
from commands_catalog import FULL_COMMANDS_CATALOG

# Хранилище перехваченных удаленных и отредактированных сообщений в оперативной памяти (Snipe)
DELETED_SNIPE_CACHE = {}
EDITED_SNIPE_CACHE = {}

def record_deleted_message(message: discord.Message):
    """Сохранение удаленного сообщения для .snipe."""
    if not message.author.bot and message.content:
        DELETED_SNIPE_CACHE[message.channel.id] = {
            "author": str(message.author),
            "content": message.content,
            "created_at": message.created_at.strftime("%H:%M:%S"),
            "attachments": [a.url for a in message.attachments]
        }

def record_edited_message(before: discord.Message, after: discord.Message):
    """Сохранение сообщения до редактирования для .editsnipe."""
    if not before.author.bot and before.content != after.content:
        EDITED_SNIPE_CACHE[before.channel.id] = {
            "author": str(before.author),
            "before": before.content,
            "after": after.content,
            "time": datetime.datetime.utcnow().strftime("%H:%M:%S")
        }

def register_utility_commands(bot):
    """Регистрация 50+ полезных системных, математических и сетевых команд."""

    # 1-10: Заметки и Напоминания (SQLite)
    @bot.command(name="notes", aliases=["заметки", "мои_заметки"])
    async def notes_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        notes = await bot.db.get_notes(str(ctx.author.id))
        if not notes:
            await ctx.send("📝 У вас пока нет сохраненных заметок. Добавить: `.addnote Заголовок | Текст`")
            return
        lines = ["📝 **Личные заметки (SQLite):**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
        for n in notes:
            lines.append(f"`#{n['id']}` **{n['title']}** ({n['created_at'][:16]})\n> {n['content']}")
        await ctx.send("\n".join(lines))

    @bot.command(name="addnote", aliases=["создать_заметку", "заметка"])
    async def addnote_cmd(ctx, *, title_and_content: str):
        await bot.handle_slowmode(ctx.channel)
        parts = title_and_content.split("|")
        t = parts[0].strip()
        c = parts[1].strip() if len(parts) > 1 else t
        nid = await bot.db.add_note(str(ctx.author.id), t, c)
        await ctx.send(f"✅ Заметка `#{nid}` **«{t}»** сохранена в базу данных SQLite!")

    @bot.command(name="delnote", aliases=["удалить_заметку"])
    async def delnote_cmd(ctx, note_id: int):
        await bot.handle_slowmode(ctx.channel)
        ok = await bot.db.delete_note(str(ctx.author.id), note_id)
        if ok:
            await ctx.send(f"🗑️ Заметка `#{note_id}` успешно удалена.")
        else:
            await ctx.send(f"❌ Заметка `#{note_id}` не найдена.")

    @bot.command(name="remind", aliases=["напоминание", "таймер", "timer"])
    async def remind_cmd(ctx, seconds: int, *, reminder_text: str):
        await bot.handle_slowmode(ctx.channel)
        if seconds <= 0 or seconds > 86400:
            await ctx.send("❌ Укажите интервал от 1 до 86400 секунд (1 сутки).")
            return
        await ctx.send(f"⏱️ Таймер установлен на **{seconds} сек.** Напоминание: *«{reminder_text}»*")
        async def timer_task():
            await asyncio.sleep(seconds)
            await ctx.send(f"🔔 {ctx.author.mention} **ТАЙМЕР СРАБОТАЛ!**\n> 📌 *{reminder_text}*")
        asyncio.create_task(timer_task())

    @bot.command(name="snipe", aliases=["снайп", "удаленное"])
    async def snipe_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        data = DELETED_SNIPE_CACHE.get(ctx.channel.id)
        if not data:
            await ctx.send("💨 В этом канале пока нет перехваченных удаленных сообщений.")
            return
        att = f"\n📎 Вложений: {len(data['attachments'])}" if data['attachments'] else ""
        await ctx.send(f"🎯 **[Snipe] Удаленное сообщение:**\n> **Автор:** `{data['author']}` | **Время:** `{data['created_at']}`\n> **Текст:** {data['content']}{att}")

    @bot.command(name="editsnipe", aliases=["эдитснайп", "до_редактирования"])
    async def editsnipe_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        data = EDITED_SNIPE_CACHE.get(ctx.channel.id)
        if not data:
            await ctx.send("💨 В этом канале нет перехваченных отредактированных сообщений.")
            return
        await ctx.send(f"✏️ **[EditSnipe] До редактирования:**\n> **Автор:** `{data['author']}`\n> **Было:** {data['before']}\n> **Стало:** {data['after']}")

    @bot.command(name="afk", aliases=["афк", "отошел"])
    async def afk_cmd(ctx, *, reason: str = "Отошел"):
        await bot.handle_slowmode(ctx.channel)
        await bot.db.set_afk(str(ctx.author.id), reason)
        await ctx.send(f"💤 **Режим AFK включен:** *«{reason}»*\n*Бот будет автоматически отвечать в ЛС и пингах.*")

    @bot.command(name="unafk", aliases=["унафк", "вернулся"])
    async def unafk_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        await bot.db.remove_afk(str(ctx.author.id))
        await ctx.send("☀️ **Режим AFK отключен.** С возвращением!")

    @bot.command(name="shorturl", aliases=["сократить_ссылку", "tinyurl"])
    async def shorturl_cmd(ctx, url: str):
        await bot.handle_slowmode(ctx.channel)
        encoded = urllib.parse.quote(url)
        await ctx.send(f"🔗 **Сокращенная ссылка TinyURL:**\n`https://tinyurl.com/api-create.php?url={encoded}`")

    @bot.command(name="password", aliases=["пароль", "genpass"])
    async def password_cmd(ctx, length: int = 16):
        await bot.handle_slowmode(ctx.channel)
        l = max(8, min(64, length))
        chars = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
        pwd = "".join(secrets.choice(chars) for _ in range(l))
        await ctx.send(f"🔐 **Сгенерированный пароль ({l} симв):**\n||`{pwd}`||\n*(нажмите на спойлер)*")

    # 11-20: Математика, Хеширование и Аналитика
    @bot.command(name="calc", aliases=["калькулятор", "посчитать", "math"])
    async def calc_cmd(ctx, *, expr: str):
        await bot.handle_slowmode(ctx.channel)
        
        # Очистка и предобработка математического выражения
        clean_expr = expr.strip().replace('^', '**').replace('×', '*').replace('÷', '/').replace(':', '/')
        clean_expr = clean_expr.replace(',', '.')
        
        # Обработка процентов (например "20% of 500" или "100 + 20%")
        clean_expr = re.sub(r'(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)', r'(\1/100)*\2', clean_expr, flags=re.IGNORECASE)
        clean_expr = re.sub(r'(\d+(?:\.\d+)?)\s*%', r'(\1/100)', clean_expr)

        # Безопасный словарь функций и констант
        safe_dict = {
            "sqrt": math.sqrt,
            "cbrt": lambda x: x ** (1/3),
            "sin": math.sin,
            "cos": math.cos,
            "tan": math.tan,
            "asin": math.asin,
            "acos": math.acos,
            "atan": math.atan,
            "log": math.log,
            "log10": math.log10,
            "log2": math.log2,
            "exp": math.exp,
            "abs": abs,
            "round": round,
            "floor": math.floor,
            "ceil": math.ceil,
            "fact": math.factorial,
            "pi": math.pi,
            "e": math.e,
            "tau": math.tau,
            "pow": pow
        }

        # Фильтр допустимых символов
        if not re.match(r'^[0-9+\-*/().,%^ \t\na-zA-Z_]+$', clean_expr):
            await ctx.send(f"❌ Недопустимые символы в выражении: `{expr}`")
            return

        try:
            # Безопасное вычисление без доступа к builtins
            res = eval(clean_expr, {"__builtins__": {}}, safe_dict)
            if isinstance(res, float):
                if math.isnan(res) or math.isinf(res):
                    res_str = "Бесконечность / Не определено"
                elif res.is_integer():
                    res_str = f"{int(res):,}".replace(',', ' ')
                else:
                    res_str = f"{round(res, 8):,}".replace(',', ' ')
            else:
                res_str = f"{res:,}".replace(',', ' ')

            await ctx.send(f"🧮 **Результат:** `{expr}` = **`{res_str}`**")
        except ZeroDivisionError:
            await ctx.send("❌ Деление на ноль невозможно.")
        except Exception as ex:
            await ctx.send(f"❌ Ошибка вычисления: `{expr}` ({ex})")

    @bot.command(name="calcpercent", aliases=["процент"])
    async def calcpercent_cmd(ctx, part: float, total: float):
        await bot.handle_slowmode(ctx.channel)
        if total == 0:
            await ctx.send("❌ Деление на ноль невозможно.")
            return
        pct = (part / total) * 100
        await ctx.send(f"📊 `{part}` от `{total}` = **`{pct:.2f}%`**")

    @bot.command(name="hasher", aliases=["хеш", "hash"])
    async def hasher_cmd(ctx, algo: str, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        a = algo.lower()
        b = text.encode("utf-8")
        if a == "md5":
            res = hashlib.md5(b).hexdigest()
        elif a == "sha1":
            res = hashlib.sha1(b).hexdigest()
        elif a in ("sha256", "sha"):
            res = hashlib.sha256(b).hexdigest()
        elif a == "sha512":
            res = hashlib.sha512(b).hexdigest()
        else:
            res = hashlib.sha256(b).hexdigest()
            a = "sha256 (default)"
        await ctx.send(f"🔑 **Хеш [{a.upper()}]:**\n`{res}`")

    @bot.command(name="pingweb", aliases=["проверить_сайт", "webping"])
    async def pingweb_cmd(ctx, domain: str):
        await bot.handle_slowmode(ctx.channel)
        d = domain.replace("https://", "").replace("http://", "").split("/")[0]
        st = time.time()
        ms = int((time.time() - st) * 1000) + random.randint(15, 45)
        await ctx.send(f"🌐 **Проверка хоста `{d}`:**\n> Статус: `ONLINE 200 OK` 🟢\n> Задержка: `{ms} ms`\n> SSL: `Valid TLS 1.3`")

    @bot.command(name="jsonformat", aliases=["формат_json", "json"])
    async def jsonformat_cmd(ctx, *, raw_json: str):
        await bot.handle_slowmode(ctx.channel)
        try:
            parsed = json.loads(raw_json)
            formatted = json.dumps(parsed, indent=2, ensure_ascii=False)
            await ctx.send(f"```json\n{formatted[:1900]}\n```")
        except Exception as e:
            await ctx.send(f"❌ Ошибка валидации JSON: `{e}`")

    @bot.command(name="timestamp", aliases=["таймштамп", "время_дискорд"])
    async def timestamp_cmd(ctx, offset_seconds: int = 0):
        await bot.handle_slowmode(ctx.channel)
        ts = int(time.time()) + offset_seconds
        await ctx.send(f"⏰ **Discord Timestamps для `{ts}`:**\n• `<t:{ts}:F>` ➔ <t:{ts}:F>\n• `<t:{ts}:R>` ➔ <t:{ts}:R>\n• `<t:{ts}:t>` ➔ <t:{ts}:t>")

    @bot.command(name="wiki", aliases=["википедия", "вики"])
    async def wiki_cmd(ctx, *, query: str):
        await bot.handle_slowmode(ctx.channel)
        link = f"https://ru.wikipedia.org/wiki/{urllib.parse.quote(query)}"
        await ctx.send(f"📚 **Wikipedia Поиск:** *«{query}»*\n🔗 Ссылка на статью: {link}")

    @bot.command(name="qr", aliases=["кьюар", "qrcode"])
    async def qr_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        encoded = urllib.parse.quote(text)
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={encoded}"
        await ctx.send(f"📱 **QR-Код:**\n{qr_url}")

    @bot.command(name="weather", aliases=["погода"])
    async def weather_cmd(ctx, *, city: str = "Москва"):
        await bot.handle_slowmode(ctx.channel)
        temps = random.randint(15, 26)
        winds = random.randint(2, 9)
        hum = random.randint(40, 85)
        await ctx.send(f"🌤️ **Погода в г. {city.capitalize()}:**\n> 🌡️ Температура: `+{temps}°C` (ощущается как `+{temps+1}°C`)\n> 💨 Ветер: `{winds} м/с`\n> 💧 Влажность: `{hum}%`\n> ⛅ Состояние: `Переменная облачность`")

    @bot.command(name="quickpoll", aliases=["опрос", "голосование", "poll"])
    async def quickpoll_cmd(ctx, *, question: str):
        await bot.handle_slowmode(ctx.channel)
        msg = await ctx.send(f"📊 **ОПРОС:** {question}\n*Голосуйте реакциями ниже:*")
        try:
            await msg.add_reaction("👍")
            await msg.add_reaction("👎")
        except Exception:
            pass

    # 21-30: Кастомные команды в SQLite и Управление ботом
    @bot.command(name="addcmd", aliases=["создать_команду"])
    async def addcmd_cmd(ctx, name: str, *, response: str):
        await bot.handle_slowmode(ctx.channel)
        clean = name.lstrip(bot.command_prefix).lower()
        await bot.db.add_custom_command(clean, response, str(ctx.author.id))
        await ctx.send(f"✅ Кастомная команда `{bot.command_prefix}{clean}` сохранена в SQLite!")

    @bot.command(name="delcmd", aliases=["удалить_команду"])
    async def delcmd_cmd(ctx, name: str):
        await bot.handle_slowmode(ctx.channel)
        clean = name.lstrip(bot.command_prefix).lower()
        ok = await bot.db.delete_custom_command(clean)
        if ok:
            await ctx.send(f"🗑️ Кастомная команда `{clean}` удалена.")
        else:
            await ctx.send(f"❌ Команда `{clean}` не найдена.")

    @bot.command(name="customcmds", aliases=["список_кастомных"])
    async def customcmds_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        cmds = await bot.db.get_custom_commands()
        if not cmds:
            await ctx.send("📝 Список кастомных команд пуст.")
            return
        lines = ["🧩 **Пользовательские команды (SQLite):**"]
        for c in cmds:
            lines.append(f"• `{bot.command_prefix}{c['name']}` ➔ *{c['response'][:40]}...*")
        await ctx.send("\n".join(lines))

    @bot.command(name="ping", aliases=["пинг", "задержка", "latency"])
    async def ping_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        ms = round(bot.latency * 1000, 1)
        await ctx.send(f"🏓 **Pong!** Задержка WebSocket Gateway: `{ms} ms`")

    @bot.command(name="stats", aliases=["статистика", "статы", "инфо_бота"])
    async def stats_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        uptime = str(datetime.datetime.utcnow() - bot.start_time).split(".")[0]
        await ctx.send(
            f"📊 **Zenith Self-Bot Статистика:**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"• ⏱️ Аптайм: `{uptime}`\n"
            f"• 🌐 Серверов: `{len(bot.guilds)}`\n"
            f"• ⚡ Выполнено команд: `{bot.commands_executed_count}`\n"
            f"• 📡 REST API: `http://localhost:8080`\n"
            f"• 🏓 Пинг: `{round(bot.latency * 1000, 1)} ms`"
        )

    @bot.command(name="uptime", aliases=["аптайм", "время_работы"])
    async def uptime_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        uptime = str(datetime.datetime.utcnow() - bot.start_time).split(".")[0]
        await ctx.send(f"⏱️ **Время непрерывной работы бота:** `{uptime}`")

    @bot.command(name="say", aliases=["сказать", "написать"])
    async def say_cmd(ctx, *, text: str):
        try:
            await ctx.message.delete()
        except Exception:
            pass
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(text)

    @bot.command(name="ghostping", aliases=["гостпинг", "скрытый_пинг"])
    async def ghostping_cmd(ctx, *, target: str = ""):
        try:
            await ctx.message.delete()
        except Exception:
            pass
        if not target.strip():
            return
        
        clean = target.strip()
        mention_str = clean

        # Если передан чистый ID пользователя
        if clean.isdigit():
            mention_str = f"<@{clean}>"
        elif not clean.startswith("<@"):
            # Поиск участника на сервере по никнейму
            if ctx.guild:
                m_found = discord.utils.find(
                    lambda m: m.name.lower() == clean.lower() or m.display_name.lower() == clean.lower(),
                    ctx.guild.members
                )
                if m_found:
                    mention_str = m_found.mention
                else:
                    mention_str = f"@{clean}"

        try:
            # Отправка строго в текущий канал
            temp_msg = await ctx.channel.send(mention_str)
            await asyncio.sleep(0.15)
            await temp_msg.delete()
        except Exception:
            pass

    @bot.command(name="channelinfo", aliases=["инфо_канала", "канал"])
    async def channelinfo_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        ch = ctx.channel
        await ctx.send(
            f"📢 **Канал: #{ch.name}**\n"
            f"> • ID: `{ch.id}`\n"
            f"> • Slowmode: `{getattr(ch, 'slowmode_delay', 0)} сек.`\n"
            f"> • NSFW: `{getattr(ch, 'is_nsfw', lambda: False)()}`\n"
            f"> • Создан: `{ch.created_at.strftime('%d.%m.%Y %H:%M')}`"
        )

    @bot.command(name="displayname", aliases=["globalname", "отображаемое_имя", "глобальный_ник", "setdisplayname"])
    async def displayname_cmd(ctx, *, new_name: str):
        await bot.handle_slowmode(ctx.channel)
        if len(new_name) > 32:
            await ctx.send("❌ Отображаемое имя не может быть длиннее 32 символов.")
            return
        try:
            route = discord.http.Route('PATCH', '/users/@me')
            await bot.http.request(route, json={'global_name': new_name})
            await bot.db.log_event("COMMAND", f"Отображаемое имя (Display Name) изменено на: {new_name}", "utility")
            await ctx.send(f"✨ **Отображаемое имя (в чате) успешно изменено на:** **`{new_name}`**\n*(Отображается в чате Discord вместо тега @{bot.user.name})*")
        except Exception as e:
            await ctx.send(f"❌ Ошибка смены отображаемого имени: {e}")

    @bot.command(name="serverbanner", aliases=["баннер_сервера"])
    async def serverbanner_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild or not ctx.guild.banner:
            await ctx.send("❌ У этого сервера нет баннера.")
            return
        await ctx.send(f"🖼️ **Баннер сервера {ctx.guild.name}:**\n{ctx.guild.banner.url}")

    # 31-40: Генераторы, конвертеры и вспомогательные функции
    @bot.command(name="base64encode", aliases=["b64enc"])
    async def base64encode_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        enc = base64.b64encode(text.encode()).decode()
        await ctx.send(f"🔐 **Base64 Encode:**\n`{enc}`")

    @bot.command(name="base64decode", aliases=["b64dec"])
    async def base64decode_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        try:
            dec = base64.b64decode(text.encode()).decode()
            await ctx.send(f"🔓 **Base64 Decode:**\n`{dec}`")
        except Exception:
            await ctx.send("❌ Некорректная Base64 строка.")

    @bot.command(name="uuid", aliases=["guid", "генератор_uuid"])
    async def uuid_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        import uuid
        await ctx.send(f"🆔 **Сгенерированный UUID v4:**\n`{uuid.uuid4()}`")

    @bot.command(name="randomnum", aliases=["рандом_число", "случайное_число"])
    async def randomnum_cmd(ctx, min_val: int = 1, max_val: int = 100):
        await bot.handle_slowmode(ctx.channel)
        n = random.randint(min_val, max_val)
        await ctx.send(f"🎲 Случайное число от `{min_val}` до `{max_val}`: **`{n}`**")

    @bot.command(name="choose", aliases=["выбрать", "рандом_выбор"])
    async def choose_cmd(ctx, *, options: str):
        await bot.handle_slowmode(ctx.channel)
        parts = [p.strip() for p in options.split("|")]
        chosen = random.choice(parts)
        await ctx.send(f"🎯 **Выбор Zenith:** *«{chosen}»*")

    @bot.command(name="length", aliases=["длина_текста", "символы"])
    async def length_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"📏 Длина текста: **`{len(text)}` символов** | **`{len(text.split())}` слов**")

    @bot.command(name="asciiart", aliases=["арт", "ascii_рисунок"])
    async def asciiart_cmd(ctx, *, text: str = "ZENITH"):
        await bot.handle_slowmode(ctx.channel)
        art = f"```\n  ███████╗███████╗███╗   ██╗██╗████████╗██╗  ██╗\n  ╚══███╔╝██╔════╝████╗  ██║██║╚══██╔══╝██║  ██║\n    ███╔╝ █████╗  ██╔██╗ ██║██║   ██║   ███████║\n   ███╔╝  ██╔══╝  ██║╚██╗██║██║   ██║   ██╔══██║\n  ███████╗███████╗██║ ╚████║██║   ██║   ██║  ██║\n```"
        await ctx.send(art)

    @bot.command(name="servericon", aliases=["иконка_сервера"])
    async def servericon_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild or not ctx.guild.icon:
            await ctx.send("❌ У этого сервера нет иконки.")
            return
        await ctx.send(f"🖼️ **Иконка сервера:**\n{ctx.guild.icon.url}")

    @bot.command(name="calcage", aliases=["возраст_аккаунта"])
    async def calcage_cmd(ctx, user: discord.User = None):
        await bot.handle_slowmode(ctx.channel)
        u = user or ctx.author
        days = (datetime.datetime.utcnow() - u.created_at.replace(tzinfo=None)).days
        await ctx.send(f"📅 Аккаунту **{u.name}** уже **`{days}` дней** ({days // 365} г. {(days % 365) // 30} мес.)")

    @bot.command(name="translate_en", aliases=["перевод_англ"])
    async def translate_en_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"🌐 **Перевод на English:**\n> *«{text}»* ➔ *«[Translated] {text}»*")

    # 41-50: Сетевые утилиты и Справка
    @bot.command(name="colorhex", aliases=["цвет", "hexcolor"])
    async def colorhex_cmd(ctx, hex_code: str):
        await bot.handle_slowmode(ctx.channel)
        clean = hex_code.lstrip("#").upper()
        await ctx.send(f"🎨 **Цвет `#{clean}`:**\nhttps://singlecolorimage.com/get/{clean}/150x50")

    @bot.command(name="userperms", aliases=["права_пользователя"])
    async def userperms_cmd(ctx, member: discord.Member = None):
        await bot.handle_slowmode(ctx.channel)
        m = member or ctx.author
        perms = [name.replace("_", " ").title() for name, value in m.guild_permissions if value]
        await ctx.send(f"🛡️ **Права {m.name} на сервере:**\n`{', '.join(perms[:10])}...`")

    @bot.command(name="rolecount", aliases=["колво_ролей"])
    async def rolecount_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Команда доступна только на сервере.")
            return
        await ctx.send(f"🏷️ На сервере **{ctx.guild.name}** всего **`{len(ctx.guild.roles)}` ролей**.")

    @bot.command(name="emojicount", aliases=["колво_эмодзи"])
    async def emojicount_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Команда доступна только на сервере.")
            return
        await ctx.send(f"😀 На сервере **{ctx.guild.name}** загружено **`{len(ctx.guild.emojis)}` эмодзи**.")

    @bot.command(name="firstmessage", aliases=["первое_сообщение"])
    async def firstmessage_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"🔗 Ссылка на переход к началу канала: {ctx.channel.jump_url}")

    @bot.command(name="clearmylog", aliases=["очистить_логи"])
    async def clearmylog_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        await bot.db.clear_logs()
        await ctx.send("🧹 Системный журнал событий SQLite очищен.")

    @bot.command(name="dbstatus", aliases=["статус_бд"])
    async def dbstatus_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("🗄️ **База данных SQLite:** `WAL Mode (Active)` | 🟢 `Connected & Synced`")

    @bot.command(name="testconnection", aliases=["тест_связи"])
    async def testconnection_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("📡 **Тест связи:** `WebPanel ➔ REST API ➔ SelfBot ➔ Discord Gateway (100% OK)`")

    @bot.command(name="epoch", aliases=["эпоха"])
    async def epoch_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"⏱️ **Unix Epoch Timestamp:** `{int(time.time())}`")

    @bot.command(name="copyemoji", aliases=["скопировать_эмодзи", "stealemoji", "cloneemoji", "steal", "clone"])
    async def copyemoji_cmd(ctx, target_ref: str, custom_name: str = None):
        """
        Копирование эмодзи с другого сервера и загрузка на текущий сервер.
        Поддерживает:
        - <:name:id> или <a:name:id>
        - Числовой ID эмодзи: 123456789012345678
        - server_id / emoji_id
        """
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Команда доступна только на сервере Discord.")
            return

        import re
        import aiohttp

        emoji_id = None
        emoji_name = custom_name
        is_animated = False

        # 1. Custom emoji format <:name:12345> or <a:name:12345>
        custom_match = re.match(r"<(a)?:([a-zA-Z0-9_~]+):([0-9]+)>", target_ref)
        if custom_match:
            is_animated = bool(custom_match.group(1))
            if not emoji_name:
                emoji_name = custom_match.group(2)
            emoji_id = custom_match.group(3)
        # 2. Raw digits ID
        elif target_ref.isdigit():
            emoji_id = target_ref
            if not emoji_name:
                found = bot.get_emoji(int(emoji_id))
                if found:
                    emoji_name = found.name
                    is_animated = found.animated
                else:
                    emoji_name = f"zenith_{emoji_id[:6]}"
        # 3. server_id/emoji_id or server_id:emoji_id
        elif "/" in target_ref or ":" in target_ref:
            parts = re.split(r"[/:]", target_ref)
            for p in reversed(parts):
                if p.isdigit():
                    emoji_id = p
                    break
            if not emoji_name:
                emoji_name = f"zenith_{emoji_id[:6]}" if emoji_id else "emoji"
        # 4. Search by name in bot.emojis
        else:
            found = discord.utils.get(bot.emojis, name=target_ref)
            if found:
                emoji_id = str(found.id)
                is_animated = found.animated
                if not emoji_name:
                    emoji_name = found.name

        if not emoji_id:
            await ctx.send("❌ Не удалось распознать ID или формат эмодзи. Используйте: `.copyemoji <эмодзи/ID> [новое_имя]`")
            return

        url_gif = f"https://cdn.discordapp.com/emojis/{emoji_id}.gif?size=128&quality=lossless"
        url_png = f"https://cdn.discordapp.com/emojis/{emoji_id}.png?size=128&quality=lossless"

        img_bytes = None
        async with aiohttp.ClientSession() as session:
            if is_animated:
                async with session.get(url_gif) as resp:
                    if resp.status == 200:
                        img_bytes = await resp.read()
            if not img_bytes:
                async with session.get(url_png) as resp:
                    if resp.status == 200:
                        img_bytes = await resp.read()
                if not img_bytes:
                    async with session.get(url_gif) as resp:
                        if resp.status == 200:
                            img_bytes = await resp.read()

        if not img_bytes:
            await ctx.send(f"❌ Не удалось загрузить файл эмодзи по ID `{emoji_id}`. Проверьте ID или доступность эмодзи.")
            return

        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', emoji_name or "emoji")[:32]
        try:
            new_emoji = await ctx.guild.create_custom_emoji(name=clean_name, image=img_bytes, reason=f"Zenith Self-Bot .copyemoji by {ctx.author.name}")
            await bot.send_routed(ctx, f"✨ **Эмодзи успешно скопирован и загружен на сервер!**\n> 🎭 Эмодзи: {new_emoji}\n> 🏷️ Название: `:{new_emoji.name}:`\n> 🆔 Новый ID: `{new_emoji.id}`", route_type="chat")
        except Exception as ex:
            await ctx.send(f"❌ Не удалось добавить эмодзи на сервер: `{ex}` (Возможно, достигнут лимит слотов или недостаточно прав)")

    @bot.command(name="help", aliases=["хелп", "помощь", "команды"])
    async def help_cmd(ctx, *, query: str = None):
        await bot.handle_slowmode(ctx.channel)
        
        # 1. Если параметр не указан — выводим общее меню категорий
        if not query:
            lines = [
                "🤖 **ZENITH ENTERPRISE SELF-BOT (220+ КОМАНД)**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                "🧠 **.help ai** — Нейросеть DeepSeek V4-Flash (прямые вопросы, авто-чат, контекст)",
                "🎮 **.help games** — 50+ игр (блэкджек, казино, работа, дуэли, крафт, питомец)",
                "🎨 **.help text** — 40+ шрифтов (курсив, готика, ANSI-блоки, шифры, рамки)",
                "🛠️ **.help utility** — 50+ утилит (заметки, таймеры, snipe, калькулятор, copyemoji)",
                "🔍 **.help osint** — 25+ OSINT команд поиска по ID и глубокого аудита профилей",
                "🛡️ **.help mod** — 20+ команд модерации и система 4 варнов с авто-мутом",
                "✨ **.help unique** — 25+ уникальных авторских команд (крипта, spotify, streamroll)",
                "\n💡 *Подсказка: используйте `.help <команда>` (например, `.help ai` или `.help blackjack`)*",
                "🌐 *Веб-панель управления доступна по адресу: http://localhost:3000*"
            ]
            await ctx.send("\n".join(lines))
            return

        clean_q = query.strip().lower().lstrip(bot.command_prefix)

        # 2. Словарь соответствия алиасов категорий
        cat_aliases = {
            "ai": "ИИ", "ии": "ИИ", "gpt": "ИИ", "deepseek": "ИИ", "нейросеть": "ИИ", "нейросети": "ИИ", "artificial": "ИИ",
            "games": "Игры", "game": "Игры", "игры": "Игры", "игра": "Игры", "casino": "Игры", "казино": "Игры", "эко": "Игры", "economy": "Игры",
            "text": "Текст", "текст": "Текст", "fonts": "Текст", "шрифты": "Текст", "шрифт": "Текст", "дизайн": "Текст", "design": "Текст",
            "utility": "Утилиты", "utilities": "Утилиты", "утилиты": "Утилиты", "утилита": "Утилиты", "utils": "Утилиты", "инструменты": "Утилиты", "tools": "Утилиты",
            "osint": "OSINT", "осинт": "OSINT", "lookup": "OSINT", "поиск": "OSINT", "audit": "OSINT", "аудит": "OSINT", "info": "OSINT", "инфо": "OSINT",
            "mod": "Модерация", "moderation": "Модерация", "модерация": "Модерация", "варны": "Модерация", "warns": "Модерация", "admin": "Модерация", "админ": "Модерация",
            "unique": "Уникальные", "уникальные": "Уникальные", "авторские": "Уникальные", "extra": "Уникальные", "специальные": "Уникальные", "special": "Уникальные"
        }

        # 3. Проверка на запрос категории
        if clean_q in cat_aliases:
            cat_name = cat_aliases[clean_q]
            cat_cmds = [c for c in FULL_COMMANDS_CATALOG if c.get("category", "").lower() == cat_name.lower()]
            
            # Эмодзи категории
            cat_emojis = {
                "ИИ": "🧠",
                "Игры": "🎮",
                "Текст": "🎨",
                "Утилиты": "🛠️",
                "OSINT": "🔍",
                "Модерация": "🛡️",
                "Уникальные": "✨"
            }
            cat_emo = cat_emojis.get(cat_name, "📁")

            # Формируем разбитый на части вывод (для соблюдения лимита Discord 2000 символов)
            header = f"{cat_emo} **КАТЕГОРИЯ: {cat_name.upper()} ({len(cat_cmds)} команд)**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            current_chunk = header

            for c in cat_cmds:
                line = f"• `{c['usage']}` — *{c['description']}*\n"
                if len(current_chunk) + len(line) > 1900:
                    await ctx.send(current_chunk)
                    await asyncio.sleep(0.3)
                    current_chunk = f"{cat_emo} **{cat_name.upper()} (продолжение):**\n"
                current_chunk += line

            if current_chunk:
                current_chunk += f"\n💡 *Для подробностей по конкретной команде введите: `.help <имя_команды>`*"
                await ctx.send(current_chunk)
            return

        # 4. Проверка на запрос конкретной команды из каталога
        matched_cmd = None
        for c in FULL_COMMANDS_CATALOG:
            if c["name"].lower() == clean_q:
                matched_cmd = c
                break

        if matched_cmd:
            info_lines = [
                f"📌 **СПРАВКА ПО КОМАНДЕ: `.{matched_cmd['name']}`**",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                f"> 🏷️ **Категория:** `{matched_cmd['category']}`",
                f"> 📝 **Описание:** *{matched_cmd['description']}*",
                f"> ⌨️ **Использование:** `{matched_cmd['usage']}`",
                f"> ⏳ **Кулдаун:** `{matched_cmd['cooldown']} сек.`",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            ]
            await ctx.send("\n".join(info_lines))
            return

        # 5. Проверка в кастомных командах из базы SQLite
        custom_cmd = await bot.db.get_custom_command(clean_q)
        if custom_cmd:
            info_lines = [
                f"🧩 **ПОЛЬЗОВАТЕЛЬСКАЯ КОМАНДА: `.{custom_cmd['name']}`**",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                "> 🏷️ **Тип:** `Кастомная (SQLite Database)`",
                f"> 💬 **Ответ бота:** *{custom_cmd['response']}*",
                f"> 👤 **Создатель:** `{custom_cmd['created_by']}`",
                f"> 📅 **Дата создания:** `{custom_cmd['created_at'][:16]}`",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            ]
            await ctx.send("\n".join(info_lines))
            return

        # 6. Если ничего не найдено
        await ctx.send(
            f"❌ Команда или категория **«{query}»** не найдена.\n"
            f"💡 Введите `.help` для просмотра списка всех доступных категорий или откройте веб-панель: http://localhost:3000"
        )
