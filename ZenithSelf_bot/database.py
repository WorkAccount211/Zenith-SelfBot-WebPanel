import asyncio
import datetime
import json
import logging
import os
import secrets
import shutil
import sqlite3
from typing import Optional, Dict, Any, List, Tuple
import aiosqlite

logger = logging.getLogger("SelfBot.Database")

class DatabaseManager:
    """Асинхронный менеджер SQLite базы данных (aiosqlite) в режиме WAL с авто-бэкапом и восстановлением."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.backup_path = f"{db_path}.backup"
        self._db: Optional[aiosqlite.Connection] = None

    async def connect(self):
        """Инициализация подключения с защитой от повреждения файла БД (self-healing & auto-restore SQLite)."""
        # Ensure parent directory exists
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

        try:
            self._db = await aiosqlite.connect(self.db_path)
            self._db.row_factory = aiosqlite.Row
            await self._db.execute("PRAGMA journal_mode = WAL;")
            await self._db.execute("PRAGMA foreign_keys = ON;")

            # Integrity check
            async with self._db.execute("PRAGMA integrity_check;") as cursor:
                row = await cursor.fetchone()
                if row and row[0] != "ok":
                    raise sqlite3.DatabaseError(f"Integrity check failed: {row[0]}")

            await self._create_tables()
            await self.create_backup()
            logger.info(f"🗄️ База данных SQLite успешно инициализирована: {self.db_path}")
        except (sqlite3.DatabaseError, aiosqlite.DatabaseError, Exception) as e:
            logger.warning(f"⚠️ Обнаружена проблема с файлом БД ({e}). Запуск автоматического восстановления...")
            if self._db:
                try:
                    await self._db.close()
                except Exception:
                    pass
                self._db = None

            # 1. Rename corrupted database file
            if os.path.exists(self.db_path):
                corrupted_bak = f"{self.db_path}.corrupted_{int(datetime.datetime.utcnow().timestamp())}.bak"
                try:
                    shutil.move(self.db_path, corrupted_bak)
                    logger.info(f"📦 Поврежденный файл сохранен как: {corrupted_bak}")
                except Exception as move_err:
                    logger.error(f"Не удалось переместить поврежденный файл: {move_err}")

            # 2. Clean WAL and SHM
            for ext in ["-wal", "-shm", ".wal", ".shm"]:
                wal_file = f"{self.db_path}{ext}"
                if os.path.exists(wal_file):
                    try:
                        os.remove(wal_file)
                    except Exception:
                        pass

            # 3. Restore from last successful backup if available
            restored_from_backup = False
            if os.path.exists(self.backup_path):
                try:
                    # Test backup integrity before restoring
                    test_conn = sqlite3.connect(self.backup_path)
                    test_cur = test_conn.cursor()
                    test_cur.execute("PRAGMA integrity_check;")
                    check_result = test_cur.fetchone()
                    test_conn.close()

                    if check_result and check_result[0] == "ok":
                        shutil.copy2(self.backup_path, self.db_path)
                        restored_from_backup = True
                        logger.info(f"🔄 База данных успешно восстановлена из последнего бэкапа: {self.backup_path}")
                except Exception as restore_err:
                    logger.warning(f"Не удалось восстановить из бэкапа ({restore_err}). Создается чистая база данных.")

            # 4. Connect to database (restored or brand new)
            self._db = await aiosqlite.connect(self.db_path)
            self._db.row_factory = aiosqlite.Row
            await self._db.execute("PRAGMA journal_mode = WAL;")
            await self._db.execute("PRAGMA foreign_keys = ON;")
            await self._create_tables()

            if not restored_from_backup:
                logger.info(f"✨ Новая чистая база данных SQLite успешно создана: {self.db_path}")

            await self.create_backup()

    async def create_backup(self):
        """Создание резервной копии базы данных."""
        if not self._db or not os.path.exists(self.db_path):
            return
        try:
            # Vacuum into backup or copy
            await self._db.commit()
            if os.path.exists(self.db_path):
                shutil.copy2(self.db_path, self.backup_path)
        except Exception as backup_err:
            logger.debug(f"Фоновый бэкап БД: {backup_err}")

    async def _create_tables(self):
        """Создание необходимых таблиц базы данных."""
        # 1. Предупреждения (Варны)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT DEFAULT 'User',
                moderator_id TEXT NOT NULL,
                moderator_name TEXT DEFAULT 'Moderator',
                reason TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Муты и таймауты
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS mutes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                muted_until TIMESTAMP NOT NULL,
                reason TEXT DEFAULT 'Нарушение правил',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, user_id)
            );
        """)

        # 3. Настройки каналов для серверов
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS channel_settings (
                guild_id TEXT PRIMARY KEY,
                output_channel_id TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 4. Кастомные команды
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS custom_commands (
                name TEXT PRIMARY KEY,
                response TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 5. OAuth2 / Bearer сессии веб-панели
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

        # 6. Игровой баланс и экономика
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS user_economy (
                user_id TEXT PRIMARY KEY,
                balance INTEGER DEFAULT 1000,
                bank INTEGER DEFAULT 0,
                last_daily TIMESTAMP,
                last_work TIMESTAMP,
                last_crime TIMESTAMP,
                last_rob TIMESTAMP,
                inventory TEXT DEFAULT '[]',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 7. Виртуальные питомцы (Тамагочи)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS user_pets (
                user_id TEXT PRIMARY KEY,
                name TEXT DEFAULT 'Питомец',
                pet_type TEXT DEFAULT '🐱 Котёнок',
                hunger INTEGER DEFAULT 80,
                energy INTEGER DEFAULT 90,
                happiness INTEGER DEFAULT 100,
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 8. Личные заметки
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS user_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 9. Напоминания (Таймеры)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS user_reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                remind_at TIMESTAMP NOT NULL,
                message TEXT NOT NULL,
                is_completed INTEGER DEFAULT 0
            );
        """)

        # 10. Инвентарь предметов
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS user_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                item_id TEXT NOT NULL,
                item_name TEXT NOT NULL,
                item_icon TEXT DEFAULT '📦',
                quantity INTEGER DEFAULT 1,
                UNIQUE(user_id, item_id)
            );
        """)

        # 11. AFK статус
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS afk_status (
                user_id TEXT PRIMARY KEY,
                reason TEXT NOT NULL,
                afk_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 12. Логи бота
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS bot_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                source TEXT DEFAULT 'bot',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 13. Кулдауны команд
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS command_cooldowns (
                user_id TEXT NOT NULL,
                command_name TEXT NOT NULL,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, command_name)
            );
        """)

        await self._db.commit()

    async def close(self):
        if self._db:
            await self.create_backup()
            await self._db.close()
            logger.info("🗄️ База данных закрыта.")

    # --- Предупреждения (Warnings) и Авто-мут на 4-й варн ---
    async def add_warning(self, guild_id: str, user_id: str, moderator_id: str, reason: str, user_name: str = "User", moderator_name: str = "Moderator") -> Tuple[int, int, bool]:
        """
        Выдача предупреждения с автоматическим 1-часовым мутом на 4-е предупреждение.
        Возвращает: (warn_id, total_warns, auto_muted)
        """
        cursor = await self._db.execute("""
            INSERT INTO warnings (guild_id, user_id, user_name, moderator_id, moderator_name, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(guild_id), str(user_id), user_name, str(moderator_id), moderator_name, reason))
        warn_id = cursor.lastrowid or 1

        async with self._db.execute("SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?", (str(guild_id), str(user_id))) as count_cursor:
            row = await count_cursor.fetchone()
            total_warns = row["count"] if row else 1

        auto_muted = False
        if total_warns >= 4:
            # 4-й варн -> автоматический 1-часовой мут в БД
            await self.mute_user(guild_id, user_id, 3600, f"Автоматический мут: достигнут лимит {total_warns}/4 предупреждений")
            auto_muted = True

        await self._db.commit()
        return warn_id, total_warns, auto_muted

    async def get_user_warnings(self, guild_id: str, user_id: str) -> List[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC", (str(guild_id), str(user_id))) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_warnings(self, guild_id: str, user_id: str) -> List[Dict[str, Any]]:
        return await self.get_user_warnings(guild_id, user_id)

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

    async def clear_warnings(self, guild_id: str, user_id: str) -> int:
        return await self.clear_user_warnings(guild_id, user_id)

    async def delete_warning_by_id(self, warn_id: int) -> bool:
        cursor = await self._db.execute("DELETE FROM warnings WHERE id = ?", (warn_id,))
        await self._db.commit()
        return cursor.rowcount > 0

    # --- Муты (Mutes & Timeouts) ---
    async def mute_user(self, guild_id: str, user_id: str, duration_seconds: int = 3600, reason: str = "Мут модератора") -> Dict[str, Any]:
        muted_until = datetime.datetime.utcnow() + datetime.timedelta(seconds=duration_seconds)
        muted_until_str = muted_until.isoformat()

        await self._db.execute("""
            INSERT INTO mutes (guild_id, user_id, muted_until, reason, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(guild_id, user_id) DO UPDATE SET muted_until = excluded.muted_until, reason = excluded.reason, created_at = CURRENT_TIMESTAMP;
        """, (str(guild_id), str(user_id), muted_until_str, reason))
        await self._db.commit()
        return {"guild_id": guild_id, "user_id": user_id, "muted_until": muted_until_str, "reason": reason}

    async def unmute_user(self, guild_id: str, user_id: str) -> bool:
        cursor = await self._db.execute("DELETE FROM mutes WHERE guild_id = ? AND user_id = ?", (str(guild_id), str(user_id)))
        await self._db.commit()
        return cursor.rowcount > 0

    async def is_user_muted(self, guild_id: str, user_id: str) -> Tuple[bool, Optional[str], Optional[str]]:
        async with self._db.execute("SELECT muted_until, reason FROM mutes WHERE guild_id = ? AND user_id = ?", (str(guild_id), str(user_id))) as cursor:
            row = await cursor.fetchone()
            if not row:
                return False, None, None
            try:
                until = datetime.datetime.fromisoformat(row["muted_until"])
                if datetime.datetime.utcnow() < until:
                    return True, row["reason"], row["muted_until"]
                else:
                    await self.unmute_user(guild_id, user_id)
                    return False, None, None
            except Exception:
                return False, None, None

    # --- Каналы вывода ---
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

    # --- Кастомные команды ---
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

    # --- Экономика и Игры ---
    async def get_balance(self, user_id: str) -> int:
        async with self._db.execute("SELECT balance FROM user_economy WHERE user_id = ?", (str(user_id),)) as cursor:
            row = await cursor.fetchone()
            if row:
                return int(row["balance"])
            await self._db.execute("INSERT OR IGNORE INTO user_economy (user_id, balance) VALUES (?, 1000)", (str(user_id),))
            await self._db.commit()
            return 1000

    async def modify_balance(self, user_id: str, amount: int) -> int:
        current = await self.get_balance(user_id)
        new_balance = max(0, current + amount)
        await self._db.execute("UPDATE user_economy SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?", (new_balance, str(user_id)))
        await self._db.commit()
        return new_balance

    async def check_cooldown(self, user_id: str, command_name: str, cooldown_seconds: int) -> Tuple[bool, int]:
        """Проверка кулдауна команды."""
        now = datetime.datetime.utcnow()
        async with self._db.execute("SELECT last_used FROM command_cooldowns WHERE user_id = ? AND command_name = ?", (str(user_id), command_name)) as cursor:
            row = await cursor.fetchone()
            if not row:
                await self._db.execute("""
                    INSERT INTO command_cooldowns (user_id, command_name, last_used)
                    VALUES (?, ?, ?)
                    ON CONFLICT(user_id, command_name) DO UPDATE SET last_used = excluded.last_used;
                """, (str(user_id), command_name, now.isoformat()))
                await self._db.commit()
                return True, 0

            try:
                last_used = datetime.datetime.fromisoformat(row["last_used"])
                elapsed = (now - last_used).total_seconds()
                if elapsed < cooldown_seconds:
                    remaining = int(cooldown_seconds - elapsed)
                    return False, remaining
                else:
                    await self._db.execute("UPDATE command_cooldowns SET last_used = ? WHERE user_id = ? AND command_name = ?", (now.isoformat(), str(user_id), command_name))
                    await self._db.commit()
                    return True, 0
            except Exception:
                return True, 0

    # --- AFK Статус ---
    async def set_afk(self, user_id: str, reason: str):
        await self._db.execute("""
            INSERT INTO afk_status (user_id, reason, afk_since)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET reason = excluded.reason, afk_since = CURRENT_TIMESTAMP;
        """, (str(user_id), reason))
        await self._db.commit()

    async def remove_afk(self, user_id: str) -> bool:
        cursor = await self._db.execute("DELETE FROM afk_status WHERE user_id = ?", (str(user_id),))
        await self._db.commit()
        return cursor.rowcount > 0

    async def get_afk(self, user_id: str) -> Optional[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM afk_status WHERE user_id = ?", (str(user_id),)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

    # --- Логи ---
    async def log_event(self, level: str, message: str, source: str = "bot"):
        try:
            await self._db.execute("""
                INSERT INTO bot_logs (level, message, source, created_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """, (level, message, source))
            await self._db.commit()
        except Exception:
            pass

    async def get_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM bot_logs ORDER BY id DESC LIMIT ?", (limit,)) as cursor:
            rows = await cursor.fetchall()
            return [{"id": f"log-{r['id']}", "timestamp": str(r["created_at"]), "level": r["level"], "message": r["message"], "source": r["source"]} for r in rows]

    async def clear_logs(self) -> bool:
        await self._db.execute("DELETE FROM bot_logs")
        await self._db.commit()
        return True

    # --- Сессии авторизации (Auth Sessions) ---
    async def create_session(self, username: str, client_ip: str = "127.0.0.1", expire_hours: int = 24) -> Dict[str, Any]:
        access_token = secrets.token_urlsafe(32)
        refresh_token = secrets.token_urlsafe(48)
        expires_at = (datetime.datetime.utcnow() + datetime.timedelta(hours=expire_hours)).isoformat()
        await self._db.execute("""
            INSERT INTO auth_sessions (access_token, refresh_token, username, client_ip, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (access_token, refresh_token, username, client_ip, expires_at))
        await self._db.commit()
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "username": username,
            "expires_at": expires_at
        }

    async def validate_session(self, access_token: str) -> Optional[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM auth_sessions WHERE access_token = ?", (access_token,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            try:
                expires_at = datetime.datetime.fromisoformat(row["expires_at"])
                if datetime.datetime.utcnow() < expires_at:
                    return dict(row)
                else:
                    await self._db.execute("DELETE FROM auth_sessions WHERE access_token = ?", (access_token,))
                    await self._db.commit()
                    return None
            except Exception:
                return None

    async def refresh_session(self, refresh_token: str, expire_hours: int = 24) -> Optional[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM auth_sessions WHERE refresh_token = ?", (refresh_token,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            new_access_token = secrets.token_urlsafe(32)
            new_refresh_token = secrets.token_urlsafe(48)
            expires_at = (datetime.datetime.utcnow() + datetime.timedelta(hours=expire_hours)).isoformat()
            await self._db.execute("""
                UPDATE auth_sessions
                SET access_token = ?, refresh_token = ?, expires_at = ?
                WHERE refresh_token = ?
            """, (new_access_token, new_refresh_token, expires_at, refresh_token))
            await self._db.commit()
            return {
                "access_token": new_access_token,
                "refresh_token": new_refresh_token,
                "username": row["username"],
                "expires_at": expires_at
            }

    async def get_custom_commands(self) -> List[Dict[str, Any]]:
        return await self.get_all_custom_commands()

    # --- Заметки (Notes) ---
    async def add_note(self, user_id: str, title: str, content: str) -> int:
        cursor = await self._db.execute("INSERT INTO user_notes (user_id, title, content) VALUES (?, ?, ?)", (str(user_id), title, content))
        await self._db.commit()
        return cursor.lastrowid or 1

    async def get_notes(self, user_id: str) -> List[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM user_notes WHERE user_id = ? ORDER BY id DESC", (str(user_id),)) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def delete_note(self, user_id: str, note_id: int) -> bool:
        cursor = await self._db.execute("DELETE FROM user_notes WHERE user_id = ? AND id = ?", (str(user_id), note_id))
        await self._db.commit()
        return cursor.rowcount > 0

    # --- Инвентарь и Предметы ---
    async def add_item(self, user_id: str, item_id: str, item_name: str, item_icon: str = "📦", quantity: int = 1):
        await self._db.execute("""
            INSERT INTO user_inventory (user_id, item_id, item_name, item_icon, quantity)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + excluded.quantity;
        """, (str(user_id), item_id, item_name, item_icon, quantity))
        await self._db.commit()

    async def get_inventory(self, user_id: str) -> List[Dict[str, Any]]:
        async with self._db.execute("SELECT * FROM user_inventory WHERE user_id = ? AND quantity > 0", (str(user_id),)) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    # --- Тамагочи / Питомцы ---
    async def get_pet(self, user_id: str) -> Dict[str, Any]:
        async with self._db.execute("SELECT * FROM user_pets WHERE user_id = ?", (str(user_id),)) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            await self._db.execute("INSERT OR IGNORE INTO user_pets (user_id) VALUES (?)", (str(user_id),))
            await self._db.commit()
            return {"user_id": str(user_id), "name": "Питомец", "pet_type": "🐱 Котёнок", "hunger": 80, "energy": 90, "happiness": 100, "level": 1, "exp": 0}

    async def update_pet(self, user_id: str, **kwargs):
        fields = []
        values = []
        for k, v in kwargs.items():
            fields.append(f"{k} = ?")
            values.append(v)
        values.append(str(user_id))
        query = f"UPDATE user_pets SET {', '.join(fields)}, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?"
        await self._db.execute(query, tuple(values))
        await self._db.commit()
