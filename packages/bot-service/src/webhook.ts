
import { Context as HonoContext, Hono } from "hono";
import { BotContext } from "./context";
import { Bot, InlineKeyboard } from "grammy";
import { DB } from "./database";
import { i18n } from "./locales";
import { logDebug, escapeHtml } from "./utils";
import { formatIllustMessage } from "./messages";
import { sendIllustToChat } from "./commands/illust";

export class WebhookServer {
    private app: Hono;

    // Added DB to constructor
    constructor(private bot: Bot<BotContext>, private db: DB, private coreApiUrl?: string) {
        this.app = new Hono();
        this.setupRoutes();
    }

    private setupRoutes() {
        this.app.post("/webhook", async (c: HonoContext) => {
            try {
                const body = await c.req.json();

                if (body.type === "new_artwork") {
                    await this.handleNewArtwork(body.artist_id, body.illust);
                    return c.json({ status: "ok" });
                }

                console.warn(`Webhook received unknown type: ${body.type}`);
                return c.json({ error: "Unknown type" }, 400);
            } catch (e: any) {
                console.error("Error processing webhook:", e);
                return c.json({ error: e.message }, 500);
            }
        });
    }

    private async handleNewArtwork(artistId: string, illust: any) {
        console.log(`Received Webhook: New artwork from ${artistId} (${illust.id})`);

        // Find subscribers
        const allSubs = this.db.getAllSubscriptions();
        logDebug(`Total subscriptions in DB: ${allSubs.length}`);

        // Ensure type matching (DB stores as string, payload as string usually)
        // Using loose equality (==) to handle string/number mismatch
        const subscribers = allSubs.filter(s => s.illustrator_id == artistId);
        logDebug(`Found ${subscribers.length} subscribers for artist ${artistId}`);

        if (subscribers.length === 0) {
            logDebug("No subscribers found for this artist.");
            return;
        }

        logDebug(`Notifying ${subscribers.length} users...`);

        // We assume 'en' for now, but ideally we'd fetch user locale from DB
        const locale = "en";
        const t = (key: string, args?: any) => i18n.t(locale, key, args);

        for (const sub of subscribers) {
            try {
                logDebug(`Sending update to user ${sub.user_id}...`);
                
                // Use shared logic for consistent style
                if (this.coreApiUrl) {
                    await sendIllustToChat(
                        this.bot.api, 
                        sub.user_id, 
                        illust, 
                        t,
                        this.coreApiUrl
                    );
                } else {
                    console.error("Core API URL missing in WebhookServer!");
                    // Fallback to basic if config missing (shouldn't happen)
                    const messageData = formatIllustMessage(illust, t);
                     await this.bot.api.sendPhoto(sub.user_id, messageData.media as string, {
                        caption: messageData.caption,
                        parse_mode: messageData.parse_mode,
                        reply_markup: messageData.reply_markup,
                        has_spoiler: messageData.has_spoiler
                    });
                }
                
                logDebug(`Sent update to user ${sub.user_id}`);
            } catch (e: any) {
                console.error(`DEBUG: Failed to notify user ${sub.user_id}:`, e.message || e);
                // Fallback
                try {
                    logDebug(`Fallback to text for user ${sub.user_id}...`);
                    await this.bot.api.sendMessage(sub.user_id, t("fallback-text", { title: escapeHtml(illust.title) }) + `\n${illust.image_urls.large}`);
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

