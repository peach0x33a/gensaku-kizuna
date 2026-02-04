import { BotContext } from "../context";
import { CommandContext } from "grammy";

export async function listCommand(ctx: CommandContext<BotContext>) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const subs = ctx.db.getSubscriptions(userId);

    if (subs.length === 0) {
        return ctx.reply("You have no subscriptions.");
    }

    let message = "Your Subscriptions:\n";
    for (const sub of subs) {
        // In a real app we might cache names, but for now just show IDs or fetch names if needed.
        // fetching names for all might be slow, so we just show ID for MVP.
        // Optimization: Store artist name in DB too.
        message += `- Artist ID: \`${sub.illustrator_id}\`\n`;
    }

    await ctx.reply(message, { parse_mode: "Markdown" });
}
