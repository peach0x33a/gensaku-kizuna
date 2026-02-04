import { Bot, InputFile } from "grammy";
import { BotContext } from "./context";
import { DB } from "./database";
import cron from "node-cron";
import { Buffer } from "buffer";

export class Scheduler {
    constructor(
        private bot: Bot<BotContext>,
        private db: DB,
        private coreApiUrl: string
    ) { }

    start() {
        // Poll every 15 minutes
        cron.schedule("*/15 * * * *", () => {
            this.poll();
        });
        console.log("Scheduler started (every 15 mins).");
    }

    async poll() {
        console.log("Polling for updates...");
        const subs = this.db.getAllSubscriptions();

        // Group by artist to avoid duplicate requests
        const artistSubs = new Map<string, string[]>(); // artistId -> [userIds]

        for (const sub of subs) {
            const users = artistSubs.get(sub.illustrator_id) || [];
            users.push(sub.user_id);
            artistSubs.set(sub.illustrator_id, users);
        }

        for (const [artistId, userIds] of artistSubs) {
            try {
                const res = await fetch(`${this.coreApiUrl}/api/user/${artistId}/illusts?type=illust`);
                if (!res.ok) {
                    console.error(`Failed to fetch illusts for ${artistId}: ${res.status}`);
                    continue;
                }

                const data = await res.json() as { illusts: any[] };
                const latestIllust = data.illusts[0];

                if (!latestIllust) continue;

                const latestId = latestIllust.id.toString();

                // Notify users if new
                for (const userId of userIds) {
                    const sub = subs.find(s => s.user_id === userId && s.illustrator_id === artistId);

                    if (sub && sub.last_pid !== latestId) {
                        await this.notifyUser(userId, latestIllust);
                        this.db.updateLastPid(userId, artistId, latestId);
                    }
                }

            } catch (e) {
                console.error(`Error processing artist ${artistId}:`, e);
            }
        }
    }

    async notifyUser(userId: string, illust: any) {
        try {
            const caption = `<b>${illust.title}</b>\nby ${illust.user.name}\n\n<a href="https://www.pixiv.net/artworks/${illust.id}">View on Pixiv</a>`;

            const imageUrl = illust.image_urls.large;
            const proxyUrl = `${this.coreApiUrl}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;

            const imageRes = await fetch(proxyUrl);
            if (imageRes.ok) {
                // Buffer it
                const arrayBuffer = await imageRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                await this.bot.api.sendPhoto(userId, new InputFile(buffer), {
                    caption,
                    parse_mode: "HTML"
                });
            } else {
                await this.bot.api.sendMessage(userId, `New Artwork: ${illust.title}\n${illust.image_urls.large}`);
            }

        } catch (error) {
            console.error(`Failed to notify user ${userId}:`, error);
        }
    }
}
