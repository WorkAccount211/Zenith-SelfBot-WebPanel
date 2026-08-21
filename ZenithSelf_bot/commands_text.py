import base64
import codecs
import random
from discord.ext import commands
import discord

def register_text_commands(bot):
    """Регистрация 40+ команд оформления текста, шрифтов и типографики."""

    CURSIVE_MAP = {
        'a': '𝓪', 'b': '𝓫', 'c': '𝓬', 'd': '𝓭', 'e': '𝓮', 'f': '𝓯', 'g': '𝓰', 'h': '𝓱', 'i': '𝓲', 'j': '𝓳',
        'k': '𝓴', 'l': '𝓵', 'm': '𝓶', 'n': '𝓷', 'o': '𝓸', 'p': '𝓹', 'q': '𝓺', 'r': '𝓻', 's': '𝓼', 't': '𝓽',
        'u': '𝓾', 'v': '𝓿', 'w': '𝔀', 'x': '𝔁', 'y': '𝔂', 'z': '𝔃',
        'A': '𝓐', 'B': '𝓑', 'C': '𝓒', 'D': '𝓓', 'E': '𝓔', 'F': '𝓕', 'G': '𝓖', 'H': '𝓗', 'I': '𝓘', 'J': '𝓙',
        'K': '𝓚', 'L': '𝓛', 'M': '𝓜', 'N': '𝓝', 'O': '𝓞', 'P': '𝓟', 'Q': '𝓠', 'R': '𝓡', 'S': '𝓢', 'T': '𝓣',
        'U': '𝓤', 'V': '𝓥', 'W': '𝓦', 'X': '𝓧', 'Y': '𝓨', 'Z': '𝓩'
    }

    FRAKTUR_MAP = {
        'a': '𝔞', 'b': '𝔟', 'c': '𝔠', 'd': '𝔡', 'e': '𝔢', 'f': '𝔣', 'g': '𝔤', 'h': '𝔥', 'i': '𝔦', 'j': '𝔧',
        'k': '𝔨', 'l': '𝔩', 'm': '𝔪', 'n': '𝔫', 'o': '𝔬', 'p': '𝔭', 'q': '𝔮', 'r': '𝔯', 's': '𝔰', 't': '𝔱',
        'u': '𝔲', 'v': '𝔳', 'w': '𝔴', 'x': '𝔵', 'y': '𝔶', 'z': '𝔷',
        'A': '𝔄', 'B': '𝔅', 'C': 'ℭ', 'D': '𝔇', 'E': '𝔈', 'F': '𝔉', 'G': '𝔊', 'H': 'ℌ', 'I': 'ℑ', 'J': '𝔍',
        'K': '𝔎', 'L': '𝔏', 'M': '𝔐', 'N': '𝔑', 'O': '𝔒', 'P': '𝔓', 'Q': '𝔔', 'R': 'ℜ', 'S': '𝔖', 'T': '𝔗',
        'U': '𝔘', 'V': '𝔙', 'W': '𝔚', 'X': '𝔛', 'Y': '𝔜', 'Z': 'ℨ'
    }

    DOUBLE_MAP = {
        'a': '𝕒', 'b': '𝕓', 'c': '𝕔', 'd': '𝕕', 'e': '𝕖', 'f': '𝕗', 'g': '𝕘', 'h': '𝕙', 'i': '𝕚', 'j': '𝕛',
        'k': '𝕜', 'l': '𝕝', 'm': '𝕞', 'n': '𝕟', 'o': '𝕠', 'p': '𝕡', 'q': '𝕢', 'r': '𝕣', 's': '𝕤', 't': '𝕥',
        'u': '𝕦', 'v': '𝕧', 'w': '𝕨', 'x': '𝕩', 'y': '𝕪', 'z': '𝕫',
        'A': '𝔸', 'B': '𝔹', 'C': 'ℂ', 'D': '𝔻', 'E': '𝔼', 'F': '𝔽', 'G': '𝔾', 'H': 'ℍ', 'I': '𝕀', 'J': '𝕁',
        'K': '𝕂', 'L': '𝕃', 'M': '𝕄', 'N': 'ℕ', 'O': '𝕆', 'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ', 'S': '𝕊', 'T': '𝕋',
        'U': '𝕌', 'V': '𝕍', 'W': '𝕎', 'X': '𝕏', 'Y': '𝕐', 'Z': 'ℤ',
        '0': '𝟘', '1': '𝟙', '2': '𝟚', '3': '𝟛', '4': '𝟜', '5': '𝟝', '6': '𝟞', '7': '𝟟', '8': '𝟠', '9': '𝟡'
    }

    SMALLCAPS_MAP = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
        'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ',
        'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'а': 'ᴀ', 'б': 'б', 'в': 'в', 'г': 'г', 'д': 'д', 'е': 'ᴇ', 'ж': 'ж', 'з': 'з', 'и': 'и', 'й': 'й',
        'к': 'ᴋ', 'л': 'л', 'м': 'ᴍ', 'н': 'н', 'о': 'ᴏ', 'п': 'п', 'р': 'ᴘ', 'с': 'с', 'т': 'т', 'у': 'ʏ'
    }

    BUBBLE_MAP = {
        'a': 'ⓐ', 'b': 'ⓑ', 'c': 'ⓒ', 'd': 'ⓓ', 'e': 'ⓔ', 'f': 'ⓕ', 'g': 'ⓖ', 'h': 'ⓗ', 'i': 'ⓘ', 'j': 'ⓙ',
        'k': 'ⓚ', 'l': 'ⓛ', 'm': 'ⓜ', 'n': 'ⓝ', 'o': 'ⓞ', 'p': 'ⓟ', 'q': 'ⓠ', 'r': 'ⓡ', 's': 'ⓢ', 't': 'ⓣ',
        'u': 'ⓤ', 'v': 'ⓥ', 'w': 'ⓦ', 'x': 'ⓧ', 'y': 'ⓨ', 'z': 'ⓩ',
        'A': 'Ⓐ', 'B': 'Ⓑ', 'C': 'Ⓒ', 'D': 'Ⓓ', 'E': 'Ⓔ', 'F': 'Ⓕ', 'G': 'Ⓖ', 'H': 'Ⓗ', 'I': 'Ⓘ', 'J': 'Ⓙ',
        'K': 'Ⓚ', 'L': 'Ⓛ', 'M': 'Ⓜ', 'N': 'Ⓝ', 'O': 'Ⓞ', 'P': 'Ⓟ', 'Q': 'Ⓠ', 'R': 'Ⓡ', 'S': 'Ⓢ', 'T': 'Ⓣ',
        'U': 'Ⓤ', 'V': 'Ⓥ', 'W': '𝓦', 'X': 'Ⓧ', 'Y': 'Ⓨ', 'Z': 'Ⓩ'
    }

    SQUARES_MAP = {
        'a': '🄰', 'b': '🄱', 'c': '🄲', 'd': '🄳', 'e': '🄴', 'f': '🄵', 'g': '🄶', 'h': '🄷', 'i': '🄸', 'j': '🄹',
        'k': '🄺', 'l': '🄻', 'm': '🄼', 'n': '🄽', 'o': '🄾', 'p': '🄿', 'q': '🅀', 'r': '🅁', 's': '🅂', 't': '🅃',
        'u': '🅄', 'v': '🅅', 'w': '🅆', 'x': '🅇', 'y': '🅈', 'z': '🅉',
        'A': '🄰', 'B': '🄱', 'C': '🄲', 'D': '🄳', 'E': '🄴', 'F': '🄵', 'G': '🄶', 'H': '🄷', 'I': '🄸', 'J': '🄹',
        'K': '🄺', 'L': '🄻', 'M': '🄼', 'N': '🄽', 'O': '🄾', 'P': '🄿', 'Q': '🅀', 'R': '🅁', 'S': '🅂', 'T': '🅃',
        'U': '🅄', 'V': '🅅', 'W': '🅆', 'X': '🅇', 'Y': '🅈', 'Z': '🅉'
    }

    FLIP_MAP = {
        'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ', 'i': 'ı', 'j': 'ɾ',
        'k': 'ʞ', 'l': 'ן', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ',
        'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
        '?': '¿', '!': '¡', '.': '˙', '_': '‾'
    }

    MORSE_MAP = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
        'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
        'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
        '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': '/'
    }

    # 1-10: Шрифты Юникода
    @bot.command(name="cursive", aliases=["курсив", "script"])
    async def cursive_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(CURSIVE_MAP.get(c, c) for c in text))

    @bot.command(name="fraktur", aliases=["готика", "gothic"])
    async def fraktur_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(FRAKTUR_MAP.get(c, c) for c in text))

    @bot.command(name="double", aliases=["дабл", "контур"])
    async def double_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(DOUBLE_MAP.get(c, c) for c in text))

    @bot.command(name="smallcaps", aliases=["капитель", "small"])
    async def smallcaps_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(SMALLCAPS_MAP.get(c.lower(), c) for c in text))

    @bot.command(name="bubble", aliases=["кружочки", "bubbles"])
    async def bubble_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(BUBBLE_MAP.get(c, c) for c in text))

    @bot.command(name="squares", aliases=["квадраты", "boxed"])
    async def squares_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(SQUARES_MAP.get(c, c) for c in text))

    @bot.command(name="flip", aliases=["перевернуть_вверх_ногами"])
    async def flip_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(FLIP_MAP.get(c, c) for c in reversed(text)))

    @bot.command(name="vapor", aliases=["вайпор", "wide", "широкий"])
    async def vapor_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        res = "".join(chr(ord(c) + 0xFEE0) if 33 <= ord(c) <= 126 else ("　" if c == " " else c) for c in text)
        await ctx.send(res)

    @bot.command(name="superscript", aliases=["суперскрипт", "степень"])
    async def superscript_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        sup = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
               'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
               'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'}
        await ctx.send("".join(sup.get(c.lower(), c) for c in text))

    @bot.command(name="subscript", aliases=["индекс", "нижний_индекс"])
    async def subscript_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        sub = {'0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
               'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ'}
        await ctx.send("".join(sub.get(c.lower(), c) for c in text))

    # 11-20: ANSI и Рамки
    @bot.command(name="ansibox", aliases=["анси", "терминал"])
    async def ansibox_cmd(ctx, color: str, *, data: str):
        await bot.handle_slowmode(ctx.channel)
        codes = {"red": "31", "green": "32", "yellow": "33", "blue": "34", "magenta": "35", "cyan": "36", "white": "37"}
        col = codes.get(color.lower(), "36")
        parts = data.split("|")
        t = parts[0].strip()
        b = parts[1].strip() if len(parts) > 1 else t
        await ctx.send(f"```ansi\n\u001b[1;{col}m[✦] {t}\u001b[0m\n\u001b[0;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n\u001b[0;{col}m{b}\u001b[0m\n```")

    @bot.command(name="aesthetic", aliases=["эстетика", "красиво"])
    async def aesthetic_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"╭━━━ ⋅𖥔⋅ ━━━ ✶ ━━━ ⋅𖥔⋅ ━━━╮\n      {' '.join(list(text))}\n╰━━━ ⋅𖥔⋅ ━━━ ✶ ━━━ ⋅𖥔⋅ ━━━╯")

    @bot.command(name="neonframe", aliases=["неон", "рамка"])
    async def neonframe_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        clean = text[:60]
        length = max(len(clean) + 4, 30)
        border = "═" * length
        await ctx.send(f"```fix\n╔{border}╗\n║  {clean.center(length - 4)}  ║\n╚{border}╝\n```")

    @bot.command(name="bigquote", aliases=["цитата"])
    async def bigquote_cmd(ctx, *, author_and_quote: str):
        await bot.handle_slowmode(ctx.channel)
        parts = author_and_quote.split("|")
        a = parts[0].strip() if len(parts) > 1 else ctx.author.name
        q = parts[1].strip() if len(parts) > 1 else parts[0].strip()
        await ctx.send(f"╭────────────────────────────────────╮\n   ❝ *{q}* ❞\n                                        — **{a}**\n╰────────────────────────────────────╯")

    @bot.command(name="fancycard", aliases=["карточка", "инфокарта"])
    async def fancycard_cmd(ctx, *, data: str):
        await bot.handle_slowmode(ctx.channel)
        parts = [p.strip() for p in data.split("|")]
        lines = ["```yaml", f"╔═══ [ {parts[0]} ] ═══"]
        for f in parts[1:]:
            lines.append(f"  ▸ {f}")
        lines.append("╚══════════════════════════\n```")
        await ctx.send("\n".join(lines))

    @bot.command(name="glitch", aliases=["глич", "zalgo"])
    async def glitch_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        z_chars = ['\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0334', '\u0335', '\u0336', '\u0337', '\u0338']
        res = "".join(c + "".join(random.choice(z_chars) for _ in range(2)) for c in text)
        await ctx.send(res[:1900])

    @bot.command(name="crossout", aliases=["зачеркнуть", "strike"])
    async def crossout_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(c + "\u0336" for c in text))

    @bot.command(name="underline", aliases=["подчеркнуть"])
    async def underline_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(c + "\u0333" for c in text))

    @bot.command(name="boxedtitle", aliases=["бокс_титул"])
    async def boxedtitle_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"┌─[ **{text}** ]─┐")

    @bot.command(name="divider", aliases=["разделитель"])
    async def divider_cmd(ctx):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦")

    # 21-30: Кодирование и Шифры
    @bot.command(name="morse", aliases=["морзе", "азбука_морзе"])
    async def morse_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        res = " ".join(MORSE_MAP.get(c.upper(), "?") for c in text)
        await ctx.send(f"📡 **Код Морзе:**\n`{res}`")

    @bot.command(name="binary", aliases=["бинарный", "двоичный"])
    async def binary_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"💻 **Бинарный код:**\n`{' '.join(format(ord(c), '08b') for c in text)}`")

    @bot.command(name="hex", aliases=["хекс"])
    async def hex_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"🔢 **HEX:** `{' '.join(format(ord(c), '02X') for c in text)}`")

    @bot.command(name="leet", aliases=["1337", "хакер"])
    async def leet_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        t = {'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'b': '8'}
        await ctx.send("".join(t.get(c.lower(), c) for c in text))

    @bot.command(name="rot13", aliases=["рот13"])
    async def rot13_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"🔄 **ROT13:** `{codecs.encode(text, 'rot_13')}`")

    @bot.command(name="cipher", aliases=["цезарь", "шифр_цезаря"])
    async def cipher_cmd(ctx, shift: int, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        res = []
        for c in text:
            if 'a' <= c <= 'z':
                res.append(chr((ord(c) - ord('a') + shift) % 26 + ord('a')))
            elif 'A' <= c <= 'Z':
                res.append(chr((ord(c) - ord('A') + shift) % 26 + ord('A')))
            elif 'а' <= c <= 'я':
                res.append(chr((ord(c) - ord('а') + shift) % 32 + ord('а')))
            else:
                res.append(c)
        await ctx.send(f"🔐 **Шифр Цезаря (+{shift}):**\n`{''.join(res)}`")

    @bot.command(name="reverse", aliases=["реверс"])
    async def reverse_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(text[::-1])

    @bot.command(name="mock", aliases=["мок"])
    async def mock_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(c.upper() if i % 2 == 0 else c.lower() for i, c in enumerate(text)))

    @bot.command(name="spoilerall", aliases=["спойлер_все"])
    async def spoilerall_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("".join(f"||{c}||" for c in text))

    @bot.command(name="spaced", aliases=["пробелы"])
    async def spaced_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send("  ".join(list(text)))

    # 31-40: Стильные блоки, ASCII и Символы
    @bot.command(name="codeblock", aliases=["код"])
    async def codeblock_cmd(ctx, lang: str, *, code: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"```{lang}\n{code}\n```")

    @bot.command(name="bracket", aliases=["скобки"])
    async def bracket_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"【 **{text}** 】")

    @bot.command(name="startext", aliases=["звезды"])
    async def startext_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"★・──・ {text} ・──・★")

    @bot.command(name="sparkletext", aliases=["блеск"])
    async def sparkletext_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"✧･ﾟ: *✧･ﾟ:* **{text}** *:･ﾟ✧*:･ﾟ✧")

    @bot.command(name="hearttext", aliases=["сердечки"])
    async def hearttext_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"♡ ──────── {text} ──────── ♡")

    @bot.command(name="arrowbox", aliases=["стрелки"])
    async def arrowbox_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"»»————- **{text}** ————-««")

    @bot.command(name="bulletlist", aliases=["список_маркер"])
    async def bulletlist_cmd(ctx, *, items: str):
        await bot.handle_slowmode(ctx.channel)
        parts = [f"• {p.strip()}" for p in items.split("|")]
        await ctx.send("\n".join(parts))

    @bot.command(name="numlist", aliases=["список_нумер"])
    async def numlist_cmd(ctx, *, items: str):
        await bot.handle_slowmode(ctx.channel)
        parts = [f"`{i+1}.` {p.strip()}" for i, p in enumerate(items.split("|"))]
        await ctx.send("\n".join(parts))

    @bot.command(name="warnbox", aliases=["предупреждение_блок"])
    async def warnbox_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"⚠️ **[ВНИМАНИЕ]** ⚠️\n> {text}")

    @bot.command(name="infobox", aliases=["инфо_блок"])
    async def infobox_cmd(ctx, *, text: str):
        await bot.handle_slowmode(ctx.channel)
        await ctx.send(f"ℹ️ **[ИНФОРМАЦИЯ]**\n> {text}")
