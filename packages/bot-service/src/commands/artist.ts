import { BotContext } from "../context";
import { CommandContext, InlineKeyboard, HearsContext, Api } from "grammy";
import { UserDetail } from "@gensaku-kizuna/core-api";
import { cleanId, logger } from "../utils";

// Accept a broader context that includes BotContext properties
export async function artistCommand(ctx: BotContext) {
    // @ts-ignore: match property type varies between Command and Hears
    let args = ctx.match;
    let input: string | undefined;

    if (typeof args === "string") {
        input = args.trim();
        if (!input) {
            await ctx.reply(ctx.t("usage-artist"));
            return;
        }
    } else if (Array.isArray(args)) {
        // Regex match from hears()
        input = args[1]; // Captured group
    }

    if (!input) return;

    // Remove invisible characters that might interfere with regex
    input = input.replace(/[\u2068\u2069]/g, '');

    // Match ID from URL (e.g. .../users/123) or direct digits
    const idMatch = input.match(/\/users\/(\d+)/) || input.match(/^(\d+)$/);

    if (!idMatch) {
        // If input was already just digits (from regex capture), use it
        if (/^\d+$/.test(input)) {
            // proceed with input as id
        } else {
            await ctx.reply(ctx.t("invalid-input"));
            return;
        }
    }

    // If we matched a regex in bot.ts, args[1] is likely the ID directly if the regex was specific.
    const artistId = cleanId(idMatch ? idMatch[1] : input);

    if (!ctx.chat) return;

    const LOADING_MSG = await ctx.reply(ctx.t("searching"));

    try {
        await ctx.replyWithChatAction("typing");
        await sendArtist(ctx, artistId, LOADING_MSG.message_id);
    } catch (error) {
        logger.error("Artist command error:", error);
        if (ctx.chat) {
            try { await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id); } catch { }
            await ctx.reply(ctx.t("error-generic") + `: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export async function sendArtist(ctx: BotContext, artistId: string, loadingMessageId?: number) {
    if (!ctx.chat) return;

    // Fetch Artist Detail
    const res = await fetch(`${ctx.coreApiUrl}/api/user/${artistId}`);
    if (!res.ok) {
        if (loadingMessageId) {
            try { await ctx.api.deleteMessage(ctx.chat.id, loadingMessageId); } catch {}
        }
        if (res.status === 500) {
            await ctx.reply(ctx.t("artist-not-found"));
            return;
        }
        await ctx.reply(ctx.t("error-validating-artist", { error: res.statusText }));
        return;
    }

    const data = await res.json() as UserDetail;
    const user = data.user;
    const profile = data.profile;

    const caption = ctx.t("artist-caption", {
        name: user.name,
        id: String(user.id),
        illusts: profile.total_illusts,
        manga: profile.total_manga,
        followers: profile.total_follow_users
    });

    // Proxy Profile Image via pixiv.re
    const imageUrl = user.profile_image_urls.medium.replace("i.pximg.net", "i.pixiv.re");

    if (loadingMessageId) {
        try { await ctx.api.deleteMessage(ctx.chat.id, loadingMessageId); } catch {}
    }

    const userId = ctx.from?.id.toString();
    const isSubscribed = userId ? ctx.db.getSubscriptions(userId).some(s => s.illustrator_id === String(user.id)) : false;

    const keyboard = new InlineKeyboard()
        .url(ctx.t("btn-open-pixiv"), `https://www.pixiv.net/users/${user.id}`)
        .text(
            isSubscribed ? ctx.t("btn-unsubscribe") : ctx.t("subscribe"),
            isSubscribed ? `unsub:${user.id}` : `sub:${user.id}`
        )
        .row()
        .text(ctx.t("btn-view-artist-latest"), `view_artist_latest:${user.id}`);

    try {
        await ctx.replyWithPhoto(imageUrl, {
            caption: caption,
            parse_mode: "HTML",
            reply_markup: keyboard
        });
    } catch (e) {
        logger.error("Failed to send photo via pixiv.re, falling back to text:", e);
        await ctx.reply(caption, {
            parse_mode: "HTML",
            reply_markup: keyboard
        });
    }
}
