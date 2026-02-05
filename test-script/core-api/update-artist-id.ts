import { Database } from "bun:sqlite";
import path from "path";
import fs from "fs";

// 根据 packages/core-api/src/config.ts，默认路径是 file:./core.db
// 但根据 packages/core-api/src/database.ts，构造函数默认是 core_db.sqlite
// project-status.md 提到的是 core_db.sqlite

const DB_PATH = path.resolve(process.cwd(), "packages/core-api/core_db.sqlite");

if (!fs.existsSync(DB_PATH)) {
    console.error(`Database file not found at: ${DB_PATH}`);
    process.exit(1);
}

const db = new Database(DB_PATH);

const ARTIST_ID = "6586231";
const NEW_LAST_PID = "114514";

console.log(`Ensuring Artist ${ARTIST_ID} exists and setting last_pid to ${NEW_LAST_PID}...`);

try {
    // 检查记录是否存在
    const existing = db.prepare("SELECT * FROM monitored_artists WHERE artist_id = ?").get(ARTIST_ID) as any;

    if (!existing) {
        console.log(`Artist ${ARTIST_ID} not found, inserting...`);
        db.prepare(`
            INSERT INTO monitored_artists (artist_id, artist_name, last_pid, updated_at)
            VALUES (?, ?, ?, datetime('now'))
        `).run(ARTIST_ID, "Unknown Artist", NEW_LAST_PID);
    } else {
        console.log(`Artist ${ARTIST_ID} found, updating...`);
        db.prepare("UPDATE monitored_artists SET last_pid = ?, updated_at = datetime('now') WHERE artist_id = ?")
            .run(NEW_LAST_PID, ARTIST_ID);
    }

    const updated = db.prepare("SELECT * FROM monitored_artists WHERE artist_id = ?").get(ARTIST_ID) as any;
    console.log("Record in database:", updated);

    if (updated && updated.artist_id === ARTIST_ID && updated.last_pid === NEW_LAST_PID && updated.artist_name && updated.updated_at) {
        console.log("Verification successful: All fields have correct values.");
    } else {
        console.error("Verification failed: Record is incomplete or incorrect.");
        process.exit(1);
    }
} catch (error) {
    console.error("Failed to operate on database:", error);
    process.exit(1);
} finally {
    db.close();
}
