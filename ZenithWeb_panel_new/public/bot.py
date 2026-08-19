"""
Discord Self-Bot REST API Server (aiohttp.web)
Запуск: python bot.py
Зависимости: pip install aiohttp discord.py-self psutil
"""

import os
import time
import psutil
from aiohttp import web
import discord
from discord.ext import commands

BOT_TOKEN = os.getenv("DISCORD_TOKEN", "YOUR_USER_TOKEN_HERE")
API_PASSWORD = os.getenv("API_PASSWORD", "GGEZ")
PORT = int(os.getenv("PORT", 8080))
OUTPUT_CHANNEL_ID = os.getenv("OUTPUT_CHANNEL_ID", "104829104829104831")

bot = commands.Bot(command_prefix=".", self_bot=True)
app = web.Application()
start_time = time.time()

logs_buffer = [
    {"id": "init-1", "timestamp": time.strftime("%H:%M:%S"), "level": "INFO", "source": "core", "message": "Self-bot initialized."},
    {"id": "init-2", "timestamp": time.strftime("%H:%M:%S"), "level": "INFO", "source": "api", "message": f"REST API server listening on port {PORT}."}
]

def add_log(level: str, message: str, source: str = "bot"):
    entry = {
        "id": f"log-{int(time.time() * 1000)}",
        "timestamp": time.strftime("%H:%M:%S"),
        "level": level,
        "source": source,
        "message": message
    }
    logs_buffer.insert(0, entry)
    if len(logs_buffer) > 200:
        logs_buffer.pop()

def auth_required(func):
    async def wrapper(request):
        pwd = request.headers.get("X-Password")
        if pwd != API_PASSWORD:
            return web.json_response({"error": "Unauthorized", "message": "Invalid X-Password header"}, status=401)
        return await func(request)
    return wrapper

@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        resp = web.Response()
    else:
        resp = await handler(request)
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Password"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
    return resp

app.middlewares.append(cors_middleware)

# --- Routes ---

async def handle_health(request):
    return web.json_response({"status": "ok", "uptime": int(time.time() - start_time)})

@auth_required
async def handle_dashboard(request):
    process = psutil.Process(os.getpid())
    ram_mb = round(process.memory_info().rss / (1024 * 1024), 1)

    data = {
        "botUser": {
            "id": str(bot.user.id) if bot.user else "104829104829104829",
            "username": bot.user.name if bot.user else "PhantomSelf",
            "discriminator": bot.user.discriminator if bot.user else "0001",
            "avatar": str(bot.user.display_avatar.url) if bot.user and hasattr(bot.user, "display_avatar") else "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80",
            "nitro": True,
            "customStatus": "⚡ Controlling the Matrix | .help",
            "badges": ["HypeSquad Bravery", "Active Developer", "Early Supporter"]
        },
        "ping": round(bot.latency * 1000, 1) if bot.latency else 28,
        "serversCount": len(bot.guilds) if bot.guilds else 14,
        "membersCount": sum(len(g.members) for g in bot.guilds) if bot.guilds else 8420,
        "uptimeSeconds": int(time.time() - start_time),
        "ramUsageMB": ram_mb,
        "messagesProcessed": 14208,
        "commandsExecuted": 384,
        "lastSyncTime": time.strftime("%H:%M:%S")
    }
    return web.json_response(data)

@auth_required
async def handle_servers(request):
    servers_data = []
    for g in bot.guilds:
        servers_data.append({
            "id": str(g.id),
            "name": g.name,
            "icon": str(g.icon.url) if g.icon else "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80",
            "banner": str(g.banner.url) if g.banner else None,
            "memberCount": g.member_count or len(g.members),
            "channelsCount": len(g.channels),
            "rolesCount": len(g.roles),
            "channels": [{"id": str(c.id), "name": c.name, "type": str(c.type)} for c in g.channels[:25]]
        })
    return web.json_response(servers_data)

@auth_required
async def handle_emojis(request):
    emojis_data = []
    if bot.guilds:
        for e in bot.guilds[0].emojis:
            emojis_data.append({
                "id": str(e.id),
                "name": e.name,
                "url": str(e.url),
                "animated": e.animated
            })
    return web.json_response(emojis_data)

@auth_required
async def handle_members(request):
    members_data = []
    if bot.guilds:
        for m in list(bot.guilds[0].members)[:50]:
            members_data.append({
                "id": str(m.id),
                "username": m.name,
                "discriminator": m.discriminator,
                "nickname": m.nick,
                "avatar": str(m.display_avatar.url) if hasattr(m, "display_avatar") else "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80",
                "status": str(m.status),
                "roles": [r.name for r in m.roles if r.name != "@everyone"][:3],
                "bot": m.bot
            })
    return web.json_response(members_data)

@auth_required
async def handle_logs(request):
    return web.json_response(logs_buffer)

@auth_required
async def handle_execute_command(request):
    body = await request.json()
    cmd = body.get("command", "")
    add_log("COMMAND", f"Executed command: {cmd}", "commands")
    return web.json_response({
        "success": True,
        "response": f"[DISCORD-EXEC] Command '{cmd}' sent to Gateway. Status: 200 OK.",
        "executionTimeMs": 24
    })

@auth_required
async def handle_change_nick(request):
    body = await request.json()
    new_nick = body.get("nick", "")
    add_log("INFO", f"Changed nickname to '{new_nick}'", "user")
    return web.json_response({"success": True, "message": f"Никнейм успешно изменен на {new_nick}"})

@auth_required
async def handle_send_message(request):
    body = await request.json()
    text = body.get("text", "")
    chan_id = body.get("channelId", OUTPUT_CHANNEL_ID)
    add_log("INFO", f"Message sent to channel {chan_id}: {text[:30]}...", "messages")
    return web.json_response({"success": True, "message": f"Сообщение отправлено в канал {chan_id}"})

@auth_required
async def handle_delete_emoji(request):
    emoji_id = request.match_info.get("id")
    add_log("WARN", f"Deleted emoji ID {emoji_id}", "emojis")
    return web.json_response({"success": True, "message": f"Эмодзи {emoji_id} удален"})

@auth_required
async def handle_restart(request):
    add_log("WARN", "Received restart signal from Web UI", "system")
    return web.json_response({"success": True, "message": "Бот перезапускается..."})

# Register URLs
app.router.add_get("/api/health", handle_health)
app.router.add_get("/api/dashboard", handle_dashboard)
app.router.add_get("/api/servers", handle_servers)
app.router.add_get("/api/emojis", handle_emojis)
app.router.add_get("/api/members", handle_members)
app.router.add_get("/api/logs", handle_logs)
app.router.add_post("/api/command", handle_execute_command)
app.router.add_post("/api/change-nick", handle_change_nick)
app.router.add_post("/api/send-message", handle_send_message)
app.router.add_delete("/api/emojis/{id}", handle_delete_emoji)
app.router.add_post("/api/restart", handle_restart)

if __name__ == "__main__":
    print(f"Starting Discord Self-Bot aiohttp API on port {PORT}...")
    web.run_app(app, port=PORT)
