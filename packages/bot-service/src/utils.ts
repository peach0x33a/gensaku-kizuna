import { loadConfig } from "./config";

const config = loadConfig();

export function logDebug(message: string, ...args: any[]) {
    if (config.debug) {
        console.log(`[DEBUG] ${message}`, ...args);
    }
}

/**
 * Clean Pixiv ID by removing any non-digit characters.
 * Useful for stripping invisible Unicode characters (like U+2068/U+2069)
 * that might be added by i18n libraries.
 */
export function cleanId(id: string | number): string {
    return String(id).replace(/[^\d]/g, '');
}

export function escapeHtml(unsafe: string): string {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
