import datetime
from discord.ext import commands
import discord

def register_osint_commands(bot):
    """Регистрация 25+ команд сбора данных и OSINT по ID пользователей и серверов."""

    # 1-10: Глубокий сбор данных профиля
    @bot.command(name="fetch", aliases=["пробить", "инфо_ид", "osint"])
    async def fetch_cmd(ctx, user_id: int):
        try:
            user = await bot.fetch_user(user_id)
            flags = [f.name.replace("_", " ").title() for f in user.public_flags.all()]
            created = user.created_at.strftime("%d.%m.%Y %H:%M:%S")
            nitro_status = "✨ Возможно активен (кастомный баннер/анимация)" if (user.banner or (user.avatar and user.avatar.is_animated())) else "Не обнаружен"
            msg = (
                f"🔍 **[OSINT] Данные аккаунта Discord**\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"• 👤 Имя / Ник: **{user.name}** (`{user}`)\n"
                f"• 🆔 Snowflake ID: `{user.id}`\n"
                f"• 🤖 Бот: `{'Да' if user.bot else 'Нет (Пользователь)'}`\n"
                f"• 📅 Дата регистрации: `{created}` UTC\n"
                f"• 💎 Nitro / Premium: `{nitro_status}`\n"
                f"• 🏷️ Значки (Badges): `{', '.join(flags) if flags else 'Нет публичных значков'}`\n"
                f"• 🖼️ Аватарка: {user.avatar.url if user.avatar else 'По умолчанию'}\n"
                f"• 🎨 Баннер: {user.banner.url if user.banner else 'Отсутствует'}"
            )
            await bot.send_routed(ctx, msg, route_type="osint")
        except Exception as e:
            await bot.send_routed(ctx, f"❌ Не удалось получить данные по ID `{user_id}`: {e}", route_type="osint")

    @bot.command(name="fetchavatar", aliases=["аватар_ид", "ава_по_ид"])
    async def fetchavatar_cmd(ctx, user_id: int):
        try:
            user = await bot.fetch_user(user_id)
            if not user.avatar:
                await bot.send_routed(ctx, f"❌ У пользователя `{user.name}` стоит стандартная аватарка.", route_type="osint")
                return
            png_url = str(user.avatar.with_format("png").with_size(1024))
            webp_url = str(user.avatar.with_format("webp").with_size(1024))
            msg = f"🖼️ **Аватарка пользователя {user.name} (`{user.id}`):**\n• PNG: {png_url}\n• WEBP: {webp_url}"
            await bot.send_routed(ctx, msg, route_type="osint")
        except Exception as e:
            await bot.send_routed(ctx, f"❌ Ошибка: {e}", route_type="osint")

    @bot.command(name="fetchbanner", aliases=["баннер_ид"])
    async def fetchbanner_cmd(ctx, user_id: int):
        try:
            user = await bot.fetch_user(user_id)
            if not user.banner:
                await bot.send_routed(ctx, f"❌ У пользователя `{user.name}` нет баннера профиля.", route_type="osint")
                return
            await bot.send_routed(ctx, f"🎨 **Баннер профиля {user.name} (`{user.id}`):**\n{user.banner.url}", route_type="osint")
        except Exception as e:
            await bot.send_routed(ctx, f"❌ Ошибка: {e}", route_type="osint")

    @bot.command(name="fetchbadges", aliases=["значки_ид", "бейджи"])
    async def fetchbadges_cmd(ctx, user_id: int):
        try:
            user = await bot.fetch_user(user_id)
            flags = [f.name.replace("_", " ").title() for f in user.public_flags.all()]
            badges_str = "\n".join([f"• 🏅 {b}" for b in flags]) if flags else "• Нет значков"
            await bot.send_routed(ctx, f"🏷️ **Значки профиля {user.name} (`{user.id}`):**\n{badges_str}", route_type="osint")
        except Exception as e:
            await bot.send_routed(ctx, f"❌ Ошибка: {e}", route_type="osint")

    @bot.command(name="mutuals", aliases=["общие_сервера", "мутуалы"])
    async def mutuals_cmd(ctx, target: discord.User):
        mutual = [g.name for g in bot.guilds if g.get_member(target.id)]
        msg = (
            f"🌐 **Общие сервера с {target.name} ({len(mutual)} шт.):**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            + ("\n".join([f"• {name}" for name in mutual[:20]]) if mutual else "Нет общих серверов.")
        )
        await bot.send_routed(ctx, msg, route_type="osint")

    @bot.command(name="checkbot", aliases=["проверить_бота"])
    async def checkbot_cmd(ctx, bot_id: int):
        try:
            target = await bot.fetch_user(bot_id)
            invite_link = f"https://discord.com/oauth2/authorize?client_id={bot_id}&scope=bot&permissions=8"
            msg = (
                f"🤖 **Информация о боте Discord:**\n"
                f"> • Имя: **{target.name}**\n"
                f"> • Бот: `{'Да' if target.bot else 'НЕТ (Это обычный юзер)'}`\n"
                f"> • Инвайт-ссылка с правами Администратора:\n{invite_link}"
            )
            await bot.send_routed(ctx, msg, route_type="osint")
        except Exception as e:
            await bot.send_routed(ctx, f"❌ Ошибка проверки бота: {e}", route_type="osint")

    @bot.command(name="nitrocheck", aliases=["нитро_чек", "проверить_нитро"])
    async def nitrocheck_cmd(ctx, user_id: int):
        try:
            user = await bot.fetch_user(user_id)
            has_anim_avatar = user.avatar and user.avatar.is_animated()
            has_banner = user.banner is not None
            nitro = has_anim_avatar or has_banner
            msg = (
                f"💎 **Nitro Аудит пользователя {user.name}:**\n"
                f"> • Анимированный аватар: `{'Да 🟢' if has_anim_avatar else 'Нет ⚪'}`\n"
                f"> • Кастомный баннер профиля: `{'Да 🟢' if has_banner else 'Нет ⚪'}`\n"
                f"> • Итоговый статус Nitro: `{'🔥 Активен (Nitro Booster / Nitro)' if nitro else '⚪ Скорее всего отсутствует'}`"
            )
            await bot.send_routed(ctx, msg, route_type="osint")
        except Exception as e:
            await bot.send_routed(ctx, f"❌ Ошибка: {e}", route_type="osint")

    @bot.command(name="idtime", aliases=["время_ид", "снежинка"])
    async def idtime_cmd(ctx, snowflake_id: int):
        try:
            timestamp = ((snowflake_id >> 22) + 1420070400000) / 1000
            dt = datetime.datetime.utcfromtimestamp(timestamp)
            await bot.send_routed(ctx, f"❄️ **Snowflake ID `{snowflake_id}` был создан:**\n> 📅 `{dt.strftime('%d.%m.%Y %H:%M:%S')}` UTC", route_type="osint")
        except Exception as e:
            await bot.send_routed(ctx, f"❌ Некорректный ID: {e}", route_type="osint")

    @bot.command(name="guildfetch", aliases=["инфо_сервера_ид", "сервер_ид"])
    async def guildfetch_cmd(ctx, guild_id: int):
        g = bot.get_guild(guild_id)
        if not g:
            await bot.send_routed(ctx, f"❌ Сервер с ID `{guild_id}` не найден в кэше бота.", route_type="osint")
            return
        msg = (
            f"🏰 **Информация о сервере {g.name}**\n"
            f"> • ID: `{g.id}`\n"
            f"> • Владелец: `{g.owner}` (ID: `{g.owner_id}`)\n"
            f"> • Участников: `{g.member_count}`\n"
            f"> • Каналов: `{len(g.channels)}` | Ролей: `{len(g.roles)}`\n"
            f"> • Уровень буста: `Уровень {g.premium_tier}` ({g.premium_subscription_count} бустов)"
        )
        await bot.send_routed(ctx, msg, route_type="osint")

    @bot.command(name="userinfo", aliases=["юзеринфо", "инфо"])
    async def userinfo_cmd(ctx, member: discord.Member = None):
        m = member or ctx.author
        created = m.created_at.strftime("%d.%m.%Y %H:%M")
        joined = m.joined_at.strftime("%d.%m.%Y %H:%M") if hasattr(m, "joined_at") and m.joined_at else "Неизвестно"
        roles = [r.name for r in m.roles if r.name != "@everyone"]
        msg = (
            f"👤 **Информация об участнике {m.name}:**\n"
            f"> • Никнейм: `{m.display_name}`\n"
            f"> • ID: `{m.id}`\n"
            f"> • Зарегистрирован: `{created}`\n"
            f"> • Присоединился: `{joined}`\n"
            f"> • Роли ({len(roles)}): `{', '.join(roles[:8]) if roles else 'Нет'}`"
        )
        await bot.send_routed(ctx, msg, route_type="osint")

    # 11-20: Серверный аудит и роли
    @bot.command(name="serverinfo", aliases=["серверинфо", "сервер"])
    async def serverinfo_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Команда доступна только на сервере.")
            return
        g = ctx.guild
        msg = (
            f"🏰 **Сводка о сервере {g.name}:**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"• 👑 Владелец: `{g.owner}`\n"
            f"• 🆔 ID сервера: `{g.id}`\n"
            f"• 👥 Участников: `{g.member_count}`\n"
            f"• 💬 Текстовых каналов: `{len(g.text_channels)}`\n"
            f"• 🔊 Голосовых каналов: `{len(g.voice_channels)}`\n"
            f"• 🏷️ Ролей: `{len(g.roles)}` | Эмодзи: `{len(g.emojis)}`\n"
            f"• 📅 Дата основания: `{g.created_at.strftime('%d.%m.%Y')}`"
        )
        await bot.send_routed(ctx, msg, route_type="osint")

    @bot.command(name="avatar", aliases=["аватарка", "ава"])
    async def avatar_cmd(ctx, user: discord.User = None):
        u = user or ctx.author
        if not u.avatar:
            await ctx.send(f"❌ У пользователя {u.name} нет кастомной аватарки.")
            return
        await ctx.send(f"🖼️ **Аватарка {u.name}:**\n{u.avatar.url}")

    @bot.command(name="roles", aliases=["список_ролей", "роли"])
    async def roles_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        r_list = [f"• {r.name} (`{len(r.members)} участников`)" for r in reversed(ctx.guild.roles[1:25])]
        await ctx.send(f"🏷️ **Роли сервера {ctx.guild.name}:**\n" + "\n".join(r_list))

    @bot.command(name="emojis", aliases=["список_эмодзи", "эмодзи"])
    async def emojis_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        em_list = [str(e) for e in ctx.guild.emojis[:50]]
        await ctx.send(f"😀 **Эмодзи сервера ({len(ctx.guild.emojis)} шт.):**\n" + " ".join(em_list))

    @bot.command(name="invites", aliases=["инвайты_сервера"])
    async def invites_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        try:
            invs = await ctx.guild.invites()
            res = [f"• `{i.code}` ➔ {i.url} (Использовано: {i.uses})" for i in invs[:5]]
            await bot.send_routed(ctx, f"🔗 **Приглашения сервера {ctx.guild.name}:**\n" + "\n".join(res), route_type="osint")
        except Exception:
            await bot.send_routed(ctx, "❌ Нет прав для просмотра инвайтов.", route_type="osint")

    @bot.command(name="auditbots", aliases=["список_ботов"])
    async def auditbots_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        bots = [f"• **{m.name}** (`{m.id}`)" for m in ctx.guild.members if m.bot]
        await bot.send_routed(ctx, f"🤖 **Боты на сервере ({len(bots)} шт.):**\n" + "\n".join(bots[:15]), route_type="osint")

    @bot.command(name="auditbans", aliases=["банлист"])
    async def auditbans_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        try:
            bans = [entry async for entry in ctx.guild.bans(limit=10)]
            res = [f"• `{b.user.name}` (`{b.user.id}`) — *{b.reason or 'Без причины'}*" for b in bans]
            await bot.send_routed(ctx, f"🔨 **Бан-лист сервера ({len(bans)}):**\n" + "\n".join(res), route_type="osint")
        except Exception:
            await bot.send_routed(ctx, "❌ Недостаточно прав для чтения бан-листа.", route_type="osint")

    @bot.command(name="whois", aliases=["кто_это"])
    async def whois_cmd(ctx, user_id: int):
        try:
            u = await bot.fetch_user(user_id)
            await bot.send_routed(ctx, f"🔎 **WHOIS:** `{u.name}` | ID: `{u.id}` | Bot: `{'Да' if u.bot else 'Нет'}` | Создан: `{u.created_at.strftime('%Y-%m-%d')}`", route_type="osint")
        except Exception as e:
            await bot.send_routed(ctx, f"❌ Ошибка WHOIS: {e}", route_type="osint")

    @bot.command(name="channelid", aliases=["ид_канала"])
    async def channelid_cmd(ctx):
        await ctx.send(f"🆔 **ID текущего канала:** `{ctx.channel.id}`")

    @bot.command(name="guildid", aliases=["ид_сервера"])
    async def guildid_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Команда доступна только на сервере.")
            return
        await ctx.send(f"🆔 **ID текущего сервера:** `{ctx.guild.id}`")

    # 21-25: Дополнительные инструменты проверки
    @bot.command(name="checkvoice", aliases=["голосовой_чек"])
    async def checkvoice_cmd(ctx, member: discord.Member = None):
        m = member or ctx.author
        if not m.voice:
            await ctx.send(f"🔇 {m.name} сейчас не находится в голосовом канале.")
            return
        await ctx.send(f"🔊 **{m.name} в канале:** `{m.voice.channel.name}` (ID: `{m.voice.channel.id}`)")

    @bot.command(name="rolemembers", aliases=["участники_роли"])
    async def rolemembers_cmd(ctx, role: discord.Role):
        members = [m.name for m in role.members[:20]]
        await ctx.send(f"🏷️ **Участники с ролью {role.name} ({len(role.members)}):**\n`{', '.join(members)}`")

    @bot.command(name="fetchcreated", aliases=["дата_создания_ид"])
    async def fetchcreated_cmd(ctx, user_id: int):
        try:
            u = await bot.fetch_user(user_id)
            await ctx.send(f"📅 Пользователь **{u.name}** зарегистрирован: `{u.created_at.strftime('%d.%m.%Y %H:%M:%S')}`")
        except Exception as e:
            await ctx.send(f"❌ Ошибка: {e}")

    @bot.command(name="serverage", aliases=["возраст_сервера"])
    async def serverage_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        days = (datetime.datetime.utcnow() - ctx.guild.created_at.replace(tzinfo=None)).days
        await ctx.send(f"🏰 Серверу **{ctx.guild.name}** уже **`{days}` дней**!")

    @bot.command(name="ownerinfo", aliases=["инфо_владельца"])
    async def ownerinfo_cmd(ctx):
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        await ctx.send(f"👑 Владелец сервера **{ctx.guild.name}**: `{ctx.guild.owner}` (ID: `{ctx.guild.owner_id}`)")
