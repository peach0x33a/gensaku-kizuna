
// @ts-ignore
import { Bot, InputFile } from "../../node_modules/.bun/grammy@1.39.3/node_modules/grammy";

// Run from root: bun run debug-scripts/bot-photo-test.ts
const env = await Bun.file(".env").text();
const token = env.match(/BOT_TOKEN=(.+)/)?.[1];

if (!token) {
    console.error("No BOT_TOKEN found in .env");
    process.exit(1);
}

const bot = new Bot(token);

async function test() {
    if (!token) return;
    console.log("Using Token:", token.slice(0, 5) + "...");

    // Create a simple red 1x1 pixel JPEG
    const base64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    const buffer = Buffer.from(base64, "base64");

    // User ID from the log: 2017924851
    const userId = 2017924851;

    console.log("Attempting check...");
    try {
        const me = await bot.api.getMe();
        console.log("Bot connected as:", me.username);
    } catch (e) {
        console.error("getMe failed. Connectivity issue?");
        console.error(e);
        return;
    }

    console.log("Attempting sendPhoto (File Path)...");
    try {
        await Bun.write("test-script/bot/assets/temp.jpg", buffer);
        await bot.api.sendPhoto(userId, new InputFile("test-script/bot/assets/temp.jpg"), {
            caption: "Test Photo from Debug Script (File Path)"
        });
        console.log("Success: sendPhoto (File Path) worked.");
        // await Bun.file("test-script/bot/assets/temp.jpg").delete(); // Cleanup later
    } catch (e) {
        console.error("Failure: sendPhoto (File Path) failed.");
        console.error(e);
    }
}

test();
