import { BotContext } from "../context";
import { CommandContext } from "grammy";

export async function subscribeLogic(ctx: BotContext, artistId: string, userId: string) {
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

        // Fetch latest illust to initialize last_pid
        let lastPid: string | undefined;
        try {
            const illustsRes = await fetch(`${ctx.coreApiUrl}/api/user/${artistId}/illusts?type=illust`);
            if (illustsRes.ok) {
                const illustsData = await illustsRes.json() as { illusts: any[] };
                if (illustsData.illusts.length > 0) {
                    lastPid = illustsData.illusts[0].id.toString();
                }
            }
        } catch (e) {
            console.error("Failed to fetch initial last_pid", e);
        }

        // 2. Add to DB (Local Bot Subscription)
        ctx.db.addSubscription(userId, artistId);

        // 3. Notify Core API to Monitor
        try {
            await fetch(`${ctx.coreApiUrl}/api/monitor`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    artist_id: artistId,
                    last_pid: lastPid // Pass the latest PID we found so it doesn't alert immediately
                })
            });
        } catch (e) {
            console.error("Failed to register monitor with Core API", e);
        }

        // 4. Confirm
        await ctx.reply(`Subscribed to **${artistName}** (ID: ${artistId})!${lastPid ? "" : "\n(No artworks found yet)"}`, {
            parse_mode: "Markdown",
        });
    } catch (error: any) {
        console.error(error);
        await ctx.reply(`Failed to subscribe: ${error.message}`);
    }
}

export async function subscribeCommand(ctx: CommandContext<BotContext>) {
    const args = ctx.match;
    if (!args) {
        return ctx.reply("Usage: /subscribe <artist_id>");
    }

    const artistId = args.trim();
    const userId = ctx.from?.id.toString();

    if (!userId) return;

    await subscribeLogic(ctx, artistId, userId);
}
