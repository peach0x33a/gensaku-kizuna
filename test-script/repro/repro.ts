const url = "https://app-api.pixiv.net/v1/user/detail?user_id=140755527";
const proxy = "http://192.168.2.154:19270";

process.env.HTTP_PROXY = proxy;
process.env.HTTPS_PROXY = proxy;

try {
    console.log(`Fetching ${url} using proxy ${proxy}...`);
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
