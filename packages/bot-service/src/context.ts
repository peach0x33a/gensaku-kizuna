import { Context } from "grammy";
import { DB } from "./database";

export type BotContext = Context & {
    db: DB;
    coreApiUrl: string;
};
