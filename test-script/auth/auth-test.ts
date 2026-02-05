
import { loadConfig } from "../../packages/core-api/src/config";
import { PixivClient } from "../../packages/core-api/src/client";

async function test() {
    console.log("Loading config...");
    const config = loadConfig();

    const client = new PixivClient(config.pixiv.refreshToken);

    console.log("Attempting getUserDetail...");
    try {
        const res = await client.getUserDetail("6586231");
        console.log("Success! User:", res.user.name);
    } catch (e) {
        console.error("Failed:", e);
    }
}

test();
