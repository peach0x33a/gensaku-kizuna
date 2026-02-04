
import { Context as HonoContext, Hono } from "hono";
import { BotContext } from "./context";
import { Bot, InlineKeyboard } from "grammy";
import { DB } from "./database";

export class WebhookServer {
    private app: Hono;

    // Added DB to constructor
    constructor(private bot: Bot<BotContext>, private db: DB) {
        this.app = new Hono();
        this.setupRoutes();
    }

    private setupRoutes() {
        this.app.post("/webhook", async (c: HonoContext) => {
            const body = await c.req.json();

            if (body.type === "new_artwork") {
                await this.handleNewArtwork(body.artist_id, body.illust);
                return c.json({ status: "ok" });
            }

            return c.json({ error: "Unknown type" }, 400);
        });
    }

    private async handleNewArtwork(artistId: string, illust: any) {
        console.log(`Received Webhook: New artwork from ${artistId} (${illust.id})`);

        // Find subscribers
        const allSubs = this.db.getAllSubscriptions();
        console.log(`DEBUG: Total subscriptions in DB: ${allSubs.length}`);

        // Ensure type matching (DB stores as string, payload as string usually)
        // Using loose equality (==) to handle string/number mismatch
        const subscribers = allSubs.filter(s => s.illustrator_id == artistId);
        console.log(`DEBUG: Found ${subscribers.length} subscribers for artist ${artistId}`);

        if (subscribers.length === 0) {
            console.log("DEBUG: No subscribers found for this artist.");
            return;
        }

        console.log(`DEBUG: Notifying ${subscribers.length} users...`);

        const caption = `<b>${illust.title}</b>\nby ${illust.user.name}\n\n<a href="https://www.pixiv.net/artworks/${illust.id}">View on Pixiv</a>`;

        // Handle proxy URL
        const largeUrl = illust.image_urls.large || "";
        const imageUrl = largeUrl.replace("i.pximg.net", "i.pixiv.re");

        const keyboard = new InlineKeyboard()
            .url("Open in Pixiv", `https://www.pixiv.net/artworks/${illust.id}`)
            .text("Download Original", `orig:${illust.id}`);

        for (const sub of subscribers) {
            try {
                console.log(`DEBUG: Sending photo to user ${sub.user_id}...`);
                await this.bot.api.sendPhoto(sub.user_id, imageUrl, {
                    caption,
                    parse_mode: "HTML",
                    reply_markup: keyboard
                });
                console.log(`DEBUG: Sent photo to user ${sub.user_id}`);
            } catch (e: any) {
                console.error(`DEBUG: Failed to notify user ${sub.user_id}:`, e.message || e);
                // Fallback
                try {
                    console.log(`DEBUG: Fallback to text for user ${sub.user_id}...`);
                    await this.bot.api.sendMessage(sub.user_id, `New Artwork: ${illust.title}\n${illust.image_urls.large}`);
                } catch (e2: any) {
                    console.error(`DEBUG: Fallback failed for user ${sub.user_id}:`, e2.message);
                }
            }
        }
    }

    start(port: number) {
        console.log(`Webhook server listening on port ${port}`);
        return {
            port: port,
            fetch: this.app.fetch,
        };
    }
}
