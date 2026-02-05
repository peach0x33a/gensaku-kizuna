
import { BotContext } from "../context";
import { CommandContext, InlineKeyboard, HearsContext, Api } from "grammy";
import { type InputMediaPhoto } from "grammy/types";
import { Illust, UgoiraMetadata } from "@gensaku-kizuna/core-api";
import { cleanId, escapeHtml } from "../utils";
import { formatIllustMessage } from "../messages";

export async function illustCommand(ctx: BotContext) {
    // @ts-ignore
    let args = ctx.match;
    let input: string | undefined;

    if (typeof args === "string") {
        input = args.trim();
        if (!input) {
            await ctx.reply(ctx.t("usage-illust"));
            return;
        }
    } else if (Array.isArray(args)) {
        // Regex match
        input = args[1];
    }

    if (!input) return;

    // Remove invisible characters
    input = input.replace(/[\u2068\u2069]/g, '');

    const idMatch = input.match(/\/artworks\/(\d+)/) || input.match(/^(\d+)$/);

    if (!idMatch) {
        if (/^\d+$/.test(input)) {
            // good
        } else {
            await ctx.reply(ctx.t("invalid-input"));
            return;
        }
    }

    const illustId = cleanId(idMatch ? idMatch[1] : input);

    if (!ctx.chat) return;

    const LOADING_MSG = await ctx.reply(ctx.t("fetching-artwork"));

    try {
        await ctx.replyWithChatAction("upload_photo");

        const res = await fetch(`${ctx.coreApiUrl}/api/illust/${illustId}`);
        if (!res.ok) {
            await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id);
            if (res.status === 500 || res.status === 404) {
                await ctx.reply(ctx.t("artwork-not-found"));
                return;
            }
            await ctx.reply(`Failed to fetch illust: ${res.statusText}`);
            return;
        }

        const data = await res.json() as { illust: Illust };
        const illust = data.illust;

        await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id);
        await sendIllust(ctx, illust);

    } catch (error) {
        console.error("Illust command error:", error);
        if (ctx.chat) {
            try { await ctx.api.deleteMessage(ctx.chat.id, LOADING_MSG.message_id); } catch { }
            await ctx.reply(ctx.t("error-generic") + `: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export async function sendIllust(ctx: BotContext, illust: Illust) {
    if (!ctx.chat) return;
    await sendIllustToChat(ctx.api, ctx.chat.id, illust, ctx.t, ctx.coreApiUrl!);
}

export async function sendIllustToChat(
    api: Api,
    chatId: number | string,
    illust: Illust,
    t: (key: string, args?: any) => string,
    coreApiUrl: string
) {
    // Handle Ugoira first
    if (illust.type === "ugoira") {
        const isNsfw = illust.x_restrict > 0;
        const spoilerParams = isNsfw ? { has_spoiler: true } : {};
        const nsfwPrefix = isNsfw ? t("nsfw-warning") : "";

        // Format tags
        const tags = "#" + illust.tags.slice(0, 5)
            .map((tag: any) => tag.name.replace(/[!@$&]/g, "").replace(/-/g, "_"))
            .join(" #");

        const caption = t("illust-caption", {
            nsfwPrefix,
            title: escapeHtml(illust.title),
            authorId: String(illust.user.id),
            authorName: escapeHtml(illust.user.name),
            id: String(illust.id),
            tags: escapeHtml(tags)
        });

        const ugoiraRes = await fetch(`${coreApiUrl}/api/illust/${illust.id}/ugoira`);
        if (ugoiraRes.ok) {
            const ugoiraData = await ugoiraRes.json() as UgoiraMetadata;
            const zipUrl = ugoiraData.ugoira_metadata.zip_urls.medium.replace("i.pximg.net", "i.pixiv.re");
            const previewUrl = illust.image_urls.large.replace("i.pximg.net", "i.pixiv.re");

            await api.sendPhoto(chatId, previewUrl, {
                caption: `${caption}\n\n${t("ugoira-label")}\n${t("download-zip", { url: zipUrl })}`,
                parse_mode: "HTML",
                ...spoilerParams
            });
            return;
        }
    }

    const messageData = formatIllustMessage(illust, t);

    if (messageData.type === "media_group") {
        await api.sendMediaGroup(chatId, messageData.media as InputMediaPhoto[]);
        
        // Add extra buttons for multi-page
        const keyboard = messageData.reply_markup;
        keyboard.text(t("btn-select-page"), `pselect:${illust.id}:0`);

        if (illust.page_count > 10) {
            await api.sendMessage(chatId, t("showing-pages", { total: illust.page_count }), { reply_markup: keyboard });
        } else {
            await api.sendMessage(chatId, t("operation-menu"), { reply_markup: keyboard });
        }
    } else {
        await api.sendPhoto(chatId, messageData.media as string, {
            caption: messageData.caption,
            parse_mode: messageData.parse_mode,
            reply_markup: messageData.reply_markup,
            has_spoiler: messageData.has_spoiler
        });
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
            caption: ctx.t("original-caption", { title: illust.title }),
        });

    } catch (error) {
        console.error("Download Original Error", error);
        await ctx.reply(ctx.t("error-generic"));
    }
}

export async function downloadZipLogic(ctx: BotContext, illustId: string) {
    try {
        const zipUrl = `${ctx.coreApiUrl}/api/illust/${illustId}/zip`;
        const res = await fetch(zipUrl);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const buffer = await res.arrayBuffer();
        
        // Use InputFile to send from buffer
        const { InputFile } = await import("grammy");
        await ctx.replyWithDocument(new InputFile(new Uint8Array(buffer), `${illustId}.zip`), {
            caption: `ID: ${illustId}`,
        });

    } catch (error) {
        console.error("Download Zip Error", error);
        await ctx.reply(ctx.t("error-generic"));
    }
}

export async function pageSelectionLogic(ctx: BotContext, illustId: string, offset: number) {
    try {
        const res = await fetch(`${ctx.coreApiUrl}/api/illust/${illustId}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data = await res.json() as { illust: Illust };
        const illust = data.illust;

        const keyboard = new InlineKeyboard();
        const pageSize = 10;
        const total = illust.page_count;

        // Render page buttons
        for (let i = offset; i < Math.min(offset + pageSize, total); i++) {
            keyboard.text(`${i + 1}`, `pdl:${illustId}:${i}`);
            if ((i - offset + 1) % 5 === 0) keyboard.row();
        }

        // Pagination row
        const nav = [];
        if (offset > 0) nav.push({ text: "⬅️", data: `pselect:${illustId}:${offset - pageSize}` });
        if (offset + pageSize < total) nav.push({ text: "➡️", data: `pselect:${illustId}:${offset + pageSize}` });

        if (nav.length > 0) {
            keyboard.row();
            for (const n of nav) keyboard.text(n.text, n.data);
        }

        await ctx.editMessageText(ctx.t("select-page", { total }), {
            reply_markup: keyboard
        });

    } catch (error) {
        console.error("Page Selection Error", error);
        await ctx.reply(ctx.t("error-generic"));
    }
}

export async function downloadPageLogic(ctx: BotContext, illustId: string, pageIndex: number) {
    try {
        const res = await fetch(`${ctx.coreApiUrl}/api/illust/${illustId}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data = await res.json() as { illust: Illust };
        const illust = data.illust;

        if (!illust.meta_pages[pageIndex]) throw new Error("Page not found");

        const originalUrl = illust.meta_pages[pageIndex].image_urls.original;
        const proxyUrl = originalUrl.replace("i.pximg.net", "i.pixiv.re");

        await ctx.replyWithDocument(proxyUrl, {
            caption: ctx.t("page-caption", { page: pageIndex + 1, title: illust.title }),
        });

    } catch (error) {
        console.error("Download Page Error", error);
        await ctx.reply(ctx.t("error-generic"));
    }
}
