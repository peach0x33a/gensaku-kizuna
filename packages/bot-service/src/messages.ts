import { Illust } from "@gensaku-kizuna/core-api";
import { InlineKeyboard } from "grammy";
import { type InputMediaPhoto } from "grammy/types";
import { escapeHtml } from "./utils";

export interface IllustMessage {
    type: "photo" | "media_group";
    media: string | InputMediaPhoto[];
    caption: string;
    parse_mode: "HTML";
    reply_markup: InlineKeyboard;
    has_spoiler?: boolean;
}

export function formatIllustMessage(illust: Illust, t: (key: string, args?: any) => string): IllustMessage {
    const isNsfw = illust.x_restrict > 0;
    const nsfwPrefix = isNsfw ? t("nsfw-warning") : "";

    // Format tags: separate into Pixiv Links and Telegram Hashtags
    const { tagsLink, tagsHash } = processTags(illust.tags);

    // Format date (UTC+8)
    const date = new Date(illust.create_date);
    const dateStr = date.toLocaleString('sv-SE', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const description = processCaption(illust.caption);

    const caption = t("illust-caption", {
        nsfwPrefix,
        title: escapeHtml(illust.title),
        authorId: String(illust.user.id),
        authorName: escapeHtml(illust.user.name),
        id: String(illust.id),
        date: dateStr,
        tagsLink,
        tagsHash,
        description: escapeHtml(description)
    });

    const keyboard = new InlineKeyboard()
        .url(t("btn-open-pixiv"), `https://www.pixiv.net/artworks/${illust.id}`)
        .text(t("btn-view-artist"), `view_artist:${illust.user.id}`);

    // Handle Multi-page
    if (illust.page_count > 1 && illust.meta_pages && illust.meta_pages.length > 0) {
        // Limited to 10 for MediaGroup (Telegram limit)
        const pages = illust.meta_pages.slice(0, 10);
        
        const mediaGroup = pages.map((page: any, index: number) => {
            const url = page.image_urls.large.replace("i.pximg.net", "i.pixiv.re");
            return {
                type: "photo",
                media: url,
                caption: index === 0 ? caption : undefined,
                parse_mode: "HTML",
                has_spoiler: isNsfw
            } as InputMediaPhoto;
        });

        // Add Zip download button for albums
        // We already added the "standard" keyboard above (Open Pixiv, View Artist).
        // For multi-page, we also want "Download All Zip".
        // The standard keyboard is:
        // [Open Pixiv] [View Artist]
        //
        // We append "Download All Zip" to it.
        keyboard.row().text(t("btn-download-all-zip"), `zip:${illust.id}`);
        
        // Add page selection if more than 10 pages (only needed for interactive mode, but harmless to add logic here if we want consistency)
        // Note: webhook.ts didn't have page selection logic, but illust.ts did. 
        // We'll stick to the common denominator or enhance webhook.
        // For now, let's keep the keyboard simple as per webhook logic, 
        // but `illust.ts` adds "Select Page". 
        // Let's defer "Select Page" addition to the caller if they want to append it, 
        // OR we can add it here if it makes sense. 
        // Since `illust.ts` is interactive, it makes sense. Webhook is push. 
        // We'll return the base keyboard.

        return {
            type: "media_group",
            media: mediaGroup,
            caption,
            parse_mode: "HTML",
            reply_markup: keyboard,
            has_spoiler: isNsfw
        };
    }

    // Single Image
    const imageUrl = illust.image_urls.large.replace("i.pximg.net", "i.pixiv.re");
    
    // Add "Download Original" button for single image
    keyboard.row().text(t("btn-download-orig"), `orig:${illust.id}`);

    return {
        type: "photo",
        media: imageUrl,
        caption,
        parse_mode: "HTML",
        reply_markup: keyboard,
        has_spoiler: isNsfw
    };
}

function processCaption(caption: string): string {
    if (!caption) return "";
    // Replace <br> with newline
    let processed = caption.replace(/<br\s*\/?>/gi, '\n');
    // Strip HTML tags
    processed = processed.replace(/<[^>]*>?/gm, '');
    // Trim
    processed = processed.trim();
    // Truncate to avoid hitting limits (Telegram 1024, but we have other text)
    if (processed.length > 500) {
        processed = processed.substring(0, 497) + "...";
    }
    return processed;
}

function processTags(tags: any[]): { tagsLink: string, tagsHash: string } {
    // Limit to 8 tags to avoid clutter
    const slicedTags = tags.slice(0, 8);
    
    const tagsLink = slicedTags.map(tag => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        const encoded = encodeURIComponent(tagName);
        return `<a href="https://www.pixiv.net/tags/${encoded}/artworks">${escapeHtml(tagName)}</a>`;
    }).join(' ');

    const tagsHash = slicedTags.map(tag => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        // Keep letters (Unicode), numbers, and underscores. Replace others with underscore.
        // Telegram hashtags support unicode letters.
        let sanitized = tagName.replace(/[^\p{L}\p{N}_]/gu, '_');
        
        // Collapse multiple underscores and remove leading/trailing underscores
        sanitized = sanitized.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
        
        // Ensure it's not empty or just numbers (Telegram allows pure numbers in hashtags? Yes: #123 works)
        if (!sanitized) return '';
        return `#${sanitized}`;
    }).filter(t => t !== '').join(' ');

    return { tagsLink, tagsHash };
}
