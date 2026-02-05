import cron from "node-cron";
import { CoreDB } from "./database";
import { PixivClient } from "./client";
import { logDebug } from "./utils";

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

    async poll(artistId?: string) {
        let updatedCount = 0;
        let checkedCount = 0;
        let lastCheckedIllustId: string | null = null;

        if (artistId) {
            console.log(`Force polling artist ${artistId}...`);
            const artist = this.db.getMonitoredArtist(artistId);
            if (artist) {
                const result = await this.checkArtistUpdates(artist);
                checkedCount++;
                if (result.updated) updatedCount++;
                if (result.latestId) lastCheckedIllustId = result.latestId;
            } else {
                console.warn(`Artist ${artistId} is not monitored.`);
            }
            return { updatedCount, checkedCount, lastCheckedIllustId };
        }

        console.log("Polling all monitored artists...");
        const artists = this.db.getAllMonitoredArtists();

        for (const artist of artists) {
            const result = await this.checkArtistUpdates(artist);
            checkedCount++;
            if (result.updated) updatedCount++;
            if (result.latestId) lastCheckedIllustId = result.latestId; // Keeps the last one iterated
        }

        return { updatedCount, checkedCount, lastCheckedIllustId };
    }

    private async checkArtistUpdates(artist: { artist_id: string; last_pid: string | null; artist_name?: string | null }) {
        let updated = false;
        let latestId: string | null = null;

        try {
            // Fetch latest works
            const res = await this.client.getUserIllusts(artist.artist_id, "illust");

            // [DEBUG] Log polling result
            logDebug(`Polling artist ${artist.artist_id}. Found ${res.illusts?.length ?? 0} illusts.`);

            if (!res.illusts || res.illusts.length === 0) {
                return { updated, latestId, artistId: artist.artist_id };
            }

            const latestIllust = res.illusts[0];
            latestId = latestIllust.id.toString();
            const artistName = latestIllust.user?.name;

            // [DEBUG] Log check details
            logDebug(`Artist ${artist.artist_id}: Latest ID=${latestId}, Last Known=${artist.last_pid}`);
            logDebug(`Latest Illust Title: ${latestIllust.title}`);

            // Always update name if available, even if PID hasn't changed, to keep it fresh
            if (artistName && artist.artist_name !== artistName) {
                this.db.updateLastPid(artist.artist_id, artist.last_pid || latestId, artistName);
            }

            // Check for updates
            if (artist.last_pid !== latestId) {
                console.log(`New artwork found for ${artist.artist_id}: ${latestId}`);

                // Notify Bot
                await this.notifyBot(artist.artist_id, latestIllust);

                // Update DB
                this.db.updateLastPid(artist.artist_id, latestId, artistName);
                updated = true;
            }
        } catch (e) {
            console.error(`Error polling artist ${artist.artist_id}:`, e);
        }

        return { updated, latestId, artistId: artist.artist_id };
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
