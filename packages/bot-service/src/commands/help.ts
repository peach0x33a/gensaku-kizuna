import { BotContext } from "../context";
import { CommandContext } from "grammy";

export async function helpCommand(ctx: CommandContext<BotContext>) {
    await ctx.reply(
        "Available commands:\n" +
        "/subscribe <artist_id> - Subscribe to an artist\n" +
        "/list - List your subscriptions\n" +
        "/help - Show this message"
    );
}
