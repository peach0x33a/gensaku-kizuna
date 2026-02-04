
import { BotContext } from "../context";
import { CommandContext, InputFile, InlineKeyboard, HearsContext } from "grammy";
import { UserDetail } from "@gensaku-kizuna/core-api";

// Accept a broader context that includes BotContext properties
export async function artistCommand(ctx: BotContext) {
    // @ts-ignore: match property type varies between Command and Hears
    let args = ctx.match;
    let input: string | undefined;

    if (typeof args === "string") {
        input = args.trim();
        if (!input) {
            await ctx.reply("Usage: /artist <artist_id> or <url>");
            return;
        }
    } else if (Array.isArray(args)) {
        // Regex match from hears()
        input = args[1]; // Captured group
    }

    if (!input) return;

    // Match ID from URL (e.g. .../users/123) or direct digits
    const idMatch = input.match(/\/users\/(\d+)/) || input.match(/^(\d+)$/);

    if (!idMatch) {
        // If input was already just digits (from regex capture), use it
        if (/^\d+$/.test(input)) {
            // proceed with input as id
        } else {
            await ctx.reply("Invalid input. Please provide a User ID or Pixiv User URL.");
            return;
        }
    }

    // If we matched a regex in bot.ts, args[1] is likely the ID directly if the regex was specific.
    const artistId = idMatch ? idMatch[1] : input;

    if (!ctx.chat) return;

    const LOADING_MSG = await ctx.reply("🔍 Searching...");

    try {
        await ctx.replyWithChatAction("typing");

        // Fetch Artist Detail
        const res = await fetch(`${ctx.coreApiUrl}/api/user/${artistId}`);
        if (!res.ok) {
            await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id);
            if (res.status === 500) {
                await ctx.reply("Artist not found (Pixiv API returned 404/500).");
                return;
            }
            await ctx.reply(`Failed to fetch artist: ${res.statusText}`);
            return;
        }

        const data = await res.json() as UserDetail;
        const user = data.user;
        const profile = data.profile;

        const caption = `<b>${user.name}</b> (ID: ${user.id})\n\n` +
            `🖼️ Illusts: ${profile.total_illusts}\n` +
            `📚 Manga: ${profile.total_manga}\n` +
            `👥 Followers: ${profile.total_follow_users}\n` +
            `🔗 <a href="https://www.pixiv.net/users/${user.id}">Pixiv Profile</a>`;

        // Proxy Profile Image via pixiv.re
        const imageUrl = user.profile_image_urls.medium.replace("i.pximg.net", "i.pixiv.re");

        await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id);

        try {
            await ctx.replyWithPhoto(imageUrl, {
                caption: caption,
                parse_mode: "HTML",
                reply_markup: new InlineKeyboard()
                    .url("Open in Pixiv", `https://www.pixiv.net/users/${user.id}`)
                    .text("Subscribe", `sub:${user.id}`)
            });
        } catch (e) {
            console.error("Failed to send photo via pixiv.re, falling back to text:", e);
            await ctx.reply(caption, { parse_mode: "HTML" });
        }


    } catch (error) {
        console.error("Artist command error:", error);
        if (ctx.chat) {
            try { await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id); } catch { }
            await ctx.reply(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
