import { createHash } from "node:crypto";
import { loadConfig } from "./config";

const config = loadConfig();
const SALT = "28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c";
const USER_AGENT = "PixivAndroidApp/5.0.234 (Android 11; Pixel 5)";

export function logDebug(message: string, ...args: any[]) {
  if (config.debug) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Clean Pixiv ID by removing any non-digit characters.
 */
export function cleanId(id: string | number): string {
  return String(id).replace(/[^\d]/g, '');
}

export function generateHash(time: string): string {
  return createHash("md5")
    .update(time + SALT)
    .digest("hex");
}

export function getPixivHeaders(accessToken?: string) {
  const time = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
  const hash = generateHash(time);

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "X-Client-Time": time,
    "X-Client-Hash": hash,
    "App-OS": "android",
    "Accept-Language": "zh-cn",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}
