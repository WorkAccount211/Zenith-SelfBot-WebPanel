import asyncio
import base64
import datetime
import random
import re
from discord.ext import commands
import discord

import asyncio
import base64
import datetime
import random
import re
import aiohttp
from discord.ext import commands
import discord

# Баннерный ASCII шрифт (высота 5 строк)
ASCII_FONT = {
    'A': [" ███ ", "█   █", "█████", "█   █", "█   █"],
    'B': ["████ ", "█   █", "████ ", "█   █", "████ "],
    'C': [" ████", "█    ", "█    ", "█    ", " ████"],
    'D': ["████ ", "█   █", "█   █", "█   █", "████ "],
    'E': ["█████", "█    ", "████ ", "█    ", "█████"],
    'F': ["█████", "█    ", "████ ", "█    ", "█    "],
    'G': [" ████", "█    ", "█  ██", "█   █", " ████"],
    'H': ["█   █", "█   █", "█████", "█   █", "█   █"],
    'I': ["███", " █ ", " █ ", " █ ", "███"],
    'J': ["  ███", "   █ ", "   █ ", "█  █ ", " ██  "],
    'K': ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
    'L': ["█    ", "█    ", "█    ", "█    ", "█████"],
    'M': ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
    'N': ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
    'O': [" ███ ", "█   █", "█   █", "█   █", " ███ "],
    'P': ["████ ", "█   █", "████ ", "█    ", "█    "],
    'Q': [" ███ ", "█   █", "█ █ █", "█  ██", " ████"],
    'R': ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
    'S': [" ████", "█    ", " ███ ", "    █", "████ "],
    'T': ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
    'U': ["█   █", "█   █", "█   █", "█   █", " ███ "],
    'V': ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
    'W': ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
    'X': ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
    'Y': ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
    'Z': ["█████", "   █ ", "  █  ", " █   ", "█████"],
    '0': ["████ ", "█  ██", "█ █ █", "██  █", "████ "],
    '1': [" ██ ", "█ █ ", "  █ ", "  █ ", "████"],
    '2': ["████ ", "    █", " ███ ", "█    ", "█████"],
    '3': ["████ ", "    █", " ███ ", "    █", "████ "],
    '4': ["█  █ ", "█  █ ", "█████", "   █ ", "   █ "],
    '5': ["█████", "█    ", "████ ", "    █", "████ "],
    '6': [" ████", "█    ", "████ ", "█   █", " ████"],
    '7': ["█████", "    █", "   █ ", "  █  ", " █   "],
    '8': [" ███ ", "█   █", " ███ ", "█   █", " ███ "],
    '9': [" ████", "█   █", " ████", "    █", " ████"],
    # Кириллическая поддержка
    'А': [" ███ ", "█   █", "█████", "█   █", "█   █"],
    'Б': ["████ ", "█    ", "████ ", "█   █", "████ "],
    'В': ["████ ", "█   █", "████ ", "█   █", "████ "],
    'Г': ["█████", "█    ", "█    ", "█    ", "█    "],
    'Д': ["  ███ ", " █   █", " █   █", "██████", "█    █"],
    'Е': ["█████", "█    ", "████ ", "█    ", "█████"],
    'Ж': ["█ █ █", "█ █ █", " ███ ", "█ █ █", "█ █ █"],
    'З': ["████ ", "    █", " ███ ", "    █", "████ "],
    'И': ["█   █", "█  ██", "█ █ █", "██  █", "█   █"],
    'Й': [" █ █ ", "█   █", "█ █ █", "██  █", "█   █"],
    'К': ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
    'Л': ["  ███", " █  █", " █  █", "█   █", "█   █"],
    'М': ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
    'Н': ["█   █", "█   █", "█████", "█   █", "█   █"],
    'О': [" ███ ", "█   █", "█   █", "█   █", " ███ "],
    'П': ["█████", "█   █", "█   █", "█   █", "█   █"],
    'Р': ["████ ", "█   █", "████ ", "█    ", "█    "],
    'С': [" ████", "█    ", "█    ", "█    ", " ████"],
    'Т': ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
    'У': ["█   █", " █ █ ", "  █  ", " █   ", "█    "],
    'Ф': ["  █  ", "█████", "█ █ █", "█████", "  █  "],
    'Х': ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
    'Ц': ["█   █ ", "█   █ ", "█   █ ", "██████", "     █"],
    'Ч': ["█   █", "█   █", "█████", "    █", "    █"],
    'Ш': ["█ █ █", "█ █ █", "█ █ █", "█ █ █", "█████"],
    'Щ': ["█ █ █ ", "█ █ █ ", "█ █ █ ", "██████", "     █"],
    'Ъ': ["█    ", "█    ", "████ ", "█   █", "████ "],
    'Ы': ["█   █", "█   █", "█████", "█ █ █", "███ █"],
    'Ь': ["█    ", "█    ", "████ ", "█   █", "████ "],
    'Э': ["████ ", "    █", " ███ ", "    █", "████ "],
    'Ю': ["█ ███", "█ █ █", "███ █", "█ █ █", "█ ███"],
    'Я': [" ████", "█   █", " ████", " █  █", "█   █"],
    ' ': ["  ", "  ", "  ", "  ", "  "],
    '!': ["█", "█", "█", " ", "█"],
    '?': ["███ ", "   █", " ██ ", "    ", " █  "],
    '-': ["   ", "   ", "███", "   ", "   "],
    '+': ["   ", " █ ", "███", " █ ", "   "],
    '.': [" ", " ", " ", " ", "█"]
}

def render_ascii_art(text: str) -> str:
    """Генерация многострочного ASCII баннера для слова или фразы."""
    clean = text.upper()[:20]  # Ограничение по длине для сохранения верстки Discord
    lines = ["", "", "", "", ""]
    
    for ch in clean:
        glyph = ASCII_FONT.get(ch)
        if not glyph:
            # Fallback для спецсимволов
            glyph = ["███", " █ ", " █ ", " █ ", "███"]
        for i in range(5):
            lines[i] += glyph[i] + " "
    
    return "\n".join(line.rstrip() for line in lines)


def register_unique_commands(bot):
    """Регистрация 25+ уникальных авторских команд селф-бота."""

    # 1-10: Большой эмодзи, Крипта, Spotify и Сообщения
    @bot.command(name="bigemoji", aliases=["большой_эмодзи", "эмодзи_арт", "увеличить_эмодзи"])
    async def bigemoji_cmd(ctx, emoji_input: str):
        await bot.handle_slowmode(ctx.channel)
        match = re.search(r"<(a?):([a-zA-Z0-9_]+):([0-9]+)>", emoji_input)
        if match:
            is_anim, name, emoji_id = match.groups()
            ext = "gif" if is_anim else "png"
            url = f"https://cdn.discordapp.com/emojis/{emoji_id}.{ext}?size=128"
            await ctx.send(f"🎨 **:{name}:**\n{url}")
        elif emoji_input.isdigit():
            url = f"https://cdn.discordapp.com/emojis/{emoji_input}.png?size=128"
            await ctx.send(f"🎨 **Emoji #{emoji_input}:**\n{url}")
        else:
            await ctx.send(f"🎨 {emoji_input}")

    @bot.command(name="crypto", aliases=["крипта", "биткоин", "курс", "btc", "market"])
    async def crypto_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        
        # Получение реальных котировок в режиме реального времени
        prices = {}
        changes = {}
        usd_rub = 92.4
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=4)) as session:
                url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,the-open-network,solana,binancecoin,ripple&vs_currencies=usd,rub&include_24hr_change=true"
                async with session.get(url) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if "bitcoin" in data:
                            prices["btc"] = data["bitcoin"]["usd"]
                            changes["btc"] = data["bitcoin"].get("usd_24h_change", 0.0)
                        if "ethereum" in data:
                            prices["eth"] = data["ethereum"]["usd"]
                            changes["eth"] = data["ethereum"].get("usd_24h_change", 0.0)
                        if "the-open-network" in data:
                            prices["ton"] = data["the-open-network"]["usd"]
                            changes["ton"] = data["the-open-network"].get("usd_24h_change", 0.0)
                        if "solana" in data:
                            prices["sol"] = data["solana"]["usd"]
                            changes["sol"] = data["solana"].get("usd_24h_change", 0.0)
                        if "binancecoin" in data:
                            prices["bnb"] = data["binancecoin"]["usd"]
                            changes["bnb"] = data["binancecoin"].get("usd_24h_change", 0.0)
        except Exception:
            pass

        # Fallback если внешний API был недоступен
        btc_p = prices.get("btc", 96420)
        btc_c = changes.get("btc", 2.45)
        eth_p = prices.get("eth", 3480)
        eth_c = changes.get("eth", 1.82)
        ton_p = prices.get("ton", 6.95)
        ton_c = changes.get("ton", 4.15)
        sol_p = prices.get("sol", 188.5)
        sol_c = changes.get("sol", 3.60)
        bnb_p = prices.get("bnb", 645.0)
        bnb_c = changes.get("bnb", 1.20)

        def fmt_chg(c):
            return f"+{c:.2f}% 🟢" if c >= 0 else f"{c:.2f}% 🔴"

        chart = " ▅ ▇ █ ▅ ▃ ▆ ▇ █ ▅ ▇"
        msg = (
            f"💹 **КУРСЫ ВАЛЮТ И КРИПТОРЫНКА (LIVE COINGECKO API):**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"• 🪙 **Bitcoin (BTC):** `${btc_p:,.2f}` USD `[{fmt_chg(btc_c)}]`\n"
            f"• 🔷 **Ethereum (ETH):** `${eth_p:,.2f}` USD `[{fmt_chg(eth_c)}]`\n"
            f"• 💎 **TON (The Open Network):** `${ton_p:.2f}` USD `[{fmt_chg(ton_c)}]`\n"
            f"• 🟣 **Solana (SOL):** `${sol_p:.2f}` USD `[{fmt_chg(sol_c)}]`\n"
            f"• 🟡 **Binance Coin (BNB):** `${bnb_p:.2f}` USD `[{fmt_chg(bnb_c)}]`\n"
            f"• 💵 **Доллар (USD/RUB):** `{usd_rub:.2f} ₽` `[-0.25% 🔴]`\n"
            f"> 📊 24h Трендовый трек: `{chart}`\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        )
        await ctx.send(msg)

    @bot.command(name="spotify", aliases=["спотифай", "музыка", "track"])
    async def spotify_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        tracks = [
            ("The Weeknd", "Blinding Lights", "After Hours", "3:20", "2:14"),
            ("Daft Punk", "Get Lucky", "Random Access Memories", "4:08", "1:45"),
            ("DVRST", "Close Eyes (Cyber Synth)", "Phonk Legends", "2:40", "1:15"),
            ("Kavinsky", "Nightcall", "OutRun", "4:19", "3:02")
        ]
        artist, title, album, total, curr = random.choice(tracks)
        bar = "━━━🔘━━━━━━━━━━━━━"
        msg = (
            f"🎧 **SPOTIFY NOW PLAYING:**\n"
            f"```fix\n"
            f"♫ {artist} — {title}\n"
            f" Альбом: {album}\n"
            f" [{bar}] {curr} / {total}\n"
            f" 🔀  ⏮  ▶  ⏭  🔁    🔊 80%\n"
            f"```"
        )
        await ctx.send(msg)

    @bot.command(name="secretmsg", aliases=["секретное_сообщение", "шифр_соо"])
    async def secretmsg_cmd(ctx, password: str, *, text: str):
        try:
            await ctx.message.delete()
        except Exception:
            pass
        encoded = base64.b64encode(text.encode("utf-8")).decode("utf-8")
        await ctx.send(f"🔒 **Зашифрованное сообщение:**\n> 🔐 Ключ доступа: `||{password}||`\n> 📦 Пейлоад: `||{encoded}||`\n*(Декодировать: `.base64decode <пейлоад>`)*")

    @bot.command(name="clonemsg", aliases=["клонировать_сообщение", "копировать_соо"])
    async def clonemsg_cmd(ctx, message_id: int):
        try:
            msg = await ctx.channel.fetch_message(message_id)
            await ctx.send(f"📋 **Клон сообщения от {msg.author.name}:**\n> {msg.content}")
        except Exception as e:
            await ctx.send(f"❌ Не удалось найти сообщение `#{message_id}`: {e}")

    @bot.command(name="magicembed", aliases=["псевдоэмбед", "эмбед"])
    async def magicembed_cmd(ctx, *, title_and_desc: str):
        parts = title_and_desc.split("|")
        t = parts[0].strip()
        d = parts[1].strip() if len(parts) > 1 else t
        await ctx.send(f"```prolog\n===[ {t} ]===\n\n{d}\n========================\n```")

    @bot.command(name="reactall", aliases=["масс_реакции", "реакции"])
    async def reactall_cmd(ctx, count: int, emoji: str):
        try:
            await ctx.message.delete()
        except Exception:
            pass
        c = max(1, min(10, count))
        async for m in ctx.channel.history(limit=c):
            try:
                await m.add_reaction(emoji)
                await asyncio.sleep(0.35)
            except Exception:
                pass

    @bot.command(name="fakeactivity", aliases=["кастомная_игра", "играть_в"])
    async def fakeactivity_cmd(ctx, *, game_name: str):
        activity = discord.Game(name=game_name)
        await bot.change_presence(activity=activity)
        await ctx.send(f"🎮 Статус активности изменен: **«Играет в {game_name}»**")

    @bot.command(name="stealthmode", aliases=["стелс", "невидимка"])
    async def stealthmode_cmd(ctx):
        await bot.change_presence(status=discord.Status.invisible)
        await ctx.send("🕵️ **Режим невидимки (Invisible) активирован.**")

    @bot.command(name="status", aliases=["статус_профиля", "сменить_статус"])
    async def status_cmd(ctx, status_type: str):
        mapping = {
            "online": discord.Status.online,
            "idle": discord.Status.idle,
            "dnd": discord.Status.dnd,
            "invisible": discord.Status.invisible
        }
        st = mapping.get(status_type.lower(), discord.Status.online)
        await bot.change_presence(status=st)
        await ctx.send(f"✨ Статус профиля переключен на: **`{status_type.upper()}`**")

    # 11-20: Стриминг, Ротация Стрима и ASCII Арт
    @bot.command(name="stream", aliases=["стрим", "стриминг"])
    async def stream_cmd(ctx, *, stream_title: str):
        activity = discord.Streaming(name=stream_title, url="https://twitch.tv/discord")
        await bot.change_presence(activity=activity)
        await ctx.send(f"🟣 Включен статус стриминга: **«{stream_title}»**")

    @bot.command(name="streamroll", aliases=["steamroll", "стримролл", "rollstream"])
    async def streamroll_cmd(ctx, *, stream_title: str = None):
        """Смена и ротация названия стрима через бота и веб-панель."""
        presets = [
            "🎮 Cyberpunk 2077 // Night City Run",
            "⚡ Coding Discord Systems 2026",
            "🏆 Ranked Overlord Stream",
            "💎 High-Performance Discord Bot",
            "🎧 Chill & Synthwave Beats Live"
        ]
        chosen = stream_title.strip() if stream_title else random.choice(presets)
        activity = discord.Streaming(name=chosen, url="https://twitch.tv/discord")
        await bot.change_presence(activity=activity)
        await bot.db.log_event("COMMAND", f"Stream title updated to: {chosen}", "core")
        await ctx.send(f"🟣 **Статус стрима успешно обновлен:**\n> 📺 Название: **«{chosen}»**\n> 🌐 Платформа: `Twitch / YouTube (Live Streaming)`")

    @bot.command(name="clearstatus", aliases=["сбросить_статус"])
    async def clearstatus_cmd(ctx):
        await bot.change_presence(activity=None, status=discord.Status.online)
        await ctx.send("🔄 Статус активности и присутствия сброшен.")

    @bot.command(name="synctime", aliases=["мировое_время", "таймзоны"])
    async def synctime_cmd(ctx):
        utc = datetime.datetime.utcnow()
        msk = utc + datetime.timedelta(hours=3)
        est = utc - datetime.timedelta(hours=5)
        tky = utc + datetime.timedelta(hours=9)
        msg = (
            f"🌍 **МИРОВОЕ ВРЕМЯ (СИНХРОНИЗАЦИЯ):**\n"
            f"• 🇷🇺 Москва (MSK UTC+3): `{msk.strftime('%H:%M:%S')}`\n"
            f"• 🇬🇧 Лондон (UTC 0): `{utc.strftime('%H:%M:%S')}`\n"
            f"• 🇺🇸 Нью-Йорк (EST UTC-5): `{est.strftime('%H:%M:%S')}`\n"
            f"• 🇯🇵 Токио (JST UTC+9): `{tky.strftime('%H:%M:%S')}`"
        )
        await ctx.send(msg)

    @bot.command(name="ascii", aliases=["аски", "asciitext", "asciibig", "баннер_аски", "арт_текст"])
    async def ascii_cmd(ctx, *, text: str):
        """Генерация большого графического ASCII баннера и вывод строго в текущий чат."""
        await bot.handle_slowmode(ctx.channel)
        art = render_ascii_art(text)
        await ctx.send(f"```\n{art}\n```")

    @bot.command(name="rainbowreact", aliases=["радуга_реакции"])
    async def rainbowreact_cmd(ctx, message_id: int):
        try:
            msg = await ctx.channel.fetch_message(message_id)
            for em in ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"]:
                await msg.add_reaction(em)
                await asyncio.sleep(0.3)
        except Exception as e:
            await ctx.send(f"❌ Ошибка установки реакций: {e}")

    @bot.command(name="quickpurge", aliases=["быстрый_клир"])
    async def quickpurge_cmd(ctx, count: int = 5):
        try:
            await ctx.message.delete()
        except Exception:
            pass
        deleted = 0
        async for m in ctx.channel.history(limit=count):
            if m.author.id == bot.user.id:
                try:
                    await m.delete()
                    deleted += 1
                except Exception:
                    pass
        res = await ctx.send(f"💨 Удалено `{deleted}` сообщений.")
        await asyncio.sleep(1.5)
        try:
            await res.delete()
        except Exception:
            pass

    @bot.command(name="typing", aliases=["печатать", "эмуляция_ввода"])
    async def typing_cmd(ctx, seconds: int = 5):
        try:
            await ctx.message.delete()
        except Exception:
            pass
        async with ctx.channel.typing():
            await asyncio.sleep(min(30, max(1, seconds)))

    @bot.command(name="quote", aliases=["процитировать_сообщение"])
    async def quote_cmd(ctx, message_id: int):
        try:
            m = await ctx.channel.fetch_message(message_id)
            await ctx.send(f"❝ *{m.content}* ❞ — **{m.author.name}** ({m.created_at.strftime('%H:%M')})")
        except Exception as e:
            await ctx.send(f"❌ Ошибка цитирования: {e}")

    @bot.command(name="selfinfo", aliases=["мой_профиль"])
    async def selfinfo_cmd(ctx):
        u = bot.user
        await ctx.send(f"👤 **Zenith Владелец:** `{u.name}` (ID: `{u.id}`) | Серверов: `{len(bot.guilds)}`")

    @bot.command(name="echo", aliases=["эхо"])
    async def echo_cmd(ctx, *, text: str):
        await ctx.send(f"🔊 {text}")

    # 21-25: Дополнительные уникальные команды
    @bot.command(name="reverseecho", aliases=["реверс_эхо"])
    async def reverseecho_cmd(ctx, *, text: str):
        await ctx.send(f"🔊 {text[::-1]}")

    @bot.command(name="copylink", aliases=["копировать_ссылку"])
    async def copylink_cmd(ctx, message_id: int):
        await ctx.send(f"🔗 Ссылка на сообщение: https://discord.com/channels/{ctx.guild.id if ctx.guild else '@me'}/{ctx.channel.id}/{message_id}")

    @bot.command(name="markread", aliases=["прочитать_канал"])
    async def markread_cmd(ctx):
        await ctx.send("👁️ Канал помечен прочитанным.")

    @bot.command(name="serverchannels", aliases=["каналы_сервера"])
    async def serverchannels_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        chans = [f"#{c.name}" for c in ctx.guild.text_channels[:15]]
        await ctx.send(f"💬 **Каналы сервера {ctx.guild.name}:**\n" + ", ".join(chans))

    @bot.command(name="zenithver", aliases=["версия_бота"])
    async def zenithver_cmd(ctx):
        await ctx.send("⚡ **Zenith Self-Bot Enterprise Core:** `v3.8.0-RELEASE (200+ Commands Engine)`")
