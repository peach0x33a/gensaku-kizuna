import { z } from "zod";

const configSchema = z.object({
  pixiv: z.object({
    refreshToken: z.string().min(1, "PIXIV_REFRESH_TOKEN is required"),
  }),
  database: z.object({
    url: z.string().default("file:./core.db"),
  }),
  pollInterval: z.number().default(900),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  debug: z.boolean().default(false),
  verboseRequest: z.boolean().default(false),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const config = {
    pixiv: {
      refreshToken: process.env.PIXIV_REFRESH_TOKEN,
    },
    database: {
      url: process.env.API_DB_URL || process.env.DATABASE_URL,
    },
    pollInterval: process.env.POLL_INTERVAL && !isNaN(parseInt(process.env.POLL_INTERVAL)) 
      ? parseInt(process.env.POLL_INTERVAL) 
      : undefined,
    logLevel: process.env.LOG_LEVEL,
    debug: process.env.DEBUG === "true",
    verboseRequest: process.env.VERBOSE_REQUEST === "true",
  };

  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
      throw new Error(`Configuration Error:\n${missing}`);
    }
    throw error;
  }
}
