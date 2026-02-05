
import { Database } from "bun:sqlite";

const db = new Database("packages/core-api/core_db.sqlite");

console.log("Current schema:");
try {
    const tableInfo = db.prepare("PRAGMA table_info(monitored_artists)").all();
    console.log(JSON.stringify(tableInfo, null, 2));
} catch (e) {
    console.error("Error reading table info:", e);
}

try {
    console.log("Adding artist_name column...");
    db.run("ALTER TABLE monitored_artists ADD COLUMN artist_name TEXT");
} catch (e: any) {
    console.log("Result:", e.message);
}

try {
    console.log("Adding updated_at column...");
    db.run("ALTER TABLE monitored_artists ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
} catch (e: any) {
    console.log("Result:", e.message);
}

console.log("New schema:");
const newTableInfo = db.prepare("PRAGMA table_info(monitored_artists)").all();
console.log(JSON.stringify(newTableInfo, null, 2));

db.close();
