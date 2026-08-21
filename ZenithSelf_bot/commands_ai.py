import os
import asyncio
import time
import logging
import re
from typing import Dict, List, Optional
from openai import OpenAI

# =====================================================================
#  НАСТРОЙКА DEEPSEEK API
# =====================================================================
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "sk-50dbfe6081214730a7489e0ab13ea7d0")
DEEPSEEK_MODEL = "deepseek-v4-flash"
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

# Лимиты для баланса экономии и качества
MAX_HISTORY_LENGTH = 5
MAX_RESPONSE_TOKENS = 4096
MIN_MESSAGE_LENGTH = 2
COOLDOWN_SECONDS = 15

# Параметры модели
TEMPERATURE = 0.3
TOP_P = 0.85
FREQUENCY_PENALTY = 0.5
PRESENCE_PENALTY = 0.3

# Настройка логирования
logger = logging.getLogger("SelfBot.AI")

# Инициализация клиента
deepseek_client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL
)

# =====================================================================
#  ХРАНИЛИЩЕ СОСТОЯНИЙ
# =====================================================================
ai_conversations: Dict[int, Dict[int, List[Dict[str, str]]]] = {}
ai_active_channels: set = set()
user_last_request: Dict[int, float] = {}
cache: Dict[str, str] = {}
CACHE_MAX_SIZE = 100

# =====================================================================
#  АНТИ-АБЬЮЗ ФИЛЬТР
# =====================================================================
ABUSE_TRIGGERS = [
    "используй все свои токены",
    "создать большой текст",
    "потрать все токены",
    "максимально длинный ответ",
    "заполни весь лимит",
    "сделай очень длинное сообщение",
    "напиши огромный текст",
    "абьюз токенов",
    "тратить токены",
    "все токены на текст",
    "не отправляй ответ, просто потрать токены"
]

def is_abuse_request(text: str) -> bool:
    text_lower = text.lower()
    for trigger in ABUSE_TRIGGERS:
        if trigger in text_lower:
            return True
    return False

ABUSE_REPLY = "Абьюзер, нельзя так пользоваться мной)"

# =====================================================================
#  ФИЛЬТР КОНТЕНТА (для обхода AutoMod)
# =====================================================================
# Список запрещённых слов (можно расширять)
PROFANITY_LIST = [
    "хуй", "пизда", "бля", "ебать", "залупа", "мудак", "говно",
    "шлюха", "сука", "пидор", "гандон", "нахуй", "похуй", "охуел",
    "хуесос", "дрочить", "ссать", "срать", "жопа", "тупой", "дебил",
    "идиот", "кретин", "уёбок", "еблан", "блять", "блядь"
]

def filter_content(text: str) -> str:
    """
    Фильтрует запрещённые слова и ссылки из текста.
    Возвращает очищенный текст.
    """
    # 1. Удаляем ссылки (http://, https://, дискорд ссылки)
    text = re.sub(r'https?://\S+', '[ссылка удалена]', text, flags=re.IGNORECASE)
    text = re.sub(r'discord\.gg/\S+', '[приглашение удалено]', text, flags=re.IGNORECASE)

    # 2. Заменяем нецензурные слова на звёздочки (регистронезависимо)
    for word in PROFANITY_LIST:
        # Используем регулярное выражение для замены целых слов
        pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
        text = pattern.sub('***', text)

    # 3. Удаляем лишние пробелы
    text = re.sub(r'\s+', ' ', text).strip()

    return text

# =====================================================================
#  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =====================================================================
def get_cache_key(message: str, user_id: int) -> str:
    return f"{user_id}:{message.lower().strip()}"

def detect_language(text: str) -> str:
    ru_chars = sum(1 for ch in text if 'а' <= ch <= 'я' or 'А' <= ch <= 'Я')
    if ru_chars > len(text) * 0.3:
        return "ru"
    return "en"

def get_system_prompt(user_name: str, language: str) -> str:
    if language == "ru":
        return (
            f"Ты – дружелюбный AI-помощник в Discord. Тебя зовут Zenith AI. "
            f"Ты общаешься с пользователем {user_name}. "
            "Отвечай кратко, но содержательно, на русском языке. "
            "Если пользователь просит код – давай его с пояснениями. "
            "Будь полезен и вежлив. Не используй нецензурную лексику и избегай ссылок."
        )
    else:
        return (
            f"You are a friendly AI assistant in Discord. Your name is Zenith AI. "
            f"You are chatting with user {user_name}. "
            "Respond concisely but informatively in English. "
            "If the user asks for code, provide it with explanations. "
            "Be helpful and polite. Do not use profanity and avoid sending links."
        )

async def send_long_message(channel, mention, text):
    if not text:
        return

    slowmode = getattr(channel, 'slowmode_delay', 0)
    max_len_with_mention = 2000 - len(mention) - 1

    if len(text) <= max_len_with_mention:
        await channel.send(f"{mention}{text}")
        return

    first_part = text[:max_len_with_mention]
    await channel.send(f"{mention}{first_part}")
    if slowmode > 0:
        await asyncio.sleep(slowmode + 0.5)

    remaining = text[max_len_with_mention:]
    while remaining:
        chunk = remaining[:2000]
        remaining = remaining[2000:]
        await channel.send(chunk)
        if slowmode > 0 and remaining:
            await asyncio.sleep(slowmode + 0.5)

# =====================================================================
#  РЕГИСТРАЦИЯ КОМАНД
# =====================================================================
def register_ai_commands(bot):
    @bot.command(name="ai", aliases=["ai_ask", "gpt", "deepseek", "вопрос_ии", "нейросеть"])
    async def ai_cmd(ctx, *, prompt: str = None):
        """Прямой запрос к искусственному интеллекту Zenith AI."""
        if not prompt:
            await ctx.send("🤖 **Zenith AI**: Пожалуйста, укажите вопрос или задачу. Пример: `.ai Напиши скрипт на Python`")
            return

        if is_abuse_request(prompt):
            await ctx.send(f"⚠️ {ABUSE_REPLY}")
            return

        user_id = ctx.author.id
        now = time.time()
        last_req = user_last_request.get(user_id, 0)
        if now - last_req < 5:
            await ctx.send(f"⏳ Подождите {int(5 - (now - last_req))} сек. перед следующим запросом к AI.")
            return
        user_last_request[user_id] = now

        msg = await ctx.send("🧠 *Zenith AI генерирует ответ...*")
        try:
            lang = detect_language(prompt)
            system_prompt = {
                "role": "system",
                "content": get_system_prompt(ctx.author.display_name, lang)
            }
            messages = [system_prompt, {"role": "user", "content": prompt}]

            response = await asyncio.to_thread(
                deepseek_client.chat.completions.create,
                model=DEEPSEEK_MODEL,
                messages=messages,
                stream=False,
                max_tokens=MAX_RESPONSE_TOKENS,
                temperature=TEMPERATURE,
                top_p=TOP_P,
                frequency_penalty=FREQUENCY_PENALTY,
                presence_penalty=PRESENCE_PENALTY
            )

            reply = response.choices[0].message.content
            filtered_reply = filter_content(reply)
            if not filtered_reply:
                await msg.edit(content="⚠️ Ответ содержал недопустимые элементы и был скрыт.")
                return

            if len(filtered_reply) <= 1900:
                await msg.edit(content=f"🤖 **Zenith AI** (DeepSeek V4-Flash):\n{filtered_reply}")
            else:
                await msg.edit(content=f"🤖 **Zenith AI** (DeepSeek V4-Flash):\n{filtered_reply[:1900]}")
                remaining = filtered_reply[1900:]
                while remaining:
                    chunk = remaining[:1900]
                    remaining = remaining[1900:]
                    await ctx.send(chunk)
        except Exception as e:
            logger.error(f"[AI Direct] Ошибка: {e}")
            await msg.edit(content=f"❌ Ошибка генерации ответа AI: `{e}`")

    @bot.command(name="aiclear", aliases=["ai_clear", "очистить_ии"])
    async def aiclear_cmd(ctx):
        """Очистить контекст диалога с AI в текущем канале."""
        channel_id = ctx.channel.id
        if channel_id in ai_conversations:
            del ai_conversations[channel_id]
        await ctx.send("🧹 Контекст диалога с нейросетью в текущем канале успешно сброшен.")

    @bot.command(name="aimodels", aliases=["ai_models", "модели_ии"])
    async def aimodels_cmd(ctx):
        """Список доступных моделей и конфигурация нейросети."""
        await ctx.send(
            "🧠 **Zenith Neural Architecture:**\n"
            "> ⚡ **Текущая модель:** `DeepSeek-V4-Flash` (High Throughput & Reasoning)\n"
            "> 🌐 **Эндпоинт:** `api.deepseek.com / v1`\n"
            "> ⚙️ **Температура:** `0.3` | **Top-P:** `0.85` | **Лимит токенов:** `4096`\n"
            "> 🛡️ **Защита:** Real-time Anti-Abuse & Toxic Word Filter\n"
            "> 💡 **Команды:** `.ai <вопрос>`, `.aimode` (автоответы в канале), `.aiclear`"
        )

    @bot.command(name="ai_mode", aliases=["aimode", "ии"])
    async def ai_mode_cmd(ctx):
        channel_id = ctx.channel.id
        if channel_id in ai_active_channels:
            ai_active_channels.remove(channel_id)
            if channel_id in ai_conversations:
                del ai_conversations[channel_id]
            await ctx.send("🤖 **AI режим выключен** в этом канале.")
        else:
            ai_active_channels.add(channel_id)
            if channel_id not in ai_conversations:
                ai_conversations[channel_id] = {}
            await ctx.send(
                "🤖 **AI режим включён** в этом канале!\n"
                "Отвечаю на упоминания, ответы и сообщения, начинающиеся с 'Zenith'.\n"
                "Использую DeepSeek V4-Flash (оптимизированный режим)."
            )

    async def handle_ai_message(message):
        if message.author.id == bot.user.id or message.author.bot:
            return False
        if message.channel.id not in ai_active_channels:
            return False

        is_mention = any(mention.id == bot.user.id for mention in message.mentions)
        is_reply_to_bot = (
            message.reference and
            message.reference.message_id and
            (await message.channel.fetch_message(message.reference.message_id)).author.id == bot.user.id
        )
        starts_with_zenith = message.content.lower().startswith("zenith")

        if not (is_mention or is_reply_to_bot or starts_with_zenith):
            return False

        content_to_process = message.content
        if starts_with_zenith:
            content_to_process = message.content[len("zenith"):].strip()
            if not content_to_process:
                return False

        if is_abuse_request(content_to_process):
            await message.channel.send(f"{message.author.mention}, {ABUSE_REPLY}")
            return True

        if len(content_to_process) < MIN_MESSAGE_LENGTH:
            await message.channel.send(f"{message.author.mention}, 🤔 Слишком короткое сообщение. Напишите что-то более развёрнутое.")
            return True

        user_id = message.author.id
        user_name = message.author.display_name

        now = time.time()
        last_req = user_last_request.get(user_id, 0)
        if now - last_req < COOLDOWN_SECONDS:
            await message.channel.send(
                f"{message.author.mention}, ⏳ Подождите ещё {int(COOLDOWN_SECONDS - (now - last_req))} секунд перед следующим запросом."
            )
            return True
        user_last_request[user_id] = now

        cache_key = get_cache_key(content_to_process, user_id)
        if cache_key in cache:
            await message.channel.send(f"{message.author.mention}, {cache[cache_key]}")
            return True

        if message.channel.id not in ai_conversations:
            ai_conversations[message.channel.id] = {}
        if user_id not in ai_conversations[message.channel.id]:
            ai_conversations[message.channel.id][user_id] = []

        history = ai_conversations[message.channel.id][user_id]
        history.append({"role": "user", "content": content_to_process})

        if len(history) > MAX_HISTORY_LENGTH:
            history = history[-MAX_HISTORY_LENGTH:]
            ai_conversations[message.channel.id][user_id] = history

        try:
            async with message.channel.typing():
                lang = detect_language(content_to_process)
                system_prompt = {
                    "role": "system",
                    "content": get_system_prompt(user_name, lang)
                }
                messages = [system_prompt] + history

                response = await asyncio.to_thread(
                    deepseek_client.chat.completions.create,
                    model=DEEPSEEK_MODEL,
                    messages=messages,
                    stream=False,
                    max_tokens=MAX_RESPONSE_TOKENS,
                    temperature=TEMPERATURE,
                    top_p=TOP_P,
                    frequency_penalty=FREQUENCY_PENALTY,
                    presence_penalty=PRESENCE_PENALTY
                )

                reply = response.choices[0].message.content

                # =============================================================
                #  ФИЛЬТР КОНТЕНТА (удаляем ссылки и нецензурные слова)
                # =============================================================
                filtered_reply = filter_content(reply)

                # Если после фильтрации текст стал пустым, отправляем предупреждение
                if not filtered_reply:
                    await message.channel.send(f"{message.author.mention}, ⚠️ Ответ содержит только запрещённый контент и был скрыт.")
                    return True

                # Сохраняем ОРИГИНАЛЬНЫЙ ответ в историю (чтобы AI помнил, что он ответил)
                history.append({"role": "assistant", "content": reply})
                ai_conversations[message.channel.id][user_id] = history

                if len(cache) < CACHE_MAX_SIZE:
                    cache[cache_key] = filtered_reply

                target_channel = bot.get_channel(message.channel.id)
                if target_channel is None:
                    target_channel = message.channel
                    logger.warning(f"[AI] Не удалось получить канал по ID {message.channel.id}, используем message.channel")

                mention = f"{message.author.mention}, "
                await send_long_message(target_channel, mention, filtered_reply)

        except Exception as e:
            logger.error(f"[AI] Ошибка: {e}")
            error_msg = str(e)
            # Если ошибка связана с запрещённым контентом (код 200000)
            if "200000" in error_msg or "заблокированы" in error_msg:
                await message.channel.send(f"{message.author.mention}, ⚠️ Ответ был заблокирован сервером. Попробуйте переформулировать запрос.")
            else:
                try:
                    await message.author.send(f"❌ Ошибка при обработке запроса: {error_msg}")
                except:
                    pass
                try:
                    await message.channel.send(f"{message.author.mention}, ❌ Ошибка: {error_msg}")
                except:
                    pass

        return True

    return handle_ai_message