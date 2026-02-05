
async function testPush() {
    const artistId = "6586231";
    const illustId = "140677537";

    console.log(`Fetching real data for Illust ID ${illustId}...`);

    try {
        // 1. Fetch real data from Core API
        const coreRes = await fetch(`http://localhost:3000/api/illust/${illustId}`);
        if (!coreRes.ok) {
            throw new Error(`Failed to fetch illust from Core API: ${coreRes.status}`);
        }

        const data = await coreRes.json() as any;
        const illust = data.illust;

        if (!illust) {
            throw new Error("No illust data returned");
        }

        console.log(`Got illust: ${illust.title}`);

        // 2. Construct Webhook Payload
        const payload = {
            type: "new_artwork",
            artist_id: artistId,
            illust: illust
        };

        // 3. Send Webhook
        console.log("Sending Webhook...");
        const res = await fetch("http://localhost:3001/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            console.log("✅ Webhook sent successfully!");
        } else {
            console.error("❌ Webhook failed:", res.status, await res.text());
        }

    } catch (e) {
        console.error("❌ Test failed:", e);
    }
}

testPush();
