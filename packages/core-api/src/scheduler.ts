
import cron from "node-cron";
import { CoreDB } from "./database";
import { PixivClient } from "./client";

export class CoreScheduler {
    constructor(
        private db: CoreDB,
        private client: PixivClient,
        private botWebhookUrl: string
    ) { }

    start() {
        // Poll every 15 minutes
        cron.schedule("*/15 * * * *", () => {
            this.poll();
        });
        console.log("Core Scheduler started monitoring artists.");
    }

    async poll() {
        console.log("Polling monitored artists...");
        const artists = this.db.getAllMonitoredArtists();

        for (const artist of artists) {
            try {
                // Fetch latest works
                const res = await this.client.getUserIllusts(artist.artist_id, "illust");
                if (!res.illusts || res.illusts.length === 0) continue;

                const latestIllust = res.illusts[0];
                const latestId = latestIllust.id.toString();

                // Check for updates
                if (artist.last_pid !== latestId) {
                    console.log(`New artwork found for ${artist.artist_id}: ${latestId}`);

                    // Notify Bot
                    await this.notifyBot(artist.artist_id, latestIllust);

                    // Update DB
                    this.db.updateLastPid(artist.artist_id, latestId);
                }
            } catch (e) {
                console.error(`Error polling artist ${artist.artist_id}:`, e);
            }
        }
    }

    async notifyBot(artistId: string, illust: any) {
        if (!this.botWebhookUrl) {
            console.error("BOT_WEBHOOK_URL is not set!");
            return;
        }

        try {
            await fetch(this.botWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "new_artwork",
                    artist_id: artistId,
                    illust: illust
                })
            });
        } catch (e) {
            console.error("Failed to call Bot Webhook:", e);
        }
    }
}
