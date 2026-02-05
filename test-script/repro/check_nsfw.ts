
import { PixivClient } from "../../packages/core-api/src/client";

async function main() {
    const refreshToken = process.env.PIXIV_REFRESH_TOKEN;
    if (!refreshToken) {
        console.error("PIXIV_REFRESH_TOKEN not found in environment");
        process.exit(1);
    }

    const client = new PixivClient(refreshToken);
    const illustId = "140798431";

    console.log(`Fetching illust ${illustId}...`);
    try {
        const result = await client.getIllustDetail(illustId);
        console.log("Full Response:", JSON.stringify(result, null, 2));
        
        const illust = result.illust;
        console.log("---------------------------------------------------");
        console.log(`Title: ${illust.title}`);
        console.log(`x_restrict: ${illust.x_restrict} (Type: ${typeof illust.x_restrict})`);
        console.log(`sanity_level: ${illust.sanity_level} (Type: ${typeof illust.sanity_level})`);
        console.log(`restrict: ${illust.restrict} (Type: ${typeof illust.restrict})`);
        console.log("---------------------------------------------------");

    } catch (error) {
        console.error("Error fetching illust:", error);
    }
}

main();
