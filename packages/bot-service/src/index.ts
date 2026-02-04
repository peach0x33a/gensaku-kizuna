import { GensakuBot } from "./bot";
import { loadConfig } from "@gensaku-kizuna/core-api";

// Assuming we can load shared config or just load env vars.
// The config path from core-api might need to be adjusted or we just duplicate simple config loading
// or use the workspace import.
// For now, let's trust the workspace import works if built.
// If not, we fall back to manual env loading.

const config = loadConfig();

if (!config.bot.token) {
  console.error("BOT_TOKEN is missing in config/env");
  process.exit(1);
}

// Core API URL - assumes running locally on default port 3000
const CORE_API_URL = process.env.CORE_API_URL || "http://localhost:3000";

const bot = new GensakuBot(config.bot.token, CORE_API_URL, config.database.url);

bot.start().catch((err) => {
  console.error("Failed to start bot:", err);
  process.exit(1);
});
