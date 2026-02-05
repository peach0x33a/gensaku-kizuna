
import { CoreScheduler } from "../../packages/core-api/src/scheduler";
import { describe, expect, test, mock } from "bun:test";

// Mock dependencies
const mockDb = {
    getMonitoredArtist: mock(() => ({ artist_id: "123", last_pid: "100", artist_name: "TestArtist" })),
    getAllMonitoredArtists: mock(() => [
        { artist_id: "123", last_pid: "100", artist_name: "TestArtist" },
        { artist_id: "456", last_pid: "200", artist_name: "TestArtist2" }
    ]),
    updateLastPid: mock(() => {})
};

const mockClient = {
    getUserIllusts: mock((id) => {
        if (id === "123") {
            return Promise.resolve({
                illusts: [{ id: 101, title: "New Work 1", user: { name: "TestArtist" } }]
            });
        }
        return Promise.resolve({
            illusts: [{ id: 200, title: "Old Work", user: { name: "TestArtist2" } }] // No change for 456
        });
    })
};

const mockWebhookUrl = "http://localhost:3000/webhook";

describe("CoreScheduler", () => {
    test("poll() returns correct stats", async () => {
        const scheduler = new CoreScheduler(mockDb as any, mockClient as any, mockWebhookUrl);
        
        // Mock notifyBot to avoid actual fetch
        scheduler.notifyBot = mock(() => Promise.resolve());

        const stats = await scheduler.poll();

        console.log("Stats:", stats);

        expect(stats.checkedCount).toBe(2);
        expect(stats.updatedCount).toBe(1); // Only 123 updated (100 -> 101)
        expect(stats.lastCheckedIllustId).toBe("200"); // 456 was processed last, its latest is 200
    });

    test("poll(artistId) returns correct stats for single artist", async () => {
        const scheduler = new CoreScheduler(mockDb as any, mockClient as any, mockWebhookUrl);
        scheduler.notifyBot = mock(() => Promise.resolve());

        const stats = await scheduler.poll("123");

        console.log("Stats (Single):", stats);

        expect(stats.checkedCount).toBe(1);
        expect(stats.updatedCount).toBe(1);
        expect(stats.lastCheckedIllustId).toBe("101");
    });
});
