# General
welcome-message = 
    欢迎使用 Gensaku Kizuna Bot！

    使用 /help 查看可用命令。
    使用 /subscribe 订阅画师。

help-message =
    可用命令：
    /start - 检查连接并显示菜单
    /subscribe <artist_id> - 订阅画师
    /list - 列出你的订阅
    /artist <artist_id> - 获取画师信息
    /illust <illust_id> - 获取作品信息
    /status - 检查系统状态和连接
    /help - 显示此帮助信息

searching = 🔍 搜索中...
fetching-artwork = 🔍 获取作品中...
not-found = 未找到。
error-generic = 发生错误。

# Commands
usage-artist = 用法：/artist <artist_id> 或 <url>
usage-illust = 用法：/illust <illust_id> 或 <url>
invalid-input = 输入无效。请输入有效的 ID 或 URL。
subscribe = 订阅
unknown-artist = 未知画师
subscriptions-empty = 你没有订阅任何画师。
subscriptions-list = 你的订阅列表：
subscriptions-list-item = - 画师 ID：`{ $id }`
subscriptions-list-item-detailed =
    👤 <b><a href="https://t.me/{ $botUsername }?start=artist_{ $id }">{ $name }</a></b> (<code>{ $id }</code>)
    🆕 最后作品：<a href="https://t.me/{ $botUsername }?start=illust_{ $lastPid }">{ $lastPid }</a>
    🕒 上次检查：{ $updatedAt }

operation-menu = 🔧 操作菜单 ({ $id })
run-list-to-see = 运行 /list 查看订阅。

subscribed-success = 成功订阅 **{ $name }** (ID: { $id })！
subscribed-success-no-artworks = 
    { subscribed-success }
    (暂未发现作品)

artist-not-found = 未找到画师。
error-validating-artist = 验证画师时出错：{ $error }
artwork-not-found = 未找到作品。

# Buttons
btn-check-subs = 查看订阅
btn-help = 帮助
btn-open-pixiv = 在 Pixiv 打开
btn-download-orig = 下载原图
btn-test-artist = 点击测试：/artist 6586231
btn-test-illust = 点击测试：/illust 140586969
btn-download-all-zip = 下载全部 (.zip)
btn-select-page = 选择页码
btn-unsubscribe = ❌ 取消订阅
btn-resubscribe = ↩️ 重新订阅
list-update-button = 🔄 立即检查更新
update-triggered = 🚀 更新检查已触发！
no-updates-found = ✅ 当前没有新作品。
btn-view-last-illust = 查看最新作品
no-illusts-found = 未找到该画师的作品。
btn-view-artist-latest = 查看最新作品
btn-back-to-list = 🔙 返回列表
btn-download-zip = 📦 下载 ZIP
btn-view-artist = 👤 查看画师

# Webhook (Notifications)
new-artwork-title = <b>{ $title }</b>
new-artwork-by = 作者：{ $author }
tags = 标签：{ $tags }
view-on-pixiv = <a href="{ $url }">在 Pixiv 查看</a>
nsfw-warning = <b>[NSFW]</b> 

# Fallback text
fallback-text = 新作品：{ $title }

# Answers
ans-sending-doc = 正在发送文件...
ans-generating-zip = 正在生成 ZIP 并发送...
ans-downloading-page = 正在下载页面...

# Artist
artist-caption =
    <b>{ $name }</b> (ID: { $id })

    🖼️ 插画: { $illusts }
    📚 漫画: { $manga }
    👥 粉丝: { $followers }
    🔗 <a href="https://www.pixiv.net/users/{ $id }">Pixiv 个人主页</a>

# Illust
illust-caption =
    { $nsfwPrefix }<b>{ $title }</b>
    作者：<a href="https://www.pixiv.net/users/{ $authorId }">{ $authorName }</a>
    ID：<a href="https://www.pixiv.net/artworks/{ $id }">{ $id }</a>
    日期：{ $date }
    标签：{ $tagsLink }
    Hashtags: { $tagsHash }

    { $description }

ugoira-label = 🎬 <b>Ugoira (动图)</b>
download-zip = ⬇️ <a href="{ $url }">下载 ZIP</a>
showing-pages = (正在显示第 10 张，共 { $total } 张)
operation-menu = 操作菜单
select-page = 请选择要下载的页码 (1-{ $total })：
page-caption = 第 { $page } 页，来自 { $title }
original-caption = 原图：{ $title }

# Status
checking-status = 正在检查状态...
status-message =
    系统状态：

    🤖 Bot: 正在运行
    📶 Telegram API 延迟: { $telegramLatency }ms
    { $coreStatusMsg }

    诊断操作：
pixiv-reachable = ✅ Pixiv API: 可访问 ({ $latency }ms)
pixiv-error = ❌ Pixiv API: 错误 - { $message }
core-unreachable = ❌ Core API: 无法访问 - { $message }

# Subscribe
usage-subscribe = 用法：/subscribe <artist_id>
failed-subscribe = 订阅失败：{ $error }

# Unsubscribe
subscribe-no-id = ❌ 请提供要取消订阅的画师 ID，例如：/unsub 123456
unsubscribe-not-subscribed = ⚠️ 你没有订阅画师 { $id }。
unsubscribe-success = ✅ 已成功取消订阅画师 { $id }。
