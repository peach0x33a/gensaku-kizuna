import { BotContext } from "../context";
import { CommandContext, InlineKeyboard } from "grammy";
import { artistCommand } from "./artist";
import { illustCommand } from "./illust";
import { generateSubscriptionListMessage } from "./list";

export async function startCommand(ctx: CommandContext<BotContext>) {
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
                    console.error("Failed to edit message for list callback", e);
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
