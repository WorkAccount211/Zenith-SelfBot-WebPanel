import asyncio
import datetime
from discord.ext import commands
import discord

def register_moderation_commands(bot):
    """Регистрация 20+ команд модерации и продвинутой системы предупреждений (warn/mute/kick/ban)."""

    # 1-10: Предупреждения и Модерация участников
    @bot.command(name="warn", aliases=["варн", "предупредить"])
    async def warn_cmd(ctx, target: discord.User, *, reason: str = "Нарушение правил"):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Команда доступна только на сервере.")
            return

        guild_id = str(ctx.guild.id)
        user_id = str(target.id)
        mod_id = str(ctx.author.id)

        warn_id, warn_count, auto_muted = await bot.db.add_warning(
            guild_id=guild_id,
            user_id=user_id,
            moderator_id=mod_id,
            reason=reason,
            user_name=target.name,
            moderator_name=ctx.author.name
        )

        msg = (
            f"⚠️ **Предупреждение выдано:** {target.mention}\n"
            f"> 🆔 ID варна: `#{warn_id}`\n"
            f"> 📌 Причина: *{reason}*\n"
            f"> 📊 Текущие варны: `{warn_count}/4`"
        )

        if auto_muted or warn_count >= 4:
            msg += "\n\n🚨 **ДОСТИГНУТ ЛИМИТ 4/4 ПРЕДУПРЕЖДЕНИЙ!**"
            member = ctx.guild.get_member(target.id)
            if member:
                try:
                    mute_duration = datetime.timedelta(hours=1)
                    await member.timeout(mute_duration, reason="Превышение 4 предупреждений (Авто-мут на 1 час)")
                    msg += "\n🔇 Пользователю выдан **Тайм-аут (Мут) на 1 час** в Discord!"
                except Exception as ex:
                    msg += f"\n*(Мут активирован в базе данных; ошибка Discord timeout: {ex})*"
            else:
                msg += "\n🔇 Авто-мут на 1 час зафиксирован в базе данных."

        await bot.send_routed(ctx, msg, route_type="moderation")

    @bot.command(name="warns", aliases=["варны", "список_варнов"])
    async def warns_cmd(ctx, target: discord.User = None):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Команда доступна только на сервере.")
            return

        u = target or ctx.author
        warns = await bot.db.get_warnings(str(ctx.guild.id), str(u.id))
        is_muted, mute_reason, mute_until = await bot.db.is_user_muted(str(ctx.guild.id), str(u.id))

        if not warns:
            mute_status = f"\n🔇 **Статус:** В муте до `{mute_until}` (*{mute_reason}*)" if is_muted else ""
            await ctx.send(f"🛡️ У пользователя {u.name} нет активных предупреждений (0/4).{mute_status}")
            return

        lines = [f"📋 **Предупреждения {u.name} (`{len(warns)}/4`):**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
        for w in warns:
            lines.append(f"• ID `#{w['id']}` [{w['created_at'][:16]}]: *{w['reason']}* (Модератор: <@{w['moderator_id']}>)")

        if is_muted:
            lines.append(f"\n🔇 **Активный мут:** до `{mute_until}` | Причина: *{mute_reason}*")

        await bot.send_routed(ctx, "\n".join(lines), route_type="moderation")

    @bot.command(name="clearwarns", aliases=["очистить_варны", "снять_все_варны"])
    async def clearwarns_cmd(ctx, target: discord.User):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        count = await bot.db.clear_warnings(str(ctx.guild.id), str(target.id))
        await bot.db.unmute_user(str(ctx.guild.id), str(target.id))
        await bot.send_routed(ctx, f"✅ С пользователя {target.mention} сняты все предупреждения (`{count}` шт.) и аннулирован статус мута.", route_type="moderation")

    @bot.command(name="delwarn", aliases=["удалить_варн", "снять_варн"])
    async def delwarn_cmd(ctx, warn_id: int):
        await bot.handle_slowmode(ctx.channel)
        ok = await bot.db.delete_warning_by_id(warn_id)
        if ok:
            await ctx.send(f"✅ Предупреждение `#{warn_id}` успешно аннулировано.")
        else:
            await ctx.send(f"❌ Варн `#{warn_id}` не найден.")

    @bot.command(name="kick", aliases=["кик", "выгнать"])
    async def kick_cmd(ctx, member: discord.Member, *, reason: str = "Исключен модератором"):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        if not ctx.author.guild_permissions.kick_members and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на исключение участников (Kick Members).")
            return
        try:
            await member.kick(reason=reason)
            await bot.db.log_event("WARN", f"Пользователь {member.name} ({member.id}) исключен. Причина: {reason}", "moderation")
            await bot.send_routed(ctx, f"👢 **Участник {member.name} исключен с сервера!**\n> Причина: *{reason}*", route_type="moderation")
        except discord.Forbidden:
            await ctx.send("❌ Ошибка 403: недостаточно прав для исключения (проверьте права бота).")
        except Exception as e:
            await ctx.send(f"❌ Ошибка исключения участника: {e}")

    @bot.command(name="ban", aliases=["бан", "забанить"])
    async def ban_cmd(ctx, user: discord.User, *, reason: str = "Заблокирован модератором"):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        if not ctx.author.guild_permissions.ban_members and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на блокировку участников (Ban Members).")
            return
        try:
            await ctx.guild.ban(user, reason=reason)
            await bot.db.log_event("WARN", f"Пользователь {user.name} ({user.id}) забанен. Причина: {reason}", "moderation")
            await bot.send_routed(ctx, f"🔨 **Пользователь {user.name} успешно заблокирован!**\n> Причина: *{reason}*", route_type="moderation")
        except discord.Forbidden:
            await ctx.send("❌ Ошибка 403: недостаточно прав для блокировки (проверьте права бота).")
        except Exception as e:
            await ctx.send(f"❌ Ошибка блокировки: {e}")

    @bot.command(name="unban", aliases=["унбан", "разбанить"])
    async def unban_cmd(ctx, user_id: int):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        if not ctx.author.guild_permissions.ban_members and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на разблокировку (Ban Members).")
            return
        try:
            user = await bot.fetch_user(user_id)
            await ctx.guild.unban(user)
            await bot.db.log_event("INFO", f"Пользователь {user.name} ({user_id}) разбанен", "moderation")
            await bot.send_routed(ctx, f"🕊️ **Пользователь {user.name} (`{user_id}`) успешно разблокирован!**", route_type="moderation")
        except discord.NotFound:
            await ctx.send("❌ Пользователь с таким ID не найден в бан-листе.")
        except discord.Forbidden:
            await ctx.send("❌ Ошибка 403: недостаточно прав для разблокировки (проверьте права бота).")
        except Exception as e:
            await ctx.send(f"❌ Ошибка разблокировки: {e}")

    # --- Исправленная команда mute (с поддержкой бесконечного мута и надежным fallback) ---
    @bot.command(name="mute", aliases=["мут", "таймаут", "timeout"])
    async def mute_cmd(ctx, member: discord.Member, duration: str = "60", *, reason: str = "Нарушение порядка"):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return

        # Парсинг длительности
        is_infinite = False
        minutes = 60
        clean_dur = duration.lower().strip()

        if clean_dur in ("0", "inf", "infinity", "бесконечно", "бесконечный", "perm", "permanent", "навсегда", "forever"):
            is_infinite = True
        else:
            try:
                if clean_dur.endswith("d") or clean_dur.endswith("д"):
                    minutes = int(clean_dur[:-1]) * 1440
                elif clean_dur.endswith("h") or clean_dur.endswith("ч"):
                    minutes = int(clean_dur[:-1]) * 60
                elif clean_dur.endswith("m") or clean_dur.endswith("м"):
                    minutes = int(clean_dur[:-1])
                elif clean_dur.endswith("s") or clean_dur.endswith("с"):
                    minutes = max(1, int(clean_dur[:-1]) // 60)
                else:
                    minutes = int(clean_dur)
            except ValueError:
                # Если вторым аргументом сразу шла причина (например .mute @user спам)
                reason = f"{duration} {reason}".strip()
                minutes = 60

        # Если запрошено больше 28 дней (40320 мин) или 0 — переводим в бесконечный мут (Muted Role)
        if minutes <= 0 or minutes >= 40320:
            is_infinite = True

        # Выполнение бесконечного мута
        if is_infinite:
            muted_role = discord.utils.get(ctx.guild.roles, name="Muted")
            if muted_role is None:
                if ctx.guild.me.guild_permissions.manage_roles:
                    try:
                        muted_role = await ctx.guild.create_role(
                            name="Muted",
                            permissions=discord.Permissions.none(),
                            reason="Создание роли Muted для бесконечного мута"
                        )
                        for ch in ctx.guild.channels:
                            try:
                                await ch.set_permissions(muted_role, send_messages=False, add_reactions=False, speak=False, connect=False)
                            except Exception:
                                pass
                    except Exception:
                        muted_role = None

            applied = False
            if muted_role:
                try:
                    await member.add_roles(muted_role, reason=reason)
                    applied = True
                except Exception:
                    pass

            # Также блокируем отправку в текущем канале через оверрайт, если роль не удалась
            if not applied:
                try:
                    await ctx.channel.set_permissions(member, send_messages=False, reason=reason)
                    applied = True
                except Exception:
                    pass

            await bot.db.mute_user(str(ctx.guild.id), str(member.id), 0, reason)
            await bot.db.log_event("WARN", f"Пользователь {member.name} получил бесконечный мут. Причина: {reason}", "moderation")
            await bot.send_routed(ctx, f"🔇 **{member.name} отправлен в БЕСКОНЕЧНЫЙ мут.**\n> Причина: *{reason}*\n> Метод: `Роль Muted / Ограничение прав канала`", route_type="moderation")
            return

        # Обычный тайм-аут с защитой от ошибок
        try:
            # Ограничение Discord API: от 1 до 40319 минут
            valid_minutes = min(max(1, minutes), 40319)
            dur = datetime.timedelta(minutes=valid_minutes)
            await member.timeout(dur, reason=reason)
            await bot.db.mute_user(str(ctx.guild.id), str(member.id), valid_minutes * 60, reason)
            await bot.db.log_event("WARN", f"Пользователь {member.name} отправлен в мут на {valid_minutes}м. Причина: {reason}", "moderation")
            await bot.send_routed(ctx, f"🔇 **{member.name} отправлен в мут на {valid_minutes} мин.**\n> Причина: *{reason}*", route_type="moderation")
        except discord.Forbidden:
            # Если нет прав на Timeout, пробуем через роль Muted
            muted_role = discord.utils.get(ctx.guild.roles, name="Muted")
            if muted_role:
                try:
                    await member.add_roles(muted_role, reason=reason)
                    await bot.db.mute_user(str(ctx.guild.id), str(member.id), minutes * 60, reason)
                    await bot.send_routed(ctx, f"🔇 **{member.name} отправлен в мут на {minutes} мин.** *(через роль Muted)*\n> Причина: *{reason}*", route_type="moderation")
                    return
                except Exception:
                    pass
            await ctx.send("❌ Недостаточно прав для наложения тайм-аута (требуется право «Moderate Members / Отстранение участников»).")
        except discord.HTTPException as e:
            # Fallback на базу данных и роль
            await bot.db.mute_user(str(ctx.guild.id), str(member.id), minutes * 60, reason)
            await ctx.send(f"⚠️ Discord Timeout вернул ошибку ({e.code}), мут зафиксирован в локальной системе модерации.")
        except Exception as e:
            await ctx.send(f"❌ Ошибка установки мута: {e}")

    @bot.command(name="unmute", aliases=["размут", "снять_таймаут"])
    async def unmute_cmd(ctx, member: discord.Member):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return

        unmuted_actions = []
        # 1. Снимаем тайм-аут
        try:
            await member.timeout(None)
            unmuted_actions.append("Discord Timeout")
        except Exception:
            pass

        # 2. Убираем роль Muted (если есть)
        muted_role = discord.utils.get(ctx.guild.roles, name="Muted")
        if muted_role and muted_role in member.roles:
            try:
                await member.remove_roles(muted_role, reason="Снятие мута")
                unmuted_actions.append("Роль Muted")
            except Exception:
                pass

        # 3. Снимаем индивидуальные оверрайты канала
        try:
            current_ow = ctx.channel.overwrites_for(member)
            if current_ow.send_messages is False:
                current_ow.send_messages = None
                await ctx.channel.set_permissions(member, overwrite=current_ow if not current_ow.is_empty() else None)
                unmuted_actions.append("Права канала")
        except Exception:
            pass

        await bot.db.unmute_user(str(ctx.guild.id), str(member.id))
        await bot.db.log_event("INFO", f"С пользователя {member.name} снят мут", "moderation")
        actions_str = f" ({', '.join(unmuted_actions)})" if unmuted_actions else ""
        await bot.send_routed(ctx, f"🔊 **Мут с {member.name} успешно снят!**{actions_str}", route_type="moderation")

    @bot.command(name="purge", aliases=["очистить", "клир", "clear"])
    async def purge_cmd(ctx, limit: int = 10):
        try:
            await ctx.message.delete()
        except Exception:
            pass
        deleted = 0
        async for m in ctx.channel.history(limit=limit):
            if m.author.id == bot.user.id:
                try:
                    await m.delete()
                    deleted += 1
                    await asyncio.sleep(0.3)
                except Exception:
                    pass
        res = await ctx.send(f"🧹 Очищено `{deleted}` собственных сообщений.")
        await asyncio.sleep(2)
        try:
            await res.delete()
        except Exception:
            pass

    # --- Исправленные команды slowmode, lock, unlock, clearslowmode / unslowmode ---
    @bot.command(name="slowmode", aliases=["слоумод", "медленный_режим"])
    async def slowmode_cmd(ctx, mode: str = "0"):
        await bot.handle_slowmode(ctx.channel)
        
        # Обработка выключения
        clean_mode = mode.lower().strip()
        if clean_mode in ("0", "off", "disable", "reset", "none", "clear", "снять", "выкл", "откл"):
            seconds = 0
        else:
            try:
                if clean_mode.endswith("h") or clean_mode.endswith("ч"):
                    seconds = int(clean_mode[:-1]) * 3600
                elif clean_mode.endswith("m") or clean_mode.endswith("м"):
                    seconds = int(clean_mode[:-1]) * 60
                elif clean_mode.endswith("s") or clean_mode.endswith("с"):
                    seconds = int(clean_mode[:-1])
                else:
                    seconds = int(clean_mode)
            except ValueError:
                await ctx.send("❌ Укажите количество секунд (0-21600) или `off` для отключения.")
                return

        if seconds < 0 or seconds > 21600:
            await ctx.send("❌ Значение должно быть от 0 до 21600 секунд (6 часов).")
            return

        try:
            await ctx.channel.edit(slowmode_delay=seconds)
            if seconds == 0:
                await ctx.send("⏳ Медленный режим канала **отключён**.")
            else:
                await ctx.send(f"⏳ Медленный режим канала установлен на **`{seconds}` сек.**")
        except discord.Forbidden:
            await ctx.send("❌ У бота нет прав на изменение настроек канала (Manage Channels).")
        except Exception as e:
            await ctx.send(f"❌ Ошибка: {e}")

    @bot.command(name="clearslowmode", aliases=["снять_слоумод", "отключить_слоумод", "unslowmode", "noslowmode", "slowmodeoff"])
    async def clearslowmode_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        try:
            await ctx.channel.edit(slowmode_delay=0)
            await ctx.send("⏳ Медленный режим канала **отключён**.")
        except discord.Forbidden:
            await ctx.send("❌ У бота нет прав на изменение настроек канала (Manage Channels).")
        except Exception as e:
            await ctx.send(f"❌ Ошибка: {e}")

    @bot.command(name="lock", aliases=["заблокировать_чат"])
    async def lock_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        if not ctx.author.guild_permissions.manage_channels and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на управление каналами.")
            return
        try:
            channel = ctx.channel
            # Сохраняем текущие оверрайты для @everyone перед блокировкой
            current_overwrite = channel.overwrites_for(ctx.guild.default_role)
            if not hasattr(bot, 'locked_overwrites'):
                bot.locked_overwrites = {}
            
            # Копируем текущий оверрайт в память
            bot.locked_overwrites[channel.id] = discord.PermissionOverwrite.from_pair(
                *current_overwrite.pair()
            ) if hasattr(current_overwrite, 'pair') else current_overwrite

            # Применяем запрет на отправку сообщений
            new_overwrite = channel.overwrites_for(ctx.guild.default_role)
            new_overwrite.send_messages = False
            await channel.set_permissions(ctx.guild.default_role, overwrite=new_overwrite)
            await ctx.send("🔒 **Канал заблокирован для отправки сообщений.**")
        except discord.Forbidden:
            await ctx.send("❌ У бота нет прав на изменение разрешений канала.")
        except Exception as e:
            await ctx.send(f"❌ Ошибка: {e}")

    @bot.command(name="unlock", aliases=["разблокировать_чат"])
    async def unlock_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        if not ctx.author.guild_permissions.manage_channels and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на управление каналами.")
            return
        try:
            channel = ctx.channel
            if not hasattr(bot, 'locked_overwrites'):
                bot.locked_overwrites = {}
            
            saved_ow = bot.locked_overwrites.pop(channel.id, None)
            if saved_ow is not None:
                # Восстанавливаем в точности те настройки, которые были до .lock
                await channel.set_permissions(ctx.guild.default_role, overwrite=saved_ow)
            else:
                # Если сохранённых прав не было, сбрасываем send_messages в исходное (None)
                curr = channel.overwrites_for(ctx.guild.default_role)
                curr.send_messages = None
                await channel.set_permissions(ctx.guild.default_role, overwrite=curr if not curr.is_empty() else None)
            await ctx.send("🔓 **Канал разблокирован (исходные права доступа восстановлены).**")
        except discord.Forbidden:
            await ctx.send("❌ У бота нет прав на изменение разрешений канала.")
        except Exception as e:
            await ctx.send(f"❌ Ошибка: {e}")

    # --- Команды для работы с ролями ---
    @bot.command(name="addrole", aliases=["выдать_роль"])
    async def addrole_cmd(ctx, member: discord.Member, role: discord.Role):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.author.guild_permissions.manage_roles and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на управление ролями.")
            return
        try:
            await member.add_roles(role)
            await ctx.send(f"✅ Роль **{role.name}** выдана пользователю {member.mention}.")
        except discord.Forbidden:
            await ctx.send("❌ У бота нет прав на выдачу этой роли.")
        except Exception as e:
            await ctx.send(f"❌ Ошибка выдачи роли: {e}")

    @bot.command(name="removerole", aliases=["снять_роль"])
    async def removerole_cmd(ctx, member: discord.Member, role: discord.Role):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.author.guild_permissions.manage_roles and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на управление ролями.")
            return
        try:
            await member.remove_roles(role)
            await ctx.send(f"✅ Роль **{role.name}** снята с пользователя {member.mention}.")
        except discord.Forbidden:
            await ctx.send("❌ У бота нет прав на снятие этой роли.")
        except Exception as e:
            await ctx.send(f"❌ Ошибка снятия роли: {e}")

    # --- Команда для изменения ника самого пользователя (не бота) ---
    @bot.command(name="mynick", aliases=["сменить_мой_ник"])
    async def mynick_cmd(ctx, *, new_nick: str):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        if len(new_nick) > 32:
            await ctx.send("❌ Никнейм не может быть длиннее 32 символов.")
            return
        if not ctx.author.guild_permissions.manage_nicknames and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на изменение никнейма.")
            return
        try:
            await ctx.author.edit(nick=new_nick)
            await ctx.send(f"✅ Ваш никнейм изменён на **{new_nick}**.")
        except discord.Forbidden:
            await ctx.send("❌ У бота нет прав на изменение вашего ника (проверьте, что бот имеет право управлять никнеймами).")
        except Exception as e:
            await ctx.send(f"❌ Ошибка смены ника: {e}")

    # --- Остальные команды (setoutput, purgewords, modlogs, massrole) ---
    @bot.command(name="setoutput", aliases=["канал_вывода", "вывод"])
    async def setoutput_cmd(ctx, channel: discord.TextChannel):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        if not ctx.author.guild_permissions.manage_guild and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на изменение настроек сервера.")
            return
        await bot.db.set_output_channel(str(ctx.guild.id), str(channel.id))
        await ctx.send(f"🎯 Канал вывода результатов для сервера настроен на: {channel.mention} (`{channel.id}`)")

    @bot.command(name="purgewords", aliases=["очистить_слово"])
    async def purgewords_cmd(ctx, word: str, limit: int = 15):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.author.guild_permissions.manage_messages and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на удаление сообщений.")
            return
        deleted = 0
        async for m in ctx.channel.history(limit=limit):
            if m.author.id == bot.user.id and word.lower() in m.content.lower():
                try:
                    await m.delete()
                    deleted += 1
                except Exception:
                    pass
        await ctx.send(f"🧹 Удалено `{deleted}` сообщений, содержащих слово «{word}».")

    @bot.command(name="modlogs", aliases=["лог_модерации"])
    async def modlogs_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.guild:
            await ctx.send("❌ Доступно только на сервере.")
            return
        logs = await bot.db.get_logs(limit=5)
        lines = ["🛡️ **Журнал событий модерации:**"]
        for l in logs:
            lines.append(f"• `[{l['timestamp'][:16]}]` [{l['level']}] {l['message']}")
        await ctx.send("\n".join(lines))

    @bot.command(name="massrole", aliases=["массовая_роль"])
    async def massrole_cmd(ctx, role: discord.Role):
        await bot.handle_slowmode(ctx.channel)
        if not ctx.author.guild_permissions.manage_roles and not ctx.author.guild_permissions.administrator:
            await ctx.send("❌ У вас нет прав на управление ролями.")
            return
        await ctx.send(f"⏳ Начинаю присвоение роли **{role.name}**...")
        count = 0
        for member in ctx.guild.members:
            if member != ctx.guild.me and not member.bot:
                try:
                    await member.add_roles(role)
                    count += 1
                    await asyncio.sleep(0.2)
                except:
                    pass
        await ctx.send(f"✅ Роль **{role.name}** выдана {count} участникам.")