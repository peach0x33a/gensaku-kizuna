import { Hono, Context } from "hono";
import { stream } from "hono/streaming";
import { PixivClient } from "./client";
import { loadConfig } from "./config";
import { getPixivHeaders, cleanId, logger } from "./utils";
import { CoreDB } from "./database";
import { CoreScheduler } from "./scheduler";

const app = new Hono();

// Logger Middleware
app.use("*", async (c, next) => {
  const method = c.req.method;
  const url = c.req.url;
  logger.info(`${method} ${url}`);
  await next();
});

const config = loadConfig();
const client = new PixivClient(config.pixiv.refreshToken);
const db = new CoreDB(config.database.url);
const botWebhookUrl = process.env.BOT_WEBHOOK_URL || "http://localhost:3001/webhook";
const scheduler = new CoreScheduler(db, client, botWebhookUrl);

// Start Scheduler
scheduler.start();

app.get("/api/monitored-artists", (c: Context) => {
  return c.json(db.getAllMonitoredArtists());
});

app.get("/health", (c: Context) => c.json({ status: "ok" }));

app.get("/api/health/pixiv", async (c: Context) => {
  try {
    const start = Date.now();
    await client.getUserDetail("11"); // Fetch 'pixiv' official account
    const latency = Date.now() - start;
    return c.json({ status: "ok", latency });
  } catch (e: any) {
    return c.json({ status: "error", message: e.message }, 500);
  }
});

app.onError((err, c) => {
logger.error(`[Unhandled Error] ${c.req.method} ${c.req.url}:`, err);
return c.json({ error: err.message }, 500);
});

app.post("/api/monitor", async (c: Context) => {
  const body = await c.req.json();
  const { artist_id, last_pid, artist_name } = body;

  if (!artist_id) return c.json({ error: "Missing artist_id" }, 400);

  db.addMonitoredArtist(artist_id, last_pid, artist_name);
  return c.json({ status: "monitored", artist_id });
});

app.delete("/api/monitored-artist/:id", (c: Context) => {
  const id = cleanId(c.req.param("id"));
  db.removeMonitoredArtist(id);
  return c.json({ status: "removed", artist_id: id });
});

app.post("/api/force-update", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const { artist_id } = body;

  try {
    // We don't await poll() if it takes too long,
    // but here we might want to wait for it to finish for the response.
    // Given it's a "force-update" triggered by user, waiting is usually fine.
    const result = await scheduler.poll(artist_id);
    return c.json({
        status: "ok",
        message: artist_id ? `Update triggered for artist ${artist_id}` : "Full update triggered",
        updatedCount: result.updatedCount,
        checkedCount: result.checkedCount,
        lastCheckedIllustId: result.lastCheckedIllustId
    });
  } catch (e: any) {
    logger.error("Error in force-update:", e);
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/user/:id/illusts", async (c: Context) => {
  const id = cleanId(c.req.param("id"));
  const type = c.req.query("type") as "illust" | "manga" | undefined;
  try {
    const res = await client.getUserIllusts(id, type);
    return c.json(res);
  } catch (e: any) {
    logger.error(`Error fetching user ${id} illusts:`, e);
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/illust/:id", async (c: Context) => {
  const id = cleanId(c.req.param("id"));
  try {
    const res = await client.getIllustDetail(id);
    return c.json(res);
  } catch (e: any) {
    logger.error(`Error fetching illust ${id} detail:`, e);
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/user/:id", async (c: Context) => {
  const id = cleanId(c.req.param("id"));
  try {
    const res = await client.getUserDetail(id);
    return c.json(res);
  } catch (e: any) {
    logger.error(`Error fetching user ${id} detail:`, e);
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/ugoira/:id", async (c: Context) => {
  const id = cleanId(c.req.param("id"));
  try {
    const res = await client.getUgoiraMetadata(id);
    return c.json(res);
  } catch (e: any) {
    logger.error(`Error fetching ugoira ${id} metadata:`, e);
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

    const response = await fetch(url, { headers, verbose: config.verboseRequest } as RequestInit);

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
    logger.error(`Error proxying image ${url}:`, e);
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/illust/:id/zip", async (c) => {
  const id = cleanId(c.req.param("id"));
  try {
    const res = await client.getIllustDetail(id);
    const illust = res.illust;

    if (illust.page_count <= 1) {
      return c.json({ error: "Only multi-page illusts can be zipped" }, 400);
    }

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    const fetchPage = async (url: string, index: number) => {
      const headers = {
        "Referer": "https://app-api.pixiv.net/",
        "User-Agent": "PixivAndroidApp/5.0.234 (Android 11; Pixel 5)",
      };
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`Failed to fetch page ${index}: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const ext = url.split(".").pop() || "jpg";
      zip.file(`${index}.${ext}`, arrayBuffer);
    };

    const tasks = illust.meta_pages.map((page, index) =>
      fetchPage(page.image_urls.original, index)
    );

    await Promise.all(tasks);

    const content = await zip.generateAsync({ type: "uint8array" });

    c.header("Content-Type", "application/zip");
    c.header("Content-Disposition", `attachment; filename="${id}.zip"`);

    return c.body(content as any);
  } catch (e: any) {
    logger.error(`Error zipping illust ${id}:`, e);
    return c.json({ error: e.message }, 500);
  }
});

export default {
  port: 3000,
  fetch: app.fetch,
};
