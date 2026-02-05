# General
welcome-message = 
    Welcome to Gensaku Kizuna Bot!

    Use /help to see available commands.
    Use /subscribe to subscribe to artists.

help-message =
    Available commands:
    /start - Check connectivity and show menu
    /subscribe <artist_id> - Subscribe to an artist
    /list - List your subscriptions
    /artist <artist_id> - Get artist info
    /illust <illust_id> - Get illustration info
    /status - Check system status and connectivity
    /help - Show this message

searching = 🔍 Searching...
fetching-artwork = 🔍 Fetching artwork...
not-found = Not found.
error-generic = An error occurred.

# Commands
usage-artist = Usage: /artist <artist_id> or <url>
usage-illust = Usage: /illust <illust_id> or <url>
invalid-input = Invalid input. Please provide a valid ID or URL.
subscribe = Subscribe
unknown-artist = Unknown Artist
subscriptions-empty = You have no subscriptions.
subscriptions-list = Your Subscriptions:
subscriptions-list-item = - Artist ID: `{ $id }`
subscriptions-list-item-detailed = 
    👤 <b><a href="tg://msg?text=/artist%20{ $id }">{ $name }</a></b> (<code>{ $id }</code>)
    🆕 Last Work: <a href="tg://msg?text=/illust%20{ $lastPid }">{ $lastPid }</a>
    🕒 Updated At: { $updatedAt }
run-list-to-see = Run /list to see subscriptions.

subscribed-success = Subscribed to **{ $name }** (ID: { $id })!
subscribed-success-no-artworks = 
    { subscribed-success }
    (No artworks found yet)

artist-not-found = Artist not found.
error-validating-artist = Error validating artist: { $error }
artwork-not-found = Artwork not found.

# Buttons
btn-check-subs = Check Subscriptions
btn-help = Help
btn-open-pixiv = Open in Pixiv
btn-download-orig = Download Original
btn-test-artist = Click to test: /artist 6586231
btn-test-illust = Click to test: /illust 140586969
btn-download-all-zip = Download All (.zip)
btn-select-page = Select Page
btn-unsubscribe = ❌ Unsubscribe
btn-resubscribe = ↩️ Resubscribe
list-update-button = 🔄 Check for Updates
update-triggered = 🚀 Update check triggered!
no-updates-found = ✅ No new artworks found.
btn-view-last-illust = 🖼️ View Latest Work
btn-back-to-list = 🔙 Back to List
btn-download-zip = 📦 Download ZIP
btn-view-artist = 👤 View Artist

# Webhook (Notifications)
new-artwork-title = <b>{ $title }</b>
new-artwork-by = by { $author }
tags = Tags: { $tags }
view-on-pixiv = <a href="{ $url }">View on Pixiv</a>
nsfw-warning = <b>[NSFW]</b> 

# Fallback text
fallback-text = New Artwork: { $title }

# Answers
ans-sending-doc = Sending document...
ans-generating-zip = Generating ZIP and sending...
ans-downloading-page = Downloading page...

# Artist
artist-caption =
    <b>{ $name }</b> (ID: { $id })

    🖼️ Illusts: { $illusts }
    📚 Manga: { $manga }
    👥 Followers: { $followers }
    🔗 <a href="https://www.pixiv.net/users/{ $id }">Pixiv Profile</a>

# Illust
illust-caption =
    { $nsfwPrefix }<b>{ $title }</b>
    by <a href="https://www.pixiv.net/users/{ $authorId }">{ $authorName }</a>
    ID: <a href="https://www.pixiv.net/artworks/{ $id }">{ $id }</a>
    Tags: { $tagsLink }
    Hashtags: { $tagsHash }

ugoira-label = 🎬 <b>Ugoira (Animated)</b>
download-zip = ⬇️ <a href="{ $url }">Download ZIP</a>
showing-pages = (Showing 10 of { $total } pages)
operation-menu = Operation Menu
select-page = Select a page to download (1-{ $total }):
page-caption = Page { $page } of { $title }
original-caption = Original: { $title }

# Status
checking-status = Checking status...
status-message =
    System Status:

    🤖 Bot: Running
    📶 Telegram API Latency: { $telegramLatency }ms
    { $coreStatusMsg }

    Diagnostic Actions:
pixiv-reachable = ✅ Pixiv API: Reachable ({ $latency }ms)
pixiv-error = ❌ Pixiv API: Error - { $message }
core-unreachable = ❌ Core API: Unreachable - { $message }

# Subscribe
usage-subscribe = Usage: /subscribe <artist_id>
failed-subscribe = Failed to subscribe: { $error }

# Unsubscribe
subscribe-no-id = ❌ Please provide an artist ID to unsubscribe, e.g., /unsub 123456
unsubscribe-not-subscribed = ⚠️ You are not subscribed to artist { $id }.
unsubscribe-success = ✅ Successfully unsubscribed from artist { $id }.
