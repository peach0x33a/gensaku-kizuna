# Localization (i18n) Strategy for Gensaku Kizuna Bot

## 1. Chosen Solution
**Library**: `@grammyjs/i18n`
**Format**: Fluent (`.ftl`)
**Rationale**:
- Native integration with Grammy.
- Fluent format supports complex interpolations and pluralization better than simple JSON.
- Lightweight and efficient.

## 2. Directory Structure
Create a `locales` directory within `packages/bot-service/`.

```
packages/bot-service/
├── locales/
│   ├── en.ftl  (English - Default)
│   ├── zh.ftl  (Chinese - Optional future addition)
│   └── ja.ftl  (Japanese - Optional future addition)
├── src/
│   ├── locales.ts (I18n configuration)
│   └── ...
```

## 3. Implementation Plan

### Step 1: Install Dependencies
```bash
cd packages/bot-service
bun add @grammyjs/i18n
```

### Step 2: Configure I18n
Create `packages/bot-service/src/locales.ts` to export the `I18n` instance.
- Load files from the `locales/` directory.
- Set default locale to `en`.
- Use `ctx.from.language_code` for negotiation.

### Step 3: Update Context
Modify `packages/bot-service/src/context.ts` to extend `I18nFlavor`.

```typescript
import { Context, SessionFlavor } from "grammy";
import { I18nFlavor } from "@grammyjs/i18n";

export interface BotConfig {
    coreApiUrl: string;
}

export type BotContext = Context & SessionFlavor<any> & I18nFlavor & BotConfig & {
    db: any; // update with actual type
};
```

### Step 4: Register Middleware
In `packages/bot-service/src/bot.ts`, register the i18n middleware **before** commands are defined.

### Step 5: Externalize Strings (Translation Keys)
Create `packages/bot-service/locales/en.ftl` with the following keys:

**General:**
- `welcome-message`: Welcome text for `/start`.
- `help-message`: Output for `/help`.
- `searching`: "🔍 Searching..."
- `fetching-artwork`: "🔍 Fetching artwork..."
- `not-found`: "Not found."
- `error-generic`: "An error occurred."

**Commands:**
- `usage-artist`: "Usage: /artist <artist_id> or <url>"
- `usage-illust`: "Usage: /illust <illust_id> or <url>"
- `invalid-input`: "Invalid input. Please provide..."
- `subscriptions-empty`: "You have no subscriptions."
- `subscriptions-list`: "Your Subscriptions:"
- `subscribed-success`: "Subscribed to { $name } (ID: { $id })!"
- `artist-not-found`: "Artist not found."

**Buttons:**
- `btn-check-subs`: "Check Subscriptions"
- `btn-help`: "Help"
- `btn-open-pixiv`: "Open in Pixiv"
- `btn-download-orig`: "Download Original"

**Webhook (Notifications):**
- `new-artwork-title`: "<b>{ $title }</b>\nby { $artist }"
- `tags`: "Tags: { $tags }"
- `view-on-pixiv`: "View on Pixiv"

### Step 6: Refactor Code
Go through each file and replace strings with `ctx.t('key')`.

- `src/commands/start.ts`
- `src/commands/help.ts`
- `src/commands/artist.ts`
- `src/commands/illust.ts`
- `src/commands/list.ts`
- `src/commands/subscribe.ts`
- `src/webhook.ts` (Note: `webhook.ts` might need `i18n.t(locale, key)` since it might not have a full `ctx` for push notifications. We will need to store user locale in DB or default to 'en'.)

## 4. Next Actions
1. Approve this plan.
2. Switch to `code` mode to execute the installation and refactoring.
