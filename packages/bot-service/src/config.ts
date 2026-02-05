import { z } from "zod";

const configSchema = z.object({
    bot: z.object({
        token: z.string().min(1, "BOT_TOKEN is required"),
    }),
    database: z.object({
        url: z.string().default("file:./bot.db"),
    }),
    coreApi: z.object({
        url: z.string().default("http://localhost:3000"),
    }),
    webhook: z.object({
        port: z.coerce.number().default(3001),
    }),
    debug: z.boolean().default(false),
    verboseRequest: z.boolean().default(false),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
    const config = {
        bot: {
            token: process.env.BOT_TOKEN,
        },
        database: {
            url: process.env.DATABASE_URL,
        },
        coreApi: {
            url: process.env.CORE_API_URL,
        },
        webhook: {
            port: process.env.WEBHOOK_PORT,
        },
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
