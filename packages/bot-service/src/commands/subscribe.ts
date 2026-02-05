import { BotContext } from "../context";
import { CommandContext } from "grammy";
import { cleanId } from "../utils";

export async function subscribeLogic(ctx: BotContext, artistId: string, userId: string) {
    const cleanedArtistId = cleanId(artistId);
    try {
        // 1. Validate artist via Core API
        const response = await fetch(`${ctx.coreApiUrl}/api/user/${cleanedArtistId}`);
        if (!response.ok) {
            if (response.status === 404) {
                const msg = ctx.t("artist-not-found");
                await ctx.reply(msg);
                return { success: false, message: msg };
            }
            const msg = ctx.t("error-validating-artist", { error: response.statusText });
            await ctx.reply(msg);
            return { success: false, message: msg };
        }

        const data = await response.json() as { user: { name: string; id: string } };
        const artistName = data.user.name;

        // Fetch latest illust to initialize last_pid
        let lastPid: string | undefined;
        try {
            const illustsRes = await fetch(`${ctx.coreApiUrl}/api/user/${cleanedArtistId}/illusts?type=illust`);
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
        ctx.db.addSubscription(userId, cleanedArtistId);

        // 3. Notify Core API to Monitor
        try {
            await fetch(`${ctx.coreApiUrl}/api/monitor`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    artist_id: cleanedArtistId,
                    last_pid: lastPid // Pass the latest PID we found so it doesn't alert immediately
                })
            });
        } catch (e) {
            console.error("Failed to register monitor with Core API", e);
        }

        // 4. Confirm
        const message = lastPid
            ? ctx.t("subscribed-success", { name: artistName, id: cleanedArtistId })
            : ctx.t("subscribed-success-no-artworks", { name: artistName, id: cleanedArtistId });

        await ctx.reply(message, {
            parse_mode: "Markdown",
        });

        return { success: true, message };
    } catch (error: any) {
        console.error(error);
        const failMessage = ctx.t("failed-subscribe", { error: error.message });
        await ctx.reply(failMessage);
        return { success: false, message: failMessage };
    }
}

export async function subscribeCommand(ctx: CommandContext<BotContext>) {
    const args = ctx.match;
    if (!args) {
        return ctx.reply(ctx.t("usage-subscribe"));
    }

    const artistId = args.trim();
    const userId = ctx.from?.id.toString();

    if (!userId) return;

    await subscribeLogic(ctx, artistId, userId);
}
