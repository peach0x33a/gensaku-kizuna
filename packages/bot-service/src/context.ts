import { Context } from "grammy";
import { DB } from "./database";
import { I18nFlavor } from "@grammyjs/i18n";

export type BotContext = Context & I18nFlavor & {
    db: DB;
    coreApiUrl: string;
};
