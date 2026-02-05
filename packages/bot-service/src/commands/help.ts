import { BotContext } from "../context";
import { CommandContext } from "grammy";

export async function helpCommand(ctx: CommandContext<BotContext>) {
    await ctx.reply(ctx.t("help-message"));
}
