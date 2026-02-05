
import { CoreDB } from "../../packages/core-api/src/database";
import { Database } from "bun:sqlite";

console.log("Initializing CoreDB (which should create the table with all columns)...");
const coreDb = new CoreDB("packages/core-api/core_db.sqlite");

console.log("Checking schema of monitored_artists...");
const db = new Database("packages/core-api/core_db.sqlite");
const tableInfo = db.prepare("PRAGMA table_info(monitored_artists)").all();
console.log(JSON.stringify(tableInfo, null, 2));

const hasUpdatedAt = tableInfo.some((col: any) => col.name === "updated_at");
const hasArtistName = tableInfo.some((col: any) => col.name === "artist_name");

if (hasUpdatedAt && hasArtistName) {
    console.log("✅ Both updated_at and artist_name columns exist.");
} else {
    console.error("❌ Missing columns!");
    process.exit(1);
}

db.close();
