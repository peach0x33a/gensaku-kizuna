
import { Database } from "bun:sqlite";

export class CoreDB {
    private db: Database;

    constructor(path = "core_db.sqlite") {
        const cleanPath = path.replace(/^file:/, "");
        this.db = new Database(cleanPath, { create: true });
        this.init();
    }

    private init() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS monitored_artists (
                artist_id TEXT PRIMARY KEY,
                artist_name TEXT,
                last_pid TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: ensure columns exist (SQLite doesn't support ADD COLUMN IF NOT EXISTS)
        try {
            this.db.run("ALTER TABLE monitored_artists ADD COLUMN artist_name TEXT");
        } catch (e) {}
        try {
            // SQLite does not support adding a column with a non-constant default value (like CURRENT_TIMESTAMP) via ALTER TABLE.
            // We add it without a default and then update existing rows if needed.
            this.db.run("ALTER TABLE monitored_artists ADD COLUMN updated_at DATETIME");
            this.db.run("UPDATE monitored_artists SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
        } catch (e) {}
    }

    addMonitoredArtist(artistId: string, lastPid?: string, artistName?: string) {
        this.db
            .prepare("INSERT OR IGNORE INTO monitored_artists (artist_id, last_pid, artist_name, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
            .run(artistId, lastPid || null, artistName || null);
    }

    updateLastPid(artistId: string, lastPid: string, artistName?: string) {
        if (artistName) {
            this.db
                .prepare("UPDATE monitored_artists SET last_pid = ?, artist_name = ?, updated_at = CURRENT_TIMESTAMP WHERE artist_id = ?")
                .run(lastPid, artistName, artistId);
        } else {
            this.db
                .prepare("UPDATE monitored_artists SET last_pid = ?, updated_at = CURRENT_TIMESTAMP WHERE artist_id = ?")
                .run(lastPid, artistId);
        }
    }

    getAllMonitoredArtists(): { artist_id: string; last_pid: string | null; artist_name: string | null; updated_at: string }[] {
        return this.db.prepare("SELECT * FROM monitored_artists").all() as any[];
    }

    getMonitoredArtist(artistId: string): { artist_id: string; last_pid: string | null; artist_name: string | null; updated_at: string } | null {
        return this.db.prepare("SELECT * FROM monitored_artists WHERE artist_id = ?").get(artistId) as any;
    }

    removeMonitoredArtist(artistId: string) {
        this.db.prepare("DELETE FROM monitored_artists WHERE artist_id = ?").run(artistId);
    }
}
