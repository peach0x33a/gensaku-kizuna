# AGENTS.md - GensakuKizuna Development Guidelines

## 1. Project Overview
- **Name**: GensakuKizuna (原画之绊)
- **Goal**: High-performance Pixiv subscription Telegram bot.
- **Stack**: Bun (Runtime), TypeScript, grammY (Bot Framework), SQLite (Database).
- **Architecture**: Monorepo managed by Bun Workspaces.

## 2. Directory Structure
```
GensakuKizuna/
├── packages/
│   ├── core-api/       # Pixiv API client, OAuth, Scraping
│   └── bot-service/    # Telegram bot logic (depends on core-api)
├── package.json        # Root config (workspaces)
├── tsconfig.json       # Base TypeScript config
├── AGENTS.md           # This file
└── api.md              # Pixiv App-API Specification
```

## 3. Development Workflow

### Commands
- **Install Dependencies**: `bun install`
- **Run Tests**: `bun test` (Root runs all, or `bun test --filter @gensaku-kizuna/core-api`)
- **Lint & Format**: `bunx biome check --apply .` (Using Biome for speed)
- **Run Bot**: `bun --filter @gensaku-kizuna/bot-service run start`

### Testing Strategy
- **Framework**: `bun:test` (Native Bun test runner).
- **Unit Tests**: Required for `core-api` logic (hash generation, parsers).
- **Integration Tests**: Mock Pixiv API responses for critical flows.
- **Single Test**: `bun test <filename>`

## 4. Code Style & Standards

### TypeScript
- **Strict Mode**: Enabled (`"strict": true`).
- **Imports**: Use standard ES modules (`import { X } from "..."`).
- **Types**: Explicit return types for public API methods. Use interfaces for data models (`Illust`, `User`).
- **Async**: Prefer `async/await` over raw Promises.

### Naming Conventions
- **Variables/Functions**: `camelCase` (e.g., `fetchIllusts`, `refreshToken`)
- **Classes/Interfaces**: `PascalCase` (e.g., `PixivClient`, `IllustData`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `PIXIV_API_BASE`)
- **Filenames**: `kebab-case.ts` (e.g., `pixiv-client.ts`, `auth-manager.ts`)

### Error Handling
- Use custom error classes (e.g., `PixivAuthError`, `RateLimitError`).
- Bot should catch errors and report friendly messages to user (or log if internal).
- **Never** swallow errors silently in `core-api`.

### Logging
- Use a structured logger (e.g., `pino` or simple wrapper) instead of `console.log`.
- Log levels: `debug` (payloads), `info` (milestones), `warn` (retries), `error` (failures).

## 5. Architecture Rules (Monorepo)

### `@gensaku-kizuna/core-api`
- **Responsibility**: Pure API client. No Telegram code here.
- **Exports**: `PixivClient` class, `Illust` interfaces, `AuthManager`.
- **Inputs**: `refresh_token` string.
- **State**: Should be stateless regarding user interaction, but stateful regarding Auth Token.

### `@gensaku-kizuna/bot-service`
- **Responsibility**: Telegram polling/webhooks, command handling, DB interactions.
- **Dependency**: Imports `@gensaku-kizuna/core-api`.
- **Database**: Manages `bun:sqlite` connection for user subscriptions.

## 6. Specific Implementation Details (from api.md)

### Pixiv API Headers
- **User-Agent**: `PixivAndroidApp/5.0.234 (Android 11; Pixel 5)`
- **X-Client-Hash**: `md5(ISO8601_Time + Salt)`
- **Salt**: `28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c`
- **Image Referer**: `https://app-api.pixiv.net/`

### Telegram Bot
- Use `grammY` framework.
- Use `InputFile` with streams for image sending (avoid disk I/O).
- Handle `403 Forbidden` from Pixiv (refresh token immediately).

## 7. AI Agent Guidelines
- **Role**: You are a Senior TypeScript Engineer.
- **Approach**: Plan -> TDD (Write Test) -> Implement -> Refactor.
- **API Testing**: Before full implementation, write a small script/test to verify connectivity to Pixiv API.
- **Security**: Never hardcode real tokens. Use env vars (`process.env.PIXIV_REFRESH_TOKEN`). If you need a `refresh_token` for testing, ask the user explicitly.
- **Files**: Absolute paths prefered.

## 8. Git & Version Control
- **Commits**: Conventional Commits (e.g., `feat: add auth renewal`, `fix: hash calculation`).
- **Scope**: Use package name as scope if specific (e.g., `feat(core): ...`, `fix(bot): ...`).

---
*Created by Prometheus for GensakuKizuna Team*
