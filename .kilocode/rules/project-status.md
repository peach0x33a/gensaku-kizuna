---
trigger: always_on
description: "Project status, completed features, and next steps."
---

# Project Status: MVP Mid-Stage

## 1. Overview
- **Project**: `gensaku-kizuna-monorepo`
- **Architecture**: Monorepo (Bun workspaces)
- **Modules**:
    - `packages/core-api`: Core business logic, Pixiv API interaction, scheduler.
    - `packages/bot-service`: Telegram Bot, user interaction, webhook handler.

## 2. Completed Features

### Core API (`packages/core-api`)
- **Pixiv API Client**:
    - Auto token refresh, header simulation, retry logic.
    - Endpoints: `getUserIllusts`, `getIllustDetail`, `getUgoiraMetadata`, `getUserDetail`.
- **Server Endpoints**:
    - REST API for Bot interactions.
    - Image Proxy: `/api/proxy-image` (streaming with Referer).
    - Monitoring: `addMonitoredArtist`.
- **Scheduler**:
    - Polls monitored artists for new works.
    - Pushes updates via Webhook to Bot.
- **Data Persistence**: SQLite (`core_db.sqlite`) for monitored artists.

### Bot Service (`packages/bot-service`)
- **Commands**: `/start`, `/help`, `/subscribe`, `/list`, `/artist`, `/illust`.
- **Subscription**:
    - User subscribes -> Local DB record -> Call Core API to monitor.
- **Webhook Handling**:
    - Receives new artwork notifications -> Notifies subscribed users.
    - Interactive buttons: "Open in Pixiv", "Download Original".
- **Utilities**:
    - Regex matching for Pixiv URLs (users/artworks).
    - Basic image fetching logic.
- **Data Persistence**: SQLite (`db.sqlite`) for user subscriptions.

## 3. In Progress / Missing Features

### Critical
- **Database Consistency**: Separate DBs (`core_db` vs `db`) risk desync. No unified user management.
- **Unsubscribe**: Command `/unsub` mentioned in docs but not implemented in code.
- **Tests**: No automated test suite; relies on manual scripts in `test-script/`.

### Functional
- **Ugoira**: Metadata fetching exists, but conversion (zip -> gif/mp4) and sending is unimplemented.
- **Manga/Multi-image**: Only handles single/first image for notifications.
- **Error Handling**: Basic logging exists, but user feedback for API errors is minimal.

## 4. Tech Stack
- **Runtime**: Bun
- **Frameworks**: Hono (API/Webhook), Grammy (Bot)
- **Database**: SQLite (bun:sqlite)
- **Validation**: Zod
- **Scheduling**: node-cron

## 5. Next Steps
1.  **Implement `/unsub`**: Critical for user management.
2.  **Ugoira Support**: Implement conversion pipeline.
3.  **Multi-image Support**: Better display for Manga.
4.  **Refactor DB**: Consider merging DBs or improving sync logic.
5.  **Testing**: Migrate `test-script` to a proper test runner (Bun test).
