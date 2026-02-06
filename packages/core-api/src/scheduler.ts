import { CoreDB } from "./database";
import { PixivClient } from "./client";
import { logger } from "./utils";
import { loadConfig } from "./config";

export class CoreScheduler {
    private pollIntervalMs: number;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private isPolling: boolean = false;

    constructor(
        private db: CoreDB,
        private client: PixivClient,
        private botWebhookUrl: string
    ) {
        const config = loadConfig();
        // Fallback to 900 seconds (15 minutes) if not configured
        const seconds = config.pollInterval || 900;
        this.pollIntervalMs = seconds * 1000;
    }

    start() {
        logger.info(`Core Scheduler started monitoring artists. Poll interval: ${this.pollIntervalMs / 1000}s`);
        // Start polling immediately, then schedule next
        this.poll().then(() => {
            this.scheduleNextPoll();
        }).catch(err => {
            logger.error("Initial poll failed:", err);
            this.scheduleNextPoll();
        });
    }

    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        logger.info("Core Scheduler stopped.");
    }

    private scheduleNextPoll() {
        // Clear existing timer if any
        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.timer = setTimeout(async () => {
            try {
                await this.poll();
            } catch (error) {
                logger.error("Error during scheduled poll:", error);
            } finally {
                this.scheduleNextPoll();
            }
        }, this.pollIntervalMs);
    }

    async poll(artistId?: string) {
        if (this.isPolling && !artistId) {
            logger.warn("Polling already in progress, skipping this cycle.");
            return { updatedCount: 0, checkedCount: 0, lastCheckedIllustId: null };
        }

        this.isPolling = true;
        let updatedCount = 0;
        let checkedCount = 0;
        let lastCheckedIllustId: string | null = null;

        try {
            if (artistId) {
                logger.info(`Force polling artist ${artistId}...`);
                const artist = this.db.getMonitoredArtist(artistId);
                if (artist) {
                    const result = await this.checkArtistUpdates(artist);
                    checkedCount++;
                    if (result.updated) updatedCount++;
                    if (result.latestId) lastCheckedIllustId = result.latestId;
                } else {
                    logger.warn(`Artist ${artistId} is not monitored.`);
                }
            } else {
                logger.info("Polling all monitored artists...");
                const artists = this.db.getAllMonitoredArtists();
                
                for (const artist of artists) {
                    const result = await this.checkArtistUpdates(artist);
                    checkedCount++;
                    if (result.updated) updatedCount++;
                    if (result.latestId) lastCheckedIllustId = result.latestId; 
                }
            }
        } finally {
            this.isPolling = false;
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
            logger.debug(`Polling artist ${artist.artist_id}. Found ${res.illusts?.length ?? 0} illusts.`);

            if (!res.illusts || res.illusts.length === 0) {
                return { updated, latestId, artistId: artist.artist_id };
            }

            const latestIllust = res.illusts[0];
            latestId = latestIllust.id.toString();
            const artistName = latestIllust.user?.name;

            // [DEBUG] Log check details
            logger.debug(`Artist ${artist.artist_id}: Latest ID=${latestId}, Last Known=${artist.last_pid}`);
            logger.debug(`Latest Illust Title: ${latestIllust.title}`);

            // Always update name if available, even if PID hasn't changed, to keep it fresh
            if (artistName && artist.artist_name !== artistName) {
                this.db.updateLastPid(artist.artist_id, artist.last_pid || latestId, artistName);
            }

            // Check for updates
            if (artist.last_pid !== latestId) {
                logger.info(`New artwork found for ${artist.artist_id}: ${latestId}`);

                // Notify Bot
                await this.notifyBot(artist.artist_id, latestIllust);

                // Update DB
                this.db.updateLastPid(artist.artist_id, latestId, artistName);
                updated = true;
            }
        } catch (e) {
            logger.error(`Error polling artist ${artist.artist_id}:`, e);
        }

        return { updated, latestId, artistId: artist.artist_id };
    }

    async notifyBot(artistId: string, illust: any) {
        if (!this.botWebhookUrl) {
            logger.error("BOT_WEBHOOK_URL is not set!");
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
            logger.error("Failed to call Bot Webhook:", e);
        }
    }
}
