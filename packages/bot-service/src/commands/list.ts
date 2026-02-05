import { BotContext } from "../context";
import { InlineKeyboard } from "grammy";
import { loadConfig } from "../config";
import { cleanId, escapeHtml } from "../utils";

export async function generateSubscriptionListMessage(ctx: BotContext, userId: string, recentlyUnsubscribedId?: string) {
    const subs = ctx.db.getSubscriptions(userId);

    // If empty and no recent unsub, return empty state with no keyboard
    if (subs.length === 0 && !recentlyUnsubscribedId) {
        return { 
            text: ctx.t("subscriptions-empty"), 
            keyboard: undefined, 
            isEmpty: true 
        };
    }

    const config = loadConfig();
    const coreApiUrl = ctx.coreApiUrl || config.coreApi.url;

    let monitoredArtists: any[] = [];
    try {
        const res = await fetch(`${coreApiUrl}/api/monitored-artists`);
        if (res.ok) {
            monitoredArtists = await res.json() as any[];
        }
    } catch (e) {
        console.error("Failed to fetch monitored artists from Core API", e);
    }

    let message = ctx.t("subscriptions-list") + "\n\n";
    
    // If empty but has recently unsubscribed, show "subscriptions empty" text but include the keyboard below
    if (subs.length === 0 && recentlyUnsubscribedId) {
        message = ctx.t("subscriptions-empty");
    } else {
        // Build list message
        for (const sub of subs) {
            const monitorInfo = monitoredArtists.find(a => a.artist_id === sub.illustrator_id);
            
            const name = monitorInfo?.artist_name || ctx.t("unknown-artist");
            const lastPid = monitorInfo?.last_pid || sub.last_pid || "N/A";
            const updatedAt = monitorInfo?.updated_at ? new Date(monitorInfo.updated_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : "N/A";

            message += ctx.t("subscriptions-list-item-detailed", {
                name: escapeHtml(name),
                id: cleanId(sub.illustrator_id),
                lastPid: cleanId(lastPid),
                updatedAt: updatedAt
            }) + "\n";
        }
    }

    const keyboard = new InlineKeyboard();
    
    // Add Unsub buttons
    for (const sub of subs) {
        const monitorInfo = monitoredArtists.find(a => a.artist_id === sub.illustrator_id);
        const name = monitorInfo?.artist_name || sub.illustrator_id;
        const display = name.length > 15 ? name.substring(0, 12) + "..." : name;
        
        keyboard.text(`${ctx.t("btn-unsubscribe")} ${display}`, `unsub:${sub.illustrator_id}`).row();
    }
    
    if (recentlyUnsubscribedId) {
        keyboard.text(ctx.t("btn-resubscribe"), `resub:${recentlyUnsubscribedId}`).row();
    }

    keyboard.text(
        ctx.t("list-update-button"),
        "force_update_all"
    );

    return { 
        text: message, 
        keyboard, 
        isEmpty: subs.length === 0 // Technically empty of subscriptions, even if keyboard is present
    };
}

export async function listCommand(ctx: BotContext) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const { text, keyboard } = await generateSubscriptionListMessage(ctx, userId);

    await ctx.reply(text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
        link_preview_options: { is_disabled: true }
    });
}
