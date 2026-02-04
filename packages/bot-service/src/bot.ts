import { Bot, Context } from "grammy";
import { DB } from "./database";
import { WebhookServer } from "./webhook";
import { subscribeCommand, subscribeLogic } from "./commands/subscribe";
import { listCommand } from "./commands/list";
import { helpCommand } from "./commands/help";
import { artistCommand } from "./commands/artist";
import { illustCommand, downloadOriginalLogic } from "./commands/illust";

import { BotContext } from "./context";

export class GensakuBot {
    private bot: Bot<BotContext>;
    private db: DB;
    private webhookServer: WebhookServer;

    constructor(token: string, coreApiUrl: string, dbPath?: string) {
        this.db = new DB(dbPath);
        this.bot = new Bot<BotContext>(token);
        this.webhookServer = new WebhookServer(this.bot, this.db);

        // Logger Middleware (Incoming)
        this.bot.use(async (ctx, next) => {
            const time = new Date().toISOString();
            const user = ctx.from;
            const username = user?.username || user?.first_name || "Unknown";
            const userId = user?.id || "Unknown";
            const msg = ctx.message?.text || ctx.callbackQuery?.data || (ctx.message?.photo ? '[Photo]' : '[Non-text update]');

            console.log(`[${time}] FROM ${username} (${userId}): ${msg}`);
            await next();
        });

        // Logger Transformer (Outgoing)
        this.bot.api.config.use(async (prev, method, payload, signal) => {
            const res = await prev(method, payload, signal);
            const time = new Date().toISOString();

            // Only log sending methods
            if (method.startsWith("send") || method === "copyMessage") {
                const p = payload as any;
                const targetId = p.chat_id;
                const text = p.text || p.caption || `[${method}]`;
                console.log(`[${time}] TO ${targetId}: ${text}`);
            }
            return res;
        });

        // Middleware to inject context
        this.bot.use(async (ctx, next) => {
            ctx.db = this.db;
            ctx.coreApiUrl = coreApiUrl;
            await next();
        });

        // Commands
        this.bot.command("subscribe", subscribeCommand);
        this.bot.command("list", listCommand);
        this.bot.command("help", helpCommand);
        this.bot.command("artist", (ctx) => artistCommand(ctx as unknown as BotContext));
        this.bot.command("illust", (ctx) => illustCommand(ctx as unknown as BotContext));

        // Auto-parsing (Regex)
        // Match user profiles: https://www.pixiv.net/users/123 or /en/users/123
        const userUrlRegex = /pixiv\.net\/(?:en\/)?users\/(\d+)/;
        this.bot.hears(userUrlRegex, (ctx) => artistCommand(ctx as unknown as BotContext));

        // Match artworks: https://www.pixiv.net/artworks/123 or /en/artworks/123

        const artworkUrlRegex = /pixiv\.net\/(?:en\/)?artworks\/(\d+)/;
        this.bot.hears(artworkUrlRegex, (ctx) => illustCommand(ctx as unknown as BotContext));

        // Callback Queries
        this.bot.on("callback_query:data", async (ctx) => {
            const data = ctx.callbackQuery.data;
            const userId = ctx.from.id.toString();

            if (data.startsWith("sub:")) {
                const artistId = data.split(":")[1];
                await ctx.answerCallbackQuery(); // Stop loading animation
                await subscribeLogic(ctx as unknown as BotContext, artistId, userId);
            } else if (data.startsWith("orig:")) {
                const illustId = data.split(":")[1];
                await ctx.answerCallbackQuery("Sending document...");
                await downloadOriginalLogic(ctx as unknown as BotContext, illustId);
            }
        });

        // Error handling
        this.bot.catch((err) => {
            console.error("Bot Error:", err);
        });
    }

    async start() {
        console.log("Starting Bot...");

        // Start Webhook Server
        const webhookPort = parseInt(process.env.WEBHOOK_PORT || "3001");
        Bun.serve(this.webhookServer.start(webhookPort));

        await this.bot.start({
            onStart: (botInfo) => {
                console.log(`Bot @${botInfo.username} started!`);
            },
        });
    }
}
