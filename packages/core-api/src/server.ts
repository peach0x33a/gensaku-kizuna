import { Hono, Context } from "hono";
import { stream } from "hono/streaming";
import { PixivClient } from "./client";
import { loadConfig } from "./config";
import { getPixivHeaders } from "./utils";

const app = new Hono();
const config = loadConfig();
const client = new PixivClient(config.pixiv.refreshToken);

app.get("/health", (c: Context) => c.json({ status: "ok" }));

app.get("/api/user/:id/illusts", async (c: Context) => {
  const id = c.req.param("id");
  const type = c.req.query("type") as "illust" | "manga" | undefined;
  try {
    const res = await client.getUserIllusts(id, type);
    return c.json(res);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/illust/:id", async (c: Context) => {
  const id = c.req.param("id");
  try {
    const res = await client.getIllustDetail(id);
    return c.json(res);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/user/:id", async (c: Context) => {
  const id = c.req.param("id");
  try {
    const res = await client.getUserDetail(id);
    return c.json(res);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/ugoira/:id", async (c: Context) => {
  const id = c.req.param("id");
  try {
    const res = await client.getUgoiraMetadata(id);
    return c.json(res);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/proxy-image", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "Missing url parameter" }, 400);

  try {
    const start = Date.now();
    const headers = {
      "Referer": "https://app-api.pixiv.net/",
      "User-Agent": "PixivAndroidApp/5.0.234 (Android 11; Pixel 5)",
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return c.json({ error: `Failed to fetch image: ${response.status}` }, 500);
    }

    // Stream the response back
    c.header("Content-Type", response.headers.get("Content-Type") || "image/jpeg");
    c.header("Cache-Control", "public, max-age=31536000"); // Cache for a year

    return stream(c, async (stream) => {
      // @ts-ignore
      for await (const chunk of response.body) {
        await stream.write(chunk);
      }
    });

  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default {
  port: 3000,
  fetch: app.fetch,
};
