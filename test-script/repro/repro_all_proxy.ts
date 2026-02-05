const url = "https://app-api.pixiv.net/v1/user/detail?user_id=140755527";
const proxy_http = "http://192.168.2.154:19270";
const proxy_socks = "socks5://192.168.2.154:19270";

process.env.HTTP_PROXY = proxy_http;
process.env.HTTPS_PROXY = proxy_http;
process.env.ALL_PROXY = proxy_socks;

try {
    console.log(`Fetching ${url} using ALL_PROXY=${proxy_socks}...`);
    const response = await fetch(url, {
        headers: {
            "User-Agent": "PixivAndroidApp/5.0.234 (Android 11; Pixel 5)",
        }
    });
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response length: ${text.length}`);
} catch (e) {
    console.error("Fetch failed:");
    console.error(e);
}
