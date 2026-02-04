
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
                last_pid TEXT
            )
        `);
    }

    addMonitoredArtist(artistId: string, lastPid?: string) {
        this.db
            .prepare("INSERT OR IGNORE INTO monitored_artists (artist_id, last_pid) VALUES (?, ?)")
            .run(artistId, lastPid || null);
    }

    updateLastPid(artistId: string, lastPid: string) {
        this.db
            .prepare("UPDATE monitored_artists SET last_pid = ? WHERE artist_id = ?")
            .run(lastPid, artistId);
    }

    getAllMonitoredArtists(): { artist_id: string; last_pid: string | null }[] {
        return this.db.prepare("SELECT * FROM monitored_artists").all() as any[];
    }

    getMonitoredArtist(artistId: string): { artist_id: string; last_pid: string | null } | null {
        return this.db.prepare("SELECT * FROM monitored_artists WHERE artist_id = ?").get(artistId) as any;
    }
}
