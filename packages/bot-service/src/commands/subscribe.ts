import { BotContext } from "../context";
import { CommandContext } from "grammy";

export async function subscribeCommand(ctx: CommandContext<BotContext>) {
    const args = ctx.match;
    if (!args) {
        return ctx.reply("Usage: /subscribe <artist_id>");
    }

    const artistId = args.trim();
    const userId = ctx.from?.id.toString();

    if (!userId) return;

    try {
        // 1. Validate artist via Core API
        const response = await fetch(`${ctx.coreApiUrl}/api/user/${artistId}`);
        if (!response.ok) {
            if (response.status === 404) {
                return ctx.reply("Artist not found.");
            }
            return ctx.reply(`Error validating artist: ${response.statusText}`);
        }

        const data = await response.json() as { user: { name: string; id: string } };
        const artistName = data.user.name;

        // 2. Add to DB
        ctx.db.addSubscription(userId, artistId);

        // 3. Confirm
        await ctx.reply(`Subscribed to **${artistName}** (ID: ${artistId})!`, {
            parse_mode: "Markdown",
        });
    } catch (error: any) {
        console.error(error);
        await ctx.reply(`Failed to subscribe: ${error.message}`);
    }
}
