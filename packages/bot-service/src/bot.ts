import { Bot, Context } from "grammy";
import { DB } from "./database";
import { Scheduler } from "./scheduler";
import { subscribeCommand } from "./commands/subscribe";
import { listCommand } from "./commands/list";
import { helpCommand } from "./commands/help";

import { BotContext } from "./context";

export class GensakuBot {
    private bot: Bot<BotContext>;
    private db: DB;
    private scheduler: Scheduler;

    constructor(token: string, coreApiUrl: string, dbPath?: string) {
        this.db = new DB(dbPath);
        this.bot = new Bot<BotContext>(token);
        this.scheduler = new Scheduler(this.bot, this.db, coreApiUrl);

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

        // Error handling
        this.bot.catch((err) => {
            console.error("Bot Error:", err);
        });
    }

    async start() {
        console.log("Starting Bot...");
        // Start scheduler
        this.scheduler.start();

        await this.bot.start({
            onStart: (botInfo) => {
                console.log(`Bot @${botInfo.username} started!`);
            },
        });
    }
}
