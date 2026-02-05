import { BotContext } from "../context";
import { cleanId } from "../utils";
import { loadConfig } from "../config";
import { InlineKeyboard } from "grammy";

export async function unsubscribeLogic(ctx: BotContext, artistId: string, userId: string) {
    const cleanedArtistId = cleanId(artistId);

    // 1. Check if user is subscribed
    const subscriptions = ctx.db.getUserSubscriptions(userId);
    if (!subscriptions.includes(cleanedArtistId)) {
        return { success: false, message: ctx.t("unsubscribe-not-subscribed", { id: cleanedArtistId }) };
    }

    // 2. Remove subscription from Bot DB
    ctx.db.removeSubscription(userId, cleanedArtistId);

    // 3. Check if any other user is subscribed to this artist
    const allSubs = ctx.db.getSubscribers(cleanedArtistId);
    if (allSubs.length === 0) {
        // 4. If no one else subscribed, tell Core API to stop monitoring
        try {
            const config = loadConfig();
            const coreApiUrl = ctx.coreApiUrl || config.coreApi.url;
            await fetch(`${coreApiUrl}/api/monitored-artist/${cleanedArtistId}`, {
                method: "DELETE",
            });
        } catch (e) {
            console.error(`Failed to remove monitored artist ${cleanedArtistId} from Core API:`, e);
            // Non-critical error, just log it
        }
    }

    return { success: true, message: ctx.t("unsubscribe-success", { id: cleanedArtistId }) };
}

export async function handleUnsubscribe(ctx: BotContext) {
    if (!ctx.match) {
        return ctx.reply(ctx.t("subscribe-no-id"));
    }

    const artistId = ctx.match as string;
    const userId = ctx.from?.id.toString();

    if (!userId) return;

    const result = await unsubscribeLogic(ctx, artistId, userId);
    
    if (result.success) {
        const keyboard = new InlineKeyboard().text(ctx.t("btn-resubscribe"), `sub:${cleanId(artistId)}`);
        return ctx.reply(result.message, { reply_markup: keyboard });
    } else {
        return ctx.reply(result.message);
    }
}
