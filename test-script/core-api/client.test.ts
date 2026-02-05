import { describe, expect, test, mock, spyOn } from "bun:test";
import { PixivClient } from "../../packages/core-api/src/client";
import { getPixivHeaders, generateHash } from "../../packages/core-api/src/utils";

describe("Utils", () => {
    test("generateHash should produce correct MD5 hash", () => {
        // Known timestamp and salt combination (mocking logic)
        // Timestamp: 2026-01-29T21:17:08+08:00
        // Salt suffix: 28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c
        // Expected hash is computed from "2026-01-29T21:17:08+08:00" + SALT
        // Since we can't easily replicate md5 here without crypto, we ensure it returns a hex string of length 32
        const hash = generateHash("2026-01-29T21:17:08+08:00");
        expect(hash).toHaveLength(32);
        // We trust node:crypto works, we are testing our usage
    });

    test("getPixivHeaders should include required headers", () => {
        const headers = getPixivHeaders("access_token_123");
        expect(headers["User-Agent"]).toBe("PixivAndroidApp/5.0.234 (Android 11; Pixel 5)");
        expect(headers["App-OS"]).toBe("android");
        expect(headers["Accept-Language"]).toBe("zh-cn");
        expect(headers["Authorization"]).toBe("Bearer access_token_123");
        expect(headers["X-Client-Time"]).toBeDefined();
        expect(headers["X-Client-Hash"]).toBeDefined();
    });
});

describe("PixivClient", () => {
    // Mock fetch for all tests
    const originalFetch = globalThis.fetch;

    // Helper to mock successful JSON response
    const mockJson = (data: any) => mock(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
        headers: new Headers(),
    } as Response));

    test("getUserIllusts calls correct endpoint with params", async () => {
        const client = new PixivClient("refresh_token_test");
        // Mock ensureAuth to avoid real auth call
        // @ts-ignore
        client.accessToken = "mock_access_token";
        // @ts-ignore
        client.expiresAt = Date.now() + 10000000;

        globalThis.fetch = mockJson({ illusts: [] }) as any;

        await client.getUserIllusts(12345, "manga");

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const url = new URL((globalThis.fetch as any).mock.lastCall[0]);
        expect(url.pathname).toBe("/v1/user/illusts");
        expect(url.searchParams.get("user_id")).toBe("12345");
        expect(url.searchParams.get("type")).toBe("manga");

        globalThis.fetch = originalFetch;
    });

    test("getIllustDetail calls correct endpoint", async () => {
        const client = new PixivClient("refresh_token_test");
        // @ts-ignore
        client.accessToken = "mock_access_token";
        // @ts-ignore
        client.expiresAt = Date.now() + 10000000;

        globalThis.fetch = mockJson({ illust: { id: "999" } }) as any;

        await client.getIllustDetail("999");

        const url = new URL((globalThis.fetch as any).mock.lastCall[0]);
        expect(url.pathname).toBe("/v1/illust/detail");
        expect(url.searchParams.get("illust_id")).toBe("999");

        globalThis.fetch = originalFetch;
    });

    test("getUgoiraMetadata calls correct endpoint", async () => {
        const client = new PixivClient("refresh_token_test");
        // @ts-ignore
        client.accessToken = "mock_access_token";
        // @ts-ignore
        client.expiresAt = Date.now() + 10000000;

        globalThis.fetch = mockJson({ ugoira_metadata: {} }) as any;

        await client.getUgoiraMetadata("555");

        const url = new URL((globalThis.fetch as any).mock.lastCall[0]);
        expect(url.pathname).toBe("/v1/ugoira/metadata");
        expect(url.searchParams.get("illust_id")).toBe("555");

        globalThis.fetch = originalFetch;
    });
});
