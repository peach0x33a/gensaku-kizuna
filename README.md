# GensakuKizuna Monorepo

Project status and details can be found in [.kilocode/rules/project-status.md](.kilocode/rules/project-status.md).

## Bot Command Usage

GensakuKizuna Bot provides several commands to interact with Pixiv content and manage artist subscriptions.

### Basic Commands

| Command | Usage | Description |
| :--- | :--- | :--- |
| `/start` | `/start` | Initialize the bot and check connection. |
| `/help` | `/help` | Show the help message and usage guide. |

### Content Discovery

These commands allow you to fetch details and content from Pixiv.

| Command | Usage | Description |
| :--- | :--- | :--- |
| `/artist` | `/artist <User ID>`<br>`/artist <Pixiv User URL>` | Fetch artist profile details, including stats (Illusts, Manga, Followers) and a profile image. Provides a button to subscribe directly. |
| `/illust` | `/illust <Illust ID>`<br>`/illust <Pixiv Artwork URL>` | Fetch artwork details. Supports:<br>- Single images (High Quality)<br>- Ugoira (Animated, downloadable as ZIP)<br>- Manga/Multi-page works (First 10 pages)<br>- NSFW content detection |

> **Tip:** You can also send a Pixiv User URL or Artwork URL directly in the chat without the command prefix, and the bot will attempt to detect and process it (if regex matching is enabled).

### Subscription Management

Subscribe to artists to receive notifications when they post new works.

| Command | Usage | Description |
| :--- | :--- | :--- |
| `/subscribe` | `/subscribe <User ID>` | Subscribe to an artist using their Pixiv User ID. You will receive notifications for their new artworks. |
| `/list` | `/list` | View your current list of subscribed artist IDs. |

### Interactive Features

- **Download Original**: When viewing a single illustration via `/illust`, a "Download Original" button is available to fetch the highest resolution source file.
- **Open in Pixiv**: All content messages include a direct link to open the corresponding page on Pixiv.net.
