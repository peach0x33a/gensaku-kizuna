const AUTH_URL = "https://oauth.secure.pixiv.net/auth/token";
const proxy = "http://192.168.2.154:19270";

process.env.HTTP_PROXY = proxy;
process.env.HTTPS_PROXY = proxy;

try {
    console.log(`Fetching ${AUTH_URL} using proxy ${proxy}...`);
    const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: {
            "User-Agent": "PixivAndroidApp/5.0.234 (Android 11; Pixel 5)",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=refresh_token&refresh_token=fake&client_id=fake&client_secret=fake"
    });
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response: ${text.substring(0, 100)}...`);
} catch (e) {
    console.error("Fetch failed:");
    console.error(e);
}
