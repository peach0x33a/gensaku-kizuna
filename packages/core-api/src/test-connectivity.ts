import { PixivClient } from "./client";

async function test() {
  const refreshToken = process.env.PIXIV_REFRESH_TOKEN;
  if (!refreshToken) {
    console.error("PIXIV_REFRESH_TOKEN is missing in env");
    process.exit(1);
  }

  const client = new PixivClient(refreshToken);
  
  try {
    console.log("Testing Pixiv API Connectivity...");
    
    // Testing Illust Follow (Timeline)
    console.log("Fetching timeline...");
    const follow = await client.getIllustFollow();
    console.log(`Success! Found ${follow.illusts.length} illustrations in follow timeline.`);
    
    if (follow.illusts.length > 0) {
      const firstId = follow.illusts[0].id;
      console.log(`Fetching detail for PID: ${firstId}...`);
      const detail = await client.getIllustDetail(firstId);
      console.log(`Success! Title: ${detail.illust.title}`);
    }

    console.log("\n✅ Connectivity test PASSED");
  } catch (error) {
    console.error("\n❌ Connectivity test FAILED");
    console.error(error);
  }
}

test();
