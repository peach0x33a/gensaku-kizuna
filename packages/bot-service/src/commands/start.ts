import { BotContext } from "../context";
import { CommandContext, InlineKeyboard } from "grammy";
import { logger } from "../utils";
import { artistCommand } from "./artist";
import { illustCommand } from "./illust";
import { generateSubscriptionListMessage } from "./list";

export async function startCommand(ctx: CommandContext<BotContext>) {
    // Handle start payloads (deep linking)
    const payload = ctx.match;
    if (payload && typeof payload === 'string') {
        if (payload.startsWith("artist_")) {
            const id = payload.replace("artist_", "");
            // @ts-ignore
            ctx.match = id;
            await artistCommand(ctx);
            return;
        } else if (payload.startsWith("illust_")) {
            const id = payload.replace("illust_", "");
            // @ts-ignore
            ctx.match = id;
            await illustCommand(ctx);
            return;
        }
    }

    const keyboard = new InlineKeyboard()
        .text(ctx.t("btn-check-subs"), "cmd:list")
        .text(ctx.t("btn-help"), "cmd:help");

    await ctx.reply(ctx.t("welcome-message"), { reply_markup: keyboard });
}

export async function handleStartCallbacks(ctx: BotContext, action: string) {
    switch (action) {
        case "list":
            const userId = ctx.from?.id.toString();
            if (userId) {
                const { text, keyboard } = await generateSubscriptionListMessage(ctx, userId);
                try {
                    await ctx.editMessageText(text, {
                        parse_mode: "HTML",
                        reply_markup: keyboard,
                        link_preview_options: { is_disabled: true }
                    });
                } catch (e) {
                    // Fallback to reply if edit fails (e.g. message too old)
                    logger.error("Failed to edit message for list callback", e);
                    await ctx.reply(text, {
                        parse_mode: "HTML",
                        reply_markup: keyboard,
                        link_preview_options: { is_disabled: true }
                    });
                }
            }
            break;
        case "help":
            await ctx.reply(ctx.t("help-message"));
            break;
        case "test_artist":
            // @ts-ignore
            ctx.match = "6586231";
            await artistCommand(ctx);
            break;
        case "test_illust":
            // @ts-ignore
            ctx.match = "140586969";
            await illustCommand(ctx);
            break;
    }
    await ctx.answerCallbackQuery();
}
