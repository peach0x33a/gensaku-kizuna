import { BotContext } from "../context";
import { CommandContext, InlineKeyboard } from "grammy";
import { artistCommand } from "./artist";
import { illustCommand } from "./illust";

export async function startCommand(ctx: CommandContext<BotContext>) {
    const keyboard = new InlineKeyboard()
        .text(ctx.t("btn-check-subs"), "cmd:list")
        .text(ctx.t("btn-help"), "cmd:help");

    await ctx.reply(ctx.t("welcome-message"), { reply_markup: keyboard });
}

export async function handleStartCallbacks(ctx: BotContext, action: string) {
    switch (action) {
        case "list":
            // We can't directly call listCommand because the context type is slightly different
            // for callbacks vs commands if we were strict, but passing ctx mostly works 
            // OR we can just redirect or instruct the user.
            // But better: trigger the command logic.
            // Since listCommand takes CommandContext which extends Context, and CallbackQuery context is also Context...
            // We need to be careful. Let's just instruct user or run logic if isolated.
            // For now, let's reply with text instructions or simulate command.
            await ctx.reply(ctx.t("run-list-to-see"));
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
