import { describe, expect, test, mock, afterAll, beforeAll } from "bun:test";

// Mock env vars before importing server which runs loadConfig
process.env.PIXIV_REFRESH_TOKEN = "mock_refresh";
process.env.BOT_TOKEN = "mock_bot";
process.env.DATABASE_URL = "file:test.db";

import { Hono } from "hono";
// Import file path directly/dynamically if needed or ensure explicit export
// Since server.ts exports a default object { port, fetch }, we can import it
// But for testing Hono app logic, we often want the `app` instance.
// However, our server.ts doesn't export `app` directly, it exports { fetch }.
// That is sufficient for app.request(req).

const { default: server } = await import("../../packages/core-api/src/server");

describe("Server API", () => {

    test("GET /health returns ok", async () => {
        const req = new Request("http://localhost:3000/health");
        const res = await server.fetch(req);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ status: "ok" });
    });

    test("GET /api/proxy-image requires url param", async () => {
        const req = new Request("http://localhost:3000/api/proxy-image");
        const res = await server.fetch(req);
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Missing url parameter" });
    });

    test("GET /api/proxy-image proxies request with referer", async () => {
        const originalFetch = globalThis.fetch;

        // Mock the upstream image fetch
        globalThis.fetch = mock(() => Promise.resolve(new Response("image_data", {
            status: 200,
            headers: { "Content-Type": "image/png" }
        }))) as any;

        const targetUrl = "https://i.pximg.net/img/123.png";
        const req = new Request(`http://localhost:3000/api/proxy-image?url=${encodeURIComponent(targetUrl)}`);

        const res = await server.fetch(req);
        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toBe("image/png");
        expect(await res.text()).toBe("image_data");

        // Verify headers sent to upstream
        expect(globalThis.fetch).toHaveBeenCalled();
        const callArgs = (globalThis.fetch as any).mock.lastCall;
        const fetchUrl = callArgs[0];
        const fetchOptions = callArgs[1];

        expect(fetchUrl).toBe(targetUrl);
        expect(fetchOptions.headers["Referer"]).toBe("https://app-api.pixiv.net/");
        expect(fetchOptions.headers["User-Agent"]).toContain("PixivAndroidApp");

        globalThis.fetch = originalFetch;
    });
});
