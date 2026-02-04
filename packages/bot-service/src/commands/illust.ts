
import { BotContext } from "../context";
import { CommandContext, InlineKeyboard, HearsContext } from "grammy";
import { type InputMediaPhoto } from "grammy/types";
import { Illust, UgoiraMetadata } from "@gensaku-kizuna/core-api";

export async function illustCommand(ctx: BotContext) {
    // @ts-ignore
    let args = ctx.match;
    let input: string | undefined;

    if (typeof args === "string") {
        input = args.trim();
        if (!input) {
            await ctx.reply("Usage: /illust <illust_id> or <url>");
            return;
        }
    } else if (Array.isArray(args)) {
        // Regex match
        input = args[1];
    }

    if (!input) return;

    const idMatch = input.match(/\/artworks\/(\d+)/) || input.match(/^(\d+)$/);

    if (!idMatch) {
        if (/^\d+$/.test(input)) {
            // good
        } else {
            await ctx.reply("Invalid input. Please provide an Illust ID or Pixiv Artwork URL.");
            return;
        }
    }

    const illustId = idMatch ? idMatch[1] : input;

    if (!ctx.chat) return;

    const LOADING_MSG = await ctx.reply("🔍 Fetching artwork...");

    try {
        await ctx.replyWithChatAction("upload_photo");

        const res = await fetch(`${ctx.coreApiUrl}/api/illust/${illustId}`);
        if (!res.ok) {
            await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id);
            if (res.status === 500 || res.status === 404) {
                await ctx.reply("Artwork not found.");
                return;
            }
            await ctx.reply(`Failed to fetch illust: ${res.statusText}`);
            return;
        }

        const data = await res.json() as { illust: Illust };
        const illust = data.illust;

        const caption = `<b>${illust.title}</b>\n` +
            `by <a href="https://www.pixiv.net/users/${illust.user.id}">${illust.user.name}</a>\n` +
            `ID: <a href="https://www.pixiv.net/artworks/${illust.id}">${illust.id}</a>\n` +
            `Tags: #${illust.tags.slice(0, 5).map(t => t.name).join(" #")}`;

        // Handle Ugoira
        if (illust.type === "ugoira") {
            const ugoiraRes = await fetch(`${ctx.coreApiUrl}/api/illust/${illustId}/ugoira`);
            if (ugoiraRes.ok) {
                const ugoiraData = await ugoiraRes.json() as UgoiraMetadata;
                const zipUrl = ugoiraData.ugoira_metadata.zip_urls.medium.replace("i.pximg.net", "i.pixiv.re");
                const previewUrl = illust.image_urls.large.replace("i.pximg.net", "i.pixiv.re");

                await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id);
                await ctx.replyWithPhoto(previewUrl, {
                    caption: `${caption}\n\n🎬 <b>Ugoira (Animated)</b>\n⬇️ <a href="${zipUrl}">Download ZIP</a>`,
                    parse_mode: "HTML"
                });
                return;
            }
        }

        // Handle Multi-page
        if (illust.page_count > 1 && illust.meta_pages.length > 0) {
            // Limited to 10 for MediaGroup
            const pages = illust.meta_pages.slice(0, 10);
            const mediaGroup = pages.map((page, index) => {
                const url = page.image_urls.large.replace("i.pximg.net", "i.pixiv.re");
                return {
                    type: "photo",
                    media: url,
                    caption: index === 0 ? caption : undefined,
                    parse_mode: "HTML"
                } as InputMediaPhoto;
            });

            await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id);
            await ctx.replyWithMediaGroup(mediaGroup);
            if (illust.page_count > 10) {
                await ctx.reply(`(Showing 10 of ${illust.page_count} pages)`);
            }
            return;
        }

        // Single Image
        const imageUrl = illust.image_urls.large.replace("i.pximg.net", "i.pixiv.re");
        await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id);

        await ctx.replyWithPhoto(imageUrl, {
            caption,
            parse_mode: "HTML",
            reply_markup: new InlineKeyboard()
                .url("Open in Pixiv", `https://www.pixiv.net/artworks/${illust.id}`)
                .text("Download Original", `orig:${illust.id}`)
        });

    } catch (error) {
        console.error("Illust command error:", error);
        if (ctx.chat) {
            try { await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id); } catch { }
            await ctx.reply(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export async function downloadOriginalLogic(ctx: BotContext, illustId: string) {
    try {
        const res = await fetch(`${ctx.coreApiUrl}/api/illust/${illustId}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data = await res.json() as { illust: Illust };
        const illust = data.illust;

        let originalUrl = "";
        if (illust.meta_single_page?.original_image_url) {
            originalUrl = illust.meta_single_page.original_image_url;
        } else if (illust.meta_pages?.length > 0) {
            originalUrl = illust.meta_pages[0].image_urls.original;
        } else {
            originalUrl = illust.image_urls.large;
        }

        const proxyUrl = originalUrl.replace("i.pximg.net", "i.pixiv.re");

        await ctx.replyWithDocument(proxyUrl, {
            caption: `Original: ${illust.title}`,
        });

    } catch (error) {
        console.error("Download Original Error", error);
        await ctx.reply("Failed to download original image.");
    }
}
