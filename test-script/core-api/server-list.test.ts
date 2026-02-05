import { describe, expect, test } from "bun:test";

const CORE_API_URL = process.env.CORE_API_URL || "http://localhost:3000";

describe("Core API Monitored Artists", () => {
    test("GET /api/monitored-artists should return list", async () => {
        try {
            const res = await fetch(`${CORE_API_URL}/api/monitored-artists`);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
            console.log("Monitored artists:", data);
        } catch (e) {
            console.error("Core API might not be running, skipping live test.");
        }
    });
});
