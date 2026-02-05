
const BASE_URL = "http://localhost:3000";

async function testForceUpdate() {
    console.log("Testing full force update...");
    const resAll = await fetch(`${BASE_URL}/api/force-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });
    console.log("Full update response:", await resAll.json());

    console.log("\nTesting specific artist force update...");
    const resArtist = await fetch(`${BASE_URL}/api/force-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist_id: "11" }) // Pixiv official
    });
    console.log("Artist update response:", await resArtist.json());
}

testForceUpdate().catch(console.error);
