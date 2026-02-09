import { loadConfig } from "./config";

const config = loadConfig();

export const logger = {
    info: (message: string, ...args: any[]) => {
        const time = new Date().toISOString();
        console.log(`[${time}] [INFO] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        const time = new Date().toISOString();
        console.error(`[${time}] [ERROR] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        const time = new Date().toISOString();
        console.warn(`[${time}] [WARN] ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
        if (config.debug) {
            const time = new Date().toISOString();
            console.log(`[${time}] [DEBUG] ${message}`, ...args);
        }
    }
};

export function logDebug(message: string, ...args: any[]) {
    logger.debug(message, ...args);
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
