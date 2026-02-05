import { Bot, Context, InlineKeyboard } from "grammy";
import { DB } from "./database";
import { WebhookServer } from "./webhook";
import { subscribeCommand, subscribeLogic } from "./commands/subscribe";
import { handleUnsubscribe, unsubscribeLogic } from "./commands/unsubscribe";
import { listCommand, generateSubscriptionListMessage } from "./commands/list";
import { helpCommand } from "./commands/help";
import { artistCommand, sendArtist } from "./commands/artist";
import { illustCommand, downloadOriginalLogic, downloadZipLogic, pageSelectionLogic, downloadPageLogic, sendIllust } from "./commands/illust";
import { startCommand, handleStartCallbacks } from "./commands/start";
import { statusCommand } from "./commands/status";
import { i18n } from "./locales";

import { BotContext } from "./context";

export class GensakuBot {
    private bot: Bot<BotContext>;
    private db: DB;
    private webhookServer: WebhookServer;

    constructor(token: string, coreApiUrl: string, dbPath?: string) {
        this.db = new DB(dbPath);
        this.bot = new Bot<BotContext>(token);
        this.webhookServer = new WebhookServer(this.bot, this.db, coreApiUrl);

        // Middleware
        this.bot.use(i18n);
        this.bot.use(async (ctx, next) => {
            ctx.db = this.db;
            ctx.coreApiUrl = coreApiUrl;
            await next();
        });

        // Logger Middleware (Incoming)
        this.bot.use(async (ctx, next) => {
            const time = new Date().toISOString();
            const user = ctx.from;
            const username = user?.username || user?.first_name || "Unknown";
            const userId = user?.id || "Unknown";
            const msg = ctx.message?.text || ctx.callbackQuery?.data || (ctx.message?.photo ? '[Photo]' : '[Non-text update]');

            console.log(`[${time}] <- FROM ${username} (${userId}): ${msg}`);
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
                console.log(`[${time}] -> TO ${targetId}: ${text}`);
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
        this.bot.command("start", startCommand);
        this.bot.command("status", statusCommand);
        this.bot.command("subscribe", subscribeCommand);
        this.bot.command("sub", subscribeCommand);
        this.bot.command("unsubscribe", handleUnsubscribe);
        this.bot.command("unsub", handleUnsubscribe);
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
            const coreApiUrl = ctx.coreApiUrl;

            if (data.startsWith("sub:")) {
                const artistId = data.split(":")[1];
                await ctx.answerCallbackQuery(); // Stop loading animation
                const result = await subscribeLogic(ctx as unknown as BotContext, artistId, userId);
                
                // Check if we should update list
                // We rely on checking if the message text looks like the subscription list
                const messageText = ctx.callbackQuery.message?.text || "";
                const isListMessage = messageText.includes(ctx.t("subscriptions-list")) || messageText.includes(ctx.t("subscriptions-empty"));

                if (isListMessage && result.success) {
                     const { text, keyboard } = await generateSubscriptionListMessage(ctx as unknown as BotContext, userId);
                     try {
                        await ctx.editMessageText(text, {
                            parse_mode: "HTML",
                            reply_markup: keyboard,
                            link_preview_options: { is_disabled: true }
                        });
                     } catch (e) {
                         // Ignore error if message not modified or can't edit
                     }
                }
                // subscribeLogic already replies with a message, so we don't need to reply again unless we want to replace it.
                // But subscribeLogic's reply is a new message.
                // If we are in a callback, usually we might want to just show an alert or edit the message.
                // Current subscribeLogic implementation sends a new message. That's fine.

            } else if (data.startsWith("unsub:")) {
                // Handle unsubscribe callback from list
                const artistId = data.split(":")[1];
                
                const result = await unsubscribeLogic(ctx as unknown as BotContext, artistId, userId);
                await ctx.answerCallbackQuery(result.message);
                
                if (result.success) {
                    // Refresh the list message
                    const { text, keyboard, isEmpty } = await generateSubscriptionListMessage(ctx as unknown as BotContext, userId, artistId);
                    
                    if (isEmpty) {
                         // If list is empty, we can edit the text to say empty and remove keyboard, or just say empty
                         // But if we remove keyboard, user might be confused.
                         // However, "generateSubscriptionListMessage" returns text "You have no subscriptions" if empty.
                         // So we just update.
                         // BUT, we need to handle the case where "generateSubscriptionListMessage" returns undefined keyboard if empty.
                         // editMessageText requires us to be careful if content didn't change, but here it likely changed.
                         await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: keyboard || undefined });
                    } else {
                         await ctx.editMessageText(text, {
                             parse_mode: "HTML",
                             reply_markup: keyboard,
                             link_preview_options: { is_disabled: true }
                         });
                    }
                }
                
            } else if (data.startsWith("orig:")) {
                const illustId = data.split(":")[1];
                await ctx.answerCallbackQuery(ctx.t("ans-sending-doc"));
                await downloadOriginalLogic(ctx as unknown as BotContext, illustId);
            } else if (data.startsWith("zip:")) {
                const illustId = data.split(":")[1];
                await ctx.answerCallbackQuery(ctx.t("ans-generating-zip"));
                await downloadZipLogic(ctx as unknown as BotContext, illustId);
            } else if (data.startsWith("pselect:")) {
                const [_, illustId, offset] = data.split(":");
                await ctx.answerCallbackQuery();
                await pageSelectionLogic(ctx as unknown as BotContext, illustId, parseInt(offset));
            } else if (data.startsWith("pdl:")) {
                const [_, illustId, pageIndex] = data.split(":");
                await ctx.answerCallbackQuery(ctx.t("ans-downloading-page"));
                await downloadPageLogic(ctx as unknown as BotContext, illustId, parseInt(pageIndex));
            } else if (data.startsWith("cmd:")) {
                const action = data.split(":")[1];
                await handleStartCallbacks(ctx as unknown as BotContext, action);
            } else if (data === "force_update_all") {
                await ctx.answerCallbackQuery(ctx.t("update-triggered"));
                try {
                    const response = await fetch(`${coreApiUrl}/api/force-update`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({}),
                    });

                    if (!response.ok) {
                        throw new Error(`Core API error: ${response.status}`);
                    }

                    const result = await response.json() as any;
                    const updatedCount = result.updatedCount ?? 0;
                    const lastIllustId = result.lastCheckedIllustId;

                    if (updatedCount === 0) {
                        // No updates found logic
                        let messageText = ctx.t("no-updates-found");
                        const keyboard = new InlineKeyboard();

                        // Try to find a relevant illust ID for "View Latest"
                        let targetIllustId = lastIllustId;

                        // If API didn't return one (maybe checked multiple artists but return structure issues? or none checked?), try local DB logic
                        if (!targetIllustId) {
                            // Fallback: Pick the first subscription's latest known PID if available?
                            // Actually, local DB might not have the *absolute latest* if Core API just failed to find *new* ones but exists.
                            // But we can try to look at user's subscriptions.
                            const subs = ctx.db.getSubscriptions(userId);
                            if (subs.length > 0) {
                                // Just pick the first one that has a last_pid
                                const sub = subs.find(s => s.last_pid);
                                if (sub) {
                                    targetIllustId = sub.last_pid;
                                }
                            }
                        }

                        if (targetIllustId) {
                            // Add button to view latest work
                            // We can use a deep link or callback to trigger /illust command
                            // Since /illust command logic is complex, maybe just a button that sends "/illust <id>"?
                            // Or better: a callback button that triggers the view logic directly.
                            // However, we are editing the message text.
                            // Let's use a URL button to the artwork? Or a callback.
                            // Callback is "view_illust:<id>"
                            // But we don't have a handler for "view_illust".
                            // We have "orig:" and "zip:" etc.
                            // We can reuse the `illustCommand` logic but that expects a Message object usually.
                            // Let's just give a link to Pixiv or a button that says "Check Last".
                            // The user asked for "View Latest Work" button.
                            // Let's add a button that links to the bot itself with start param? t.me/bot?start=illust_id
                            // Or simply a callback "view_illust:id" and we implement that handler.
                            // For now, let's use a button that triggers the existing "illust" command behavior if possible.
                            // Wait, we can just send a new message? No, "edit" is better.
                            
                            // Let's implement a simple callback handler for "view_illust" below or inline.
                            // Actually, the user instruction says: 'Click triggering /illust <id>'.
                            // A callback button `cmd:illust:${targetIllustId}` seems appropriate if we add support for it in `handleStartCallbacks` or here.
                            
                            // Let's check `handleStartCallbacks`. It handles "start" payloads.
                            // We can just add a specific handler for this button.
                            keyboard.text(ctx.t("btn-view-last-illust"), `view_illust:${targetIllustId}`);
                        }
                        
                        keyboard.row().text(ctx.t("btn-back-to-list"), "cmd:list"); // Option to go back to list

                        await ctx.editMessageText(messageText, {
                            parse_mode: "HTML",
                            reply_markup: keyboard
                        });

                    } else {
                        // Updates found - standard behavior (refresh list)
                         const { text, keyboard } = await generateSubscriptionListMessage(ctx as unknown as BotContext, userId);
                        
                        try {
                            await ctx.editMessageText(text, {
                                parse_mode: "HTML",
                                reply_markup: keyboard,
                                link_preview_options: { is_disabled: true }
                            });
                        } catch (e: any) {
                            if (!e.description?.includes("message is not modified")) {
                                throw e;
                            }
                        }
                    }

                } catch (error) {
                    console.error("Failed to trigger force-update:", error);
                    await ctx.reply(ctx.t("error-generic"));
                }
            } else if (data.startsWith("view_artist:")) {
                const artistId = data.split(":")[1];
                await ctx.answerCallbackQuery(ctx.t("searching"));
                await sendArtist(ctx as unknown as BotContext, artistId);
            } else if (data.startsWith("view_illust:")) {
                 const illustId = data.split(":")[1];
                 // await ctx.answerCallbackQuery(); // Don't answer yet, waiting for fetch
                 
                 // Show "Sending..." feedback (notification at top)
                 await ctx.answerCallbackQuery({ text: ctx.t("fetching-artwork") });

                 try {
                     const res = await fetch(`${coreApiUrl}/api/illust/${illustId}`);
                     if (!res.ok) throw new Error("API Error");
                     const data = await res.json() as any;
                     
                     if (data.error) {
                         await ctx.reply(ctx.t("error-generic") + ": " + data.error);
                         return;
                     }
                     
                     const illust = data.illust;
                     // Use the unified sender
                     await sendIllust(ctx as unknown as BotContext, illust);
                     
                 } catch (e) {
                     console.error("Error viewing illust:", e);
                     await ctx.reply(ctx.t("error-generic"));
                 }
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
