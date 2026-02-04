# Draft: GensakuKizuna (原画之绊) Initialization

## Project Overview
- **Name**: GensakuKizuna
- **Goal**: High-performance Pixiv subscription Telegram bot
- **Environment**: Bun (TypeScript native)
- **Framework**: grammY
- **Architecture**: Monorepo (Bun Workspaces)

## Structure (Namespace: `@gensaku-kizuna`)
- **Root**: `GensakuKizuna/` (Current dir)
- **Packages**:
  - `packages/core-api`: Pixiv OAuth2, App-API, Scraping
  - `packages/bot-service`: Telegram bot logic, depends on `core-api`

## Technical Decisions (Confirmed)
- **Runtime**: Bun (Fast startup, native TS, built-in test/sqlite)
- **Auth**: Refresh token based, auto-renewal.
- **Pixiv API**: Simulate Android App (`https://app-api.pixiv.net`)
- **Database**: `bun:sqlite` with **Drizzle ORM** (Best in class for TS/SQL safety).
- **Linting**: **Biome** (Fast, zero-config default).
- **Testing**: `bun test`.

## Implementation Details
- **X-Client-Hash**: `md5(ISO8601 + Salt)`
- **Salt**: `28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c`

## Initial Setup Plan (Tiki-Taka)
1. Initialize `package.json` with workspaces.
2. Create `packages/core-api` and `packages/bot-service` directories.
3. Install base deps: `typescript`, `@types/bun`, `grammy`, `drizzle-orm`.
4. Setup `tsconfig.json` base.

## Open Questions for User
- None at this stage. Proceeding with initialization as per standard Bun patterns.
