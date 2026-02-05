import { I18n } from "@grammyjs/i18n";
import path from "path";

export const i18n = new I18n({
    defaultLocale: "en",
    directory: path.resolve(import.meta.dir, "../locales"),
    useSession: false, // We use user.language_code for now
    fluentBundleOptions: {
        useIsolating: false,
    },
});
