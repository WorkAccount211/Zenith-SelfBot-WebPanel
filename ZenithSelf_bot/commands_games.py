import asyncio
import datetime
import random
from discord.ext import commands
import discord

def register_games_commands(bot):
    """Регистрация 50+ игровых, азартных и RPG команд (всегда вывод в текущий чат)."""

    SHOP_ITEMS = {
        "sword": {"name": "Плазменный клинок", "icon": "⚔️", "price": 500, "desc": "+25% к урону в дуэлях"},
        "rod": {"name": "Титановая удочка", "icon": "🎣", "price": 350, "desc": "Шанс поймать легендарную рыбу"},
        "potion": {"name": "Зелье энергии", "icon": "🧪", "price": 150, "desc": "Восстанавливает статы питомца"},
        "crown": {"name": "Корона Zenith VIP", "icon": "👑", "price": 5000, "desc": "Престижный артефакт инвентаря"},
        "pickaxe": {"name": "Лазерная кирка", "icon": "⛏️", "price": 800, "desc": "Удваивает добычу в шахте"},
        "shield": {"name": "Кибер-щит", "icon": "🛡️", "price": 600, "desc": "Защита от 1 кражи"},
        "ring": {"name": "Кольцо фортуны", "icon": "💍", "price": 1200, "desc": "+10% к шансу выигрыша в казино"},
        "drone": {"name": "Дрон-разведчик", "icon": "🛸", "price": 1500, "desc": "Автоматический сбор ресурсов"},
        "medkit": {"name": "Кибер-аптечка", "icon": "🩹", "price": 200, "desc": "Мгновенное лечение в боях"}
    }

    # 1-10: Экономика, Баланс и Заработок
    @bot.command(name="balance", aliases=["баланс", "деньги", "bal", "кошелек"])
    async def balance_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        bal = await bot.db.get_balance(str(ctx.author.id))
        await ctx.send(f"💳 **Баланс {ctx.author.name}:** `💎 {bal}` монет")

    @bot.command(name="daily", aliases=["дейли", "бонус"])
    async def daily_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        ready, remaining = await bot.db.check_cooldown(user_id, "daily", 86400)
        if not ready:
            hours, rem = divmod(remaining, 3600)
            await ctx.send(f"⏳ **Ежедневный бонус уже получен!** Ждите `{hours}ч {rem // 60}м`.")
            return
        reward = random.randint(300, 700)
        new_bal = await bot.db.modify_balance(user_id, reward)
        await ctx.send(f"🎁 **Ежедневный бонус:** `+💎 {reward}` монет! Баланс: `💎 {new_bal}`")

    @bot.command(name="work", aliases=["работать", "работа", "job"])
    async def work_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        ready, remaining = await bot.db.check_cooldown(user_id, "work", 3600)
        if not ready:
            await ctx.send(f"💼 Отдохните еще `{remaining // 60}м {remaining % 60}с`.")
            return
        jobs = [
            ("💻 Fullstack Разработчик", random.randint(200, 450)),
            ("☕ Бариста в Cyberpunk кафе", random.randint(120, 250)),
            ("🛡️ Аналитик кибербезопасности", random.randint(250, 500)),
            ("🚚 Пилот дрона доставки", random.randint(150, 300)),
            ("🎨 UI/UX Дизайнер интерфейсов", random.randint(180, 380)),
            ("🎧 Sound Designer треков", random.randint(160, 340))
        ]
        job_name, wage = random.choice(jobs)
        await bot.db.modify_balance(user_id, wage)
        await ctx.send(f"💼 **Смена окончена:** {job_name}\n> Зарплата: `+💎 {wage}` монет.")

    @bot.command(name="crime", aliases=["ограбление", "криминал", "налет"])
    async def crime_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        ready, remaining = await bot.db.check_cooldown(user_id, "crime", 7200)
        if not ready:
            await ctx.send(f"🚨 Полиция настороже! Подождите `{remaining // 60}м`.")
            return
        if random.random() < 0.55:
            loot = random.randint(400, 950)
            await bot.db.modify_balance(user_id, loot)
            await ctx.send(f"🥷 **Успешный взлом корпорации!** Добыча: `+💎 {loot}` монет.")
        else:
            fine = random.randint(150, 350)
            await bot.db.modify_balance(user_id, -fine)
            await ctx.send(f"🚔 **Вас поймала полиция!** Штраф: `💎 {fine}` монет.")

    @bot.command(name="shop", aliases=["магазин", "маркет", "store"])
    async def shop_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        lines = ["🏪 **КИБЕР-МАРКЕТ ZENITH**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
        for item_id, info in SHOP_ITEMS.items():
            lines.append(f"{info['icon']} **{info['name']}** (`.{item_id}`)\n> Цена: `💎 {info['price']}` | *{info['desc']}*")
        lines.append("\n*Купить предмет: `.buy <ID_предмета>`*")
        await ctx.send("\n".join(lines))

    @bot.command(name="buy", aliases=["купить", "приобрести"])
    async def buy_cmd(ctx, item_id: str):
        await bot.handle_slowmode(ctx.channel)
        item_id = item_id.lower().lstrip(".")
        if item_id not in SHOP_ITEMS:
            await ctx.send(f"❌ Предмет `{item_id}` не найден. Список: `.shop`")
            return
        item = SHOP_ITEMS[item_id]
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bal < item["price"]:
            await ctx.send(f"❌ Недостаточно средств (`💎 {bal}`). Нужно: `💎 {item['price']}`")
            return
        await bot.db.modify_balance(user_id, -item["price"])
        await bot.db.add_item(user_id, item_id, item["name"], item["icon"], 1)
        await ctx.send(f"✅ Вы купили {item['icon']} **{item['name']}** за `💎 {item['price']}`!")

    @bot.command(name="inventory", aliases=["инвентарь", "рюкзак", "inv", "вещи"])
    async def inventory_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        items = await bot.db.get_inventory(str(ctx.author.id))
        if not items:
            await ctx.send(f"🎒 Инвентарь пуст. Загляните в `.shop`!")
            return
        lines = [f"🎒 **Инвентарь {ctx.author.name}:**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
        for it in items:
            lines.append(f"• {it['item_icon']} **{it['item_name']}** — `{it['quantity']} шт.` (`{it['item_id']}`)")
        await ctx.send("\n".join(lines))

    @bot.command(name="transfer", aliases=["передать", "перевод_монет", "pay"])
    async def transfer_cmd(ctx, target: discord.User, amount: int):
        await bot.handle_slowmode(ctx.channel)
        if target.id == ctx.author.id or amount <= 0:
            await ctx.send("❌ Некорректная сумма или получатель.")
            return
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bal < amount:
            await ctx.send(f"❌ Недостаточно монет (`💎 {bal}`).")
            return
        await bot.db.modify_balance(user_id, -amount)
        await bot.db.modify_balance(str(target.id), amount)
        await ctx.send(f"💸 {ctx.author.mention} перевёл `💎 {amount}` монет пользователю {target.mention}!")

    @bot.command(name="rob", aliases=["ограбить", "украсть"])
    async def rob_cmd(ctx, target: discord.User):
        await bot.handle_slowmode(ctx.channel)
        if target.id == ctx.author.id:
            await ctx.send("❌ Нельзя грабить самого себя!")
            return
        target_bal = await bot.db.get_balance(str(target.id))
        if target_bal < 100:
            await ctx.send(f"❌ У {target.name} слишком мало монет.")
            return
        if random.random() < 0.42:
            stolen = random.randint(30, min(400, target_bal))
            await bot.db.modify_balance(str(target.id), -stolen)
            await bot.db.modify_balance(str(ctx.author.id), stolen)
            await ctx.send(f"🥷 **Успех!** Вы украли у {target.mention} `💎 {stolen}` монет!")
        else:
            fine = random.randint(50, 200)
            await bot.db.modify_balance(str(ctx.author.id), -fine)
            await ctx.send(f"🚨 **Провал!** Полиция оштрафовала вас на `💎 {fine}` монет.")

    @bot.command(name="mine", aliases=["шахта", "копать"])
    async def mine_cmd(ctx):
        """Добыча руды в кибер-шахте."""
        await bot.handle_slowmode(ctx.channel)
        ores = [("🪨 Уголь", 25), ("🥈 Серебро", 70), ("🥇 Золото", 180), ("💎 Алмаз", 400), ("🧪 Уран", 750)]
        ore, val = random.choice(ores)
        await bot.db.modify_balance(str(ctx.author.id), val)
        await ctx.send(f"⛏️ **Шахта:** Вы добыли {ore} и продали за `+💎 {val}` монет!")

    # 11-20: Казино и Карты
    @bot.command(name="blackjack", aliases=["блэкджек", "21очко", "bj"])
    async def blackjack_cmd(ctx, bet: int = 100):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bet <= 0 or bet > bal:
            await ctx.send(f"❌ Баланс: `💎 {bal}`")
            return
        deck = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11] * 4
        random.shuffle(deck)
        p_cards, d_cards = [deck.pop(), deck.pop()], [deck.pop(), deck.pop()]
        p_score, d_score = sum(p_cards), sum(d_cards)
        while d_score < 17:
            d_cards.append(deck.pop())
            d_score = sum(d_cards)
        if p_score > 21:
            await bot.db.modify_balance(user_id, -bet)
            res = f"💀 Перебор `{p_score}`! Проигрыш `💎 {bet}`."
        elif d_score > 21 or p_score > d_score:
            await bot.db.modify_balance(user_id, bet)
            res = f"🎉 ПОБЕДА! `{p_score}` VS `{d_score}` дилера. Выигрыш: `+💎 {bet}`!"
        elif p_score == d_score:
            res = f"🤝 Ничья `{p_score}`. Ставка сохранена."
        else:
            await bot.db.modify_balance(user_id, -bet)
            res = f"😢 Дилер победил (`{d_score}`). Потеряно `💎 {bet}`."
        await ctx.send(f"🃏 **Блэкджек:** Вы: `{p_cards}` ({p_score}) | Дилер: `{d_cards}` ({d_score})\n{res}")

    @bot.command(name="casino", aliases=["казино", "slots", "слоты", "777"])
    async def casino_cmd(ctx, bet: int = 100):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bet <= 0 or bet > bal:
            await ctx.send(f"❌ Баланс: `💎 {bal}`")
            return
        symbols = ["🍒", "🍋", "🍇", "🔔", "⭐", "7️⃣"]
        s1, s2, s3 = random.choice(symbols), random.choice(symbols), random.choice(symbols)
        if s1 == s2 == s3 == "7️⃣":
            win = bet * 10
            await bot.db.modify_balance(user_id, win - bet)
            text = f"🎰 **ДЖЕКПОТ x10!** [ {s1} | {s2} | {s3} ] `+💎 {win}`!"
        elif s1 == s2 == s3:
            win = bet * 4
            await bot.db.modify_balance(user_id, win - bet)
            text = f"🎰 **ТРОЙКА x4!** [ {s1} | {s2} | {s3} ] `+💎 {win}`!"
        elif s1 == s2 or s2 == s3 or s1 == s3:
            win = int(bet * 1.5)
            await bot.db.modify_balance(user_id, win - bet)
            text = f"🎰 **ПАРА x1.5!** [ {s1} | {s2} | {s3} ] `+💎 {win}`"
        else:
            await bot.db.modify_balance(user_id, -bet)
            text = f"🎰 **ПРОИГРЫШ** [ {s1} | {s2} | {s3} ] `-💎 {bet}`"
        await ctx.send(text)

    @bot.command(name="dice", aliases=["кости", "кубик"])
    async def dice_cmd(ctx, bet: int = 50):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bet > bal or bet <= 0:
            await ctx.send(f"❌ Баланс: `💎 {bal}`")
            return
        d1, d2 = random.randint(1, 6), random.randint(1, 6)
        total = d1 + d2
        if total >= 8:
            win = int(bet * 1.8)
            await bot.db.modify_balance(user_id, win - bet)
            await ctx.send(f"🎲 **[{d1}] + [{d2}] = {total}** (>=8) | 🎉 Победа `+💎 {win - bet}`!")
        elif total == 7:
            await ctx.send(f"🎲 **[{d1}] + [{d2}] = 7** | 🤝 Возврат ставки `💎 {bet}`.")
        else:
            await bot.db.modify_balance(user_id, -bet)
            await ctx.send(f"🎲 **[{d1}] + [{d2}] = {total}** (<7) | 💀 Проигрыш `💎 {bet}`.")

    @bot.command(name="cupgame", aliases=["наперстки", "стаканчики"])
    async def cupgame_cmd(ctx, choice: int, bet: int = 50):
        await bot.handle_slowmode(ctx.channel)
        if choice not in (1, 2, 3):
            await ctx.send("❌ Выберите: `.cupgame 1 50`, `.cupgame 2 50` или `.cupgame 3 50`")
            return
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bet > bal or bet <= 0:
            await ctx.send(f"❌ Баланс: `💎 {bal}`")
            return
        ball = random.randint(1, 3)
        cups = ["🥤", "🥤", "🥤"]
        cups[ball - 1] = "🔘"
        if choice == ball:
            win = bet * 3
            await bot.db.modify_balance(user_id, win - bet)
            await ctx.send(f"{' '.join(cups)}\n🎉 **Угадали!** Напёрсток №{ball}. Выигрыш x3: `+💎 {win - bet}`!")
        else:
            await bot.db.modify_balance(user_id, -bet)
            await ctx.send(f"{' '.join(cups)}\n😢 **Мимо!** Шарик был под №{ball}. Потеряно `💎 {bet}`.")

    @bot.command(name="wheel", aliases=["колесо_фортуны"])
    async def wheel_cmd(ctx, bet: int = 100):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bet > bal or bet <= 0:
            await ctx.send(f"❌ Баланс: `💎 {bal}`")
            return
        sectors = [("💀 0x", 0), ("💵 0.5x", 0.5), ("✨ 1.5x", 1.5), ("🔥 2x", 2.0), ("💎 3x", 3.0), ("👑 5x ДЖЕКПОТ", 5.0)]
        sector, mult = random.choices(sectors, weights=[35, 25, 20, 12, 6, 2], k=1)[0]
        diff = int(bet * mult) - bet
        await bot.db.modify_balance(user_id, diff)
        await ctx.send(f"🎡 **Колесо Фортуны:** Выпало **{sector}**! (`{'+' if diff >= 0 else ''}💎 {diff}`)")

    @bot.command(name="coinflip", aliases=["монетка", "коинфлип", "орел_решка"])
    async def coinflip_cmd(ctx, choice: str = "орел", bet: int = 50):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bet > bal or bet < 0:
            await ctx.send(f"❌ Баланс: `💎 {bal}`")
            return
        res = random.choice(["орел", "решка"])
        won = choice.lower().startswith(res[0])
        diff = bet if won else -bet
        await bot.db.modify_balance(user_id, diff)
        await ctx.send(f"🪙 Выпало: **{'🦅 Орел' if res == 'орел' else '🪙 Решка'}**!\n{'🎉 Победа: +' if won else '😢 Проигрыш: -'} `💎 {bet}`")

    @bot.command(name="highlow", aliases=["больше_меньше", "hl"])
    async def highlow_cmd(ctx, choice: str, bet: int = 50):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bet > bal or bet <= 0:
            await ctx.send(f"❌ Баланс: `💎 {bal}`")
            return
        b, n = random.randint(25, 75), random.randint(1, 100)
        is_h = n > b
        user_h = choice.lower() in ("high", "больше", "h")
        won = (is_h and user_h) or (not is_h and not user_h)
        diff = bet if won else -bet
        await bot.db.modify_balance(user_id, diff)
        await ctx.send(f"📊 Число `{b}` ➔ `{n}` | {'🎉 Победа +' if won else '😢 Проигрыш -'}`💎 {bet}`")

    @bot.command(name="roulette", aliases=["русская_рулетка", "рулетка"])
    async def roulette_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        ch = random.randint(1, 6)
        if ch == 1:
            await ctx.send("💥 **БАХ!** Вы погибли в русской рулетке... 💀")
        else:
            await ctx.send(f"😮‍💨 **ЩЁЛК!** Холостой выстрел. Вы выжили! ({ch}/6)")

    @bot.command(name="lottery", aliases=["лотерея", "лото"])
    async def lottery_cmd(ctx, num: int):
        """Лотерея от 1 до 10 с супер-призом x8."""
        await bot.handle_slowmode(ctx.channel)
        if num < 1 or num > 10:
            await ctx.send("❌ Выберите номер от 1 до 10.")
            return
        winning = random.randint(1, 10)
        if num == winning:
            await bot.db.modify_balance(str(ctx.author.id), 800)
            await ctx.send(f"🎟️ **ЛОТЕРЕЯ:** Выпало `{winning}`! 🎉 **ВЫ ВЫИГРАЛИ ДЖЕКПОТ 800 МОНЕТ!**")
        else:
            await ctx.send(f"🎟️ **ЛОТЕРЕЯ:** Выпало `{winning}`. Повезёт в следующий раз!")

    @bot.command(name="scratch", aliases=["скретч_карта", "билет"])
    async def scratch_cmd(ctx):
        """Скретч-билет со скрытыми призами."""
        await bot.handle_slowmode(ctx.channel)
        prizes = ["💎 500", "🪙 100", "🍒 50", "💀 Пусто"]
        c1, c2, c3 = random.choice(prizes), random.choice(prizes), random.choice(prizes)
        await ctx.send(f"🎫 **Скретч-билет:**\n||{c1}|| ||{c2}|| ||{c3}||\n*Нажмите на спойлеры, чтобы стереть защитный слой!*")

    # 21-30: Спорт и Активности
    @bot.command(name="darts", aliases=["дартс", "дротики"])
    async def darts_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        score = random.choices([50, 25, 10, 5, 0], weights=[5, 15, 40, 30, 10])[0]
        if score > 0:
            await bot.db.modify_balance(str(ctx.author.id), score * 2)
            await ctx.send(f"🎯 **Дартс:** Попадание `{score}` очков! `+💎 {score * 2}`")
        else:
            await ctx.send("🎯 **Дартс:** 💨 Промах мимо мишени!")

    @bot.command(name="bowling", aliases=["боулинг"])
    async def bowling_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        pins = random.randint(0, 10)
        rew = 150 if pins == 10 else pins * 8
        await bot.db.modify_balance(str(ctx.author.id), rew)
        await ctx.send(f"🎳 **Боулинг:** {'🔥 СТРАЙК!' if pins == 10 else f'Сбито {pins}/10 кеглей'} (`+💎 {rew}`)")

    @bot.command(name="football", aliases=["футбол", "пенальти"])
    async def football_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        if random.choice([True, True, False]):
            await bot.db.modify_balance(str(ctx.author.id), 80)
            await ctx.send("⚽🥅 **ГООООЛ!** Точный удар в девятку! (+80 монет)")
        else:
            await ctx.send("🧤 Вратарь отразил ваш удар!")

    @bot.command(name="basket", aliases=["баскетбол"])
    async def basket_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        if random.choice([True, False]):
            await bot.db.modify_balance(str(ctx.author.id), 100)
            await ctx.send("🏀🗑️ **3-ОЧКОВЫЙ!** Чистое попадание! (+100 монет)")
        else:
            await ctx.send("💥 Мяч отскочил от дужки кольца!")

    @bot.command(name="archery", aliases=["стрельба_из_лука", "лук"])
    async def archery_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        pts = random.randint(1, 10)
        await bot.db.modify_balance(str(ctx.author.id), pts * 15)
        await ctx.send(f"🏹 **Стрельба из лука:** Стрела вонзилась в зону `{pts}/10`! (+{pts * 15} монет)")

    @bot.command(name="fishing", aliases=["рыбалка", "поймать_рыбу"])
    async def fishing_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        loot = [("🐟 Карась", 30), ("🐠 Рыба-клоун", 80), ("🦈 Акула", 250), ("💎 Затонувший сундук", 600)]
        item, reward = random.choice(loot)
        await bot.db.modify_balance(str(ctx.author.id), reward)
        await ctx.send(f"🎣 **Рыбалка:** Вы выловили {item}! `+💎 {reward}`")

    @bot.command(name="hunt", aliases=["охота", "охотник"])
    async def hunt_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        prey = [("🐇 Кролик", 40), ("🦆 Утка", 70), ("🐗 Кабан", 160), ("🦌 Олень", 320), ("🐻 Гризли", 550)]
        animal, reward = random.choice(prey)
        await bot.db.modify_balance(str(ctx.author.id), reward)
        await ctx.send(f"🏹 **Охота:** Добыт {animal}! Продано за `+💎 {reward}` монет.")

    @bot.command(name="golf", aliases=["гольф"])
    async def golf_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        hits = random.randint(1, 5)
        rew = 200 if hits == 1 else max(20, (6 - hits) * 40)
        await bot.db.modify_balance(str(ctx.author.id), rew)
        await ctx.send(f"⛳ **Гольф:** {'Hole-in-One в 1 удар!' if hits == 1 else f'Мяч в лунке за {hits} удара.'} (+{rew} монет)")

    @bot.command(name="racing", aliases=["гонки", "гонка"])
    async def racing_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        pos = random.randint(1, 8)
        rew = 300 if pos == 1 else (100 if pos <= 3 else 20)
        await bot.db.modify_balance(str(ctx.author.id), rew)
        await ctx.send(f"🏎️ **Кибер-Гонки:** Финиш на **{pos}-м месте**! (+{rew} монет)")

    @bot.command(name="boxing", aliases=["бокс", "ринг"])
    async def boxing_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        ko = random.choice([True, False])
        if ko:
            await bot.db.modify_balance(str(ctx.author.id), 180)
            await ctx.send("🥊 **БОКС:** Нокаут апперкотом в 3-м раунде! (+180 монет) 🏆")
        else:
            await ctx.send("🥊 **БОКС:** Соперник увернулся от серии ударов!")

    # 31-40: RPG, Дуэли и Битвы
    @bot.command(name="duel", aliases=["дуэль", "вызов"])
    async def duel_cmd(ctx, target: discord.User):
        await bot.handle_slowmode(ctx.channel)
        winner = random.choice([ctx.author, target])
        await ctx.send(f"🤠 **Дуэль между {ctx.author.mention} и {target.mention}!**\n🏆 Победитель: {winner.mention}! 🎯")

    @bot.command(name="fight", aliases=["бой", "драка"])
    async def fight_cmd(ctx, target: discord.User):
        await bot.handle_slowmode(ctx.channel)
        winner = random.choice([ctx.author.name, target.name])
        await ctx.send(f"⚔️ **Битва: {ctx.author.name} VS {target.name}**\n🏆 Победитель: **{winner}**! 💥")

    @bot.command(name="dungeon", aliases=["подземелье", "данж"])
    async def dungeon_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        events = [("🐲 Побежден Древний Дракон!", 500), ("💎 Найдена комната самоцветов!", 400), ("💀 Ловушка со стрелами!", -100)]
        desc, rew = random.choice(events)
        await bot.db.modify_balance(str(ctx.author.id), rew)
        await ctx.send(f"🏰 **Подземелье:** {desc} (`{'+' if rew >= 0 else ''}💎 {rew}`)")

    @bot.command(name="bossfight", aliases=["босс", "рейд"])
    async def bossfight_cmd(ctx):
        """Рейд на мирового кибер-босса."""
        await bot.handle_slowmode(ctx.channel)
        dmg = random.randint(150, 999)
        reward = int(dmg * 0.8)
        await bot.db.modify_balance(str(ctx.author.id), reward)
        await ctx.send(f"👾 **Рейд на Босса:** Вы нанесли `{dmg}` ед. урона и получили `+💎 {reward}` монет!")

    @bot.command(name="pet", aliases=["питомец", "тамагочи"])
    async def pet_cmd(ctx, action: str = "инфо"):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        pet = await bot.db.get_pet(user_id)
        act = action.lower()
        if act in ("feed", "покормить"):
            await bot.db.update_pet(user_id, hunger=min(100, pet["hunger"] + 30), exp=pet["exp"] + 10)
            await ctx.send(f"🍖 Вы покормили **{pet['name']}**! (+10 EXP)")
        elif act in ("play", "играть"):
            await bot.db.update_pet(user_id, happiness=min(100, pet["happiness"] + 30), exp=pet["exp"] + 15)
            await ctx.send(f"🎾 Вы поиграли с **{pet['name']}**! (+15 EXP)")
        elif act in ("sleep", "спать"):
            await bot.db.update_pet(user_id, energy=100)
            await ctx.send(f"💤 **{pet['name']}** полон энергии (100%)!")
        else:
            await ctx.send(f"🐾 **{pet['pet_type']} {pet['name']} (Lvl {pet['level']}):**\n🍖 Сытость: `{pet['hunger']}%` | ⚡ Энергия: `{pet['energy']}%` | ❤️ Счастье: `{pet['happiness']}%`")

    @bot.command(name="lootbox", aliases=["кейс", "сундук"])
    async def lootbox_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if bal < 150:
            await ctx.send(f"❌ Цена кейса: `💎 150`. У вас: `💎 {bal}`")
            return
        await bot.db.modify_balance(user_id, -150)
        prizes = [("🟩 Обычный нож", 80), ("🟦 Неоновый клинок", 220), ("🟪 Плазменный меч", 480), ("👑 Корона императора", 2500)]
        prize, val = random.choice(prizes)
        await bot.db.modify_balance(user_id, val)
        await ctx.send(f"🎁 **Открытие кейса:** Выпало {prize}! (`+💎 {val}` монет)")

    @bot.command(name="rps", aliases=["кнб", "цуефа"])
    async def rps_cmd(ctx, player_choice: str):
        await bot.handle_slowmode(ctx.channel)
        choices = ["Камень 🪨", "Ножницы ✂️", "Бумага 📄"]
        norm = player_choice.lower()
        u = "Камень 🪨" if "к" in norm else ("Ножницы ✂️" if "н" in norm else "Бумага 📄")
        b = random.choice(choices)
        await ctx.send(f"🎮 **КНБ:** Вы: **{u}** VS Бот: **{b}**")

    @bot.command(name="tictactoe", aliases=["крестики_нолики", "ttt"])
    async def tictactoe_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("🎮 **Крестики-Нолики:**\n1️⃣ 2️⃣ 3️⃣\n4️⃣ 5️⃣ 6️⃣\n7️⃣ 8️⃣ 9️⃣")

    @bot.command(name="minesweeper", aliases=["сапер", "мины"])
    async def minesweeper_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        grid = ["||1️⃣|| ||1️⃣|| ||💣||", "||1️⃣|| ||💣|| ||2️⃣||", "||1️⃣|| ||1️⃣|| ||1️⃣||"]
        await ctx.send("💣 **Поле Сапёра:**\n" + " ".join(grid))

    @bot.command(name="heist", aliases=["ограбление_банка"])
    async def heist_cmd(ctx):
        """Командный налёт на банк."""
        await bot.handle_slowmode(ctx.channel)
        if random.random() < 0.6:
            loot = random.randint(600, 1500)
            await bot.db.modify_balance(str(ctx.author.id), loot)
            await ctx.send(f"🏦💥 **Ограбление Банка удалось!** Вынесли из сейфа `💎 {loot}` монет!")
        else:
            await bot.db.modify_balance(str(ctx.author.id), -200)
            await ctx.send("🚨 Сработала сигнализация! Пришлось сбросить сумку с `💎 200` монетами.")

    # 41-50: Интерактив, Головоломки и Триксы
    @bot.command(name="quiz", aliases=["викторина", "вопрос"])
    async def quiz_cmd(ctx):
        """Случайный интеллектуальный вопрос."""
        await bot.handle_slowmode(ctx.channel)
        q_list = [
            ("Сколько планет в Солнечной системе?", "8"),
            ("В каком году был запущен Discord?", "2015"),
            ("Какая криптовалюта была создана первой?", "Bitcoin"),
            ("Химический символ золота?", "Au")
        ]
        q, a = random.choice(q_list)
        await ctx.send(f"🧠 **Викторина:** {q}\n> Ответ: ||{a}|| *(нажмите, чтобы проверить)*")

    @bot.command(name="typerace", aliases=["скоропечатание", "тайпинг"])
    async def typerace_cmd(ctx):
        """Проверка скорости набора текста."""
        await bot.handle_slowmode(ctx.channel)
        phrases = ["Zenith enterprise self bot matrix", "Cyberpunk neon lights in the dark", "Quantum encrypted blockchain system"]
        p = random.choice(phrases)
        await ctx.send(f"⌨️ **TypeRace:** Напишите фразу как можно быстрее:\n`{p}`")

    @bot.command(name="slotsmatrix", aliases=["матрица_слоты"])
    async def slotsmatrix_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        emojis = ["🟢", "💻", "💾", "⚡", "🕶️"]
        r = [random.choice(emojis) for _ in range(9)]
        await ctx.send(f"📟 **Matrix 3x3:**\n{r[0]} {r[1]} {r[2]}\n{r[3]} {r[4]} {r[5]}\n{r[6]} {r[7]} {r[8]}")

    @bot.command(name="magicball", aliases=["шар_судьбы", "шар8", "8ball"])
    async def magicball_cmd(ctx, *, question: str = ""):
        await bot.handle_slowmode(ctx.channel)
        answers = ["Бесспорно ✅", "Весьма вероятно ✨", "Спроси позже ⏳", "Даже не думай ❌", "Мой ответ — нет 💀"]
        await ctx.send(f"🎱 **Шар Судьбы:** *«{random.choice(answers)}»*")

    @bot.command(name="russianroulette_duel", aliases=["дуэль_рулетка"])
    async def rr_duel_cmd(ctx, target: discord.User):
        await bot.handle_slowmode(ctx.channel)
        dead = random.choice([ctx.author, target])
        await ctx.send(f"🔫 **Смертельная рулетка между {ctx.author.mention} и {target.mention}:**\n💥 Патрон достался {dead.mention}!")

    @bot.command(name="spin", aliases=["спиннер"])
    async def spin_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        sec = random.randint(10, 120)
        await ctx.send(f"🌀 Спиннер крутился **{sec} секунд** без остановки!")

    @bot.command(name="slotmachine", aliases=["автомат"])
    async def slotmachine_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        items = ["🔔", "💎", "⭐"]
        res = [random.choice(items) for _ in range(3)]
        await ctx.send(f"🎰 `[ {' | '.join(res)} ]`")

    @bot.command(name="gamble", aliases=["гембл"])
    async def gamble_cmd(ctx, amount: int):
        await bot.handle_slowmode(ctx.channel)
        user_id = str(ctx.author.id)
        bal = await bot.db.get_balance(user_id)
        if amount > bal or amount <= 0:
            await ctx.send(f"❌ Баланс: `💎 {bal}`")
            return
        if random.random() < 0.5:
            await bot.db.modify_balance(user_id, amount)
            await ctx.send(f"🎲 **Гембл:** 🎉 Вы удвоили ставку! `+💎 {amount}`")
        else:
            await bot.db.modify_balance(user_id, -amount)
            await ctx.send(f"🎲 **Гембл:** 💀 Ставка сгорела. `-💎 {amount}`")

    @bot.command(name="craft", aliases=["крафт", "создать_предмет"])
    async def craft_cmd(ctx, item_name: str = "клинок"):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"🔨 **Кузница:** Вы успешно скрафтили артефакт **«{item_name.capitalize()}»**!")

    @bot.command(name="guessthenumber", aliases=["угадай_число", "число"])
    async def guessthenumber_cmd(ctx, num: int):
        await bot.handle_slowmode(ctx.channel)
        hidden = random.randint(1, 10)
        if num == hidden:
            await bot.db.modify_balance(str(ctx.author.id), 250)
            await ctx.send(f"🎯 **Бинго!** Загаданное число было `{hidden}`. Награда: `+💎 250`!")
        else:
            await ctx.send(f"💨 Загадано было `{hidden}`, а вы назвали `{num}`.")
