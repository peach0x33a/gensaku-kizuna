# GensakuKizuna Bot Commands

## Basic Commands
| Command | Usage | Description |
| :--- | :--- | :--- |
| `/start` | `/start` | Initialize the bot and check connection. |
| `/help` | `/help` | Show the help message and usage guide. |

## Subscription Management
| Command | Usage | Description |
| :--- | :--- | :--- |
| `/sub` | `/sub <UID>` | Subscribe to an artist's new works (Updates pushed immediately). |
| `/unsub` | `/unsub <UID>` | Unsubscribe from an artist. |
| `/list` | `/list` | View your current subscription list. |

## Interactive Features (No Command Required)
- **Download Illust**: Send a Pixiv **Illust ID** (e.g., `12345678`) or **URL** to get the high-quality original image (Supports `ugoira` zip/gif conversion if implemented).
- **User Profile**: Send a Pixiv **User ID** or **User Profile URL** to fetch artist stats (Works, Followers, Following, Avatar).

## Admin / Debug
| Command | Usage | Description |
| :--- | :--- | :--- |
| `/status` | `/status` | Check bot health and API latency. |
