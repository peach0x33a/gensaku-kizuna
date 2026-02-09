import { GensakuBot } from "./bot";
import { loadConfig } from "./config";
import { logger } from "./utils";

const config = loadConfig();

const bot = new GensakuBot(config.bot.token, config.coreApi.url, config.database.url, config.stacktrace);

bot.start().catch((err) => {
  logger.error("Failed to start bot:", err);
  process.exit(1);
});
