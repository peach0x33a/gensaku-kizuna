import { BotContext } from "../context";
import { CommandContext, InlineKeyboard } from "grammy";

export async function statusCommand(ctx: CommandContext<BotContext>) {
    const checkingMsg = await ctx.reply(ctx.t("checking-status"));

    // 1. Check Telegram API Latency
    const start = Date.now();
    try {
        await ctx.api.getMe();
    } catch (e) {
        console.error("Failed to ping Telegram API:", e);
    }
    const telegramLatency = Date.now() - start;

    // 2. Check Core API / Pixiv Latency (existing logic)
    let coreStatusMsg = "";
    try {
        const response = await fetch(`${ctx.coreApiUrl}/api/health/pixiv`);
        const data = await response.json() as { status: string, latency?: number, message?: string };

        if (data.status === "ok") {
            coreStatusMsg = ctx.t("pixiv-reachable", { latency: data.latency ?? 0 });
        } else {
            coreStatusMsg = ctx.t("pixiv-error", { message: data.message ?? "Unknown error" });
        }
    } catch (error: any) {
        coreStatusMsg = ctx.t("core-unreachable", { message: error.message });
    }

    const keyboard = new InlineKeyboard()
        .text(ctx.t("btn-test-artist"), "cmd:test_artist")
        .text(ctx.t("btn-test-illust"), "cmd:test_illust");

    const message = ctx.t("status-message", {
        telegramLatency,
        coreStatusMsg
    });

    // Edit the initial message or send a new one?
    // Usually editing is cleaner, but let's stick to ctx.reply for simplicity or edit if possible.
    // context.reply returns the message object.
    
    // We'll just edit the text of the "Checking status..." message if possible, or send a new one.
    // Grammy `ctx.reply` returns the message. We can use `ctx.api.editMessageText`.
    
    try {
        await ctx.api.editMessageText(
            ctx.chat.id, 
            checkingMsg.message_id, 
            message, 
            { reply_markup: keyboard }
        );
    } catch (e) {
        // Fallback if edit fails (e.g. message too old, which is unlikely here)
        await ctx.reply(message, { reply_markup: keyboard });
    }
}
