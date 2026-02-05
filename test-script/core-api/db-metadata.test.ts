import { describe, expect, test } from "bun:test";
import { CoreDB } from "../../packages/core-api/src/database";
import { unlinkSync, existsSync } from "fs";

describe("CoreDB Metadata", () => {
    const dbPath = "test_metadata.sqlite";
    
    test("should store and retrieve artist metadata", () => {
        if (existsSync(dbPath)) unlinkSync(dbPath);
        const db = new CoreDB(dbPath);
        
        db.addMonitoredArtist("123", "pid1", "ArtistName");
        
        const artists = db.getAllMonitoredArtists();
        expect(artists.length).toBe(1);
        expect(artists[0].artist_id).toBe("123");
        expect(artists[0].last_pid).toBe("pid1");
        expect(artists[0].artist_name).toBe("ArtistName");
        expect(artists[0].updated_at).toBeDefined();
        
        // Update PID only
        db.updateLastPid("123", "pid2");
        const artist = db.getMonitoredArtist("123");
        expect(artist?.last_pid).toBe("pid2");
        expect(artist?.artist_name).toBe("ArtistName"); // Name should persist
        
        // Update name
        db.updateLastPid("123", "pid2", "NewName");
        const artist2 = db.getMonitoredArtist("123");
        expect(artist2?.artist_name).toBe("NewName");
        
        unlinkSync(dbPath);
    });
});
