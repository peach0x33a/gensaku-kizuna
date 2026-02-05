import { Database } from "bun:sqlite";
import { z } from "zod";

export const SubscriptionSchema = z.object({
    user_id: z.string(),
    illustrator_id: z.string(),
    last_pid: z.string().optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

export class DB {
    private db: Database;

    constructor(path = "db.sqlite") {
        const cleanPath = path.replace(/^file:/, "");
        this.db = new Database(cleanPath, { create: true });
        this.init();
    }

    private init() {
        this.db
            .prepare(
                `
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT NOT NULL,
        illustrator_id TEXT NOT NULL,
        last_pid TEXT,
        PRIMARY KEY (user_id, illustrator_id)
      )
    `
            )
            .run();
    }

    addSubscription(userId: string, illustratorId: string) {
        this.db
            .prepare(
                "INSERT OR IGNORE INTO subscriptions (user_id, illustrator_id) VALUES (?, ?)"
            )
            .run(userId, illustratorId);
    }

    removeSubscription(userId: string, illustratorId: string) {
        this.db
            .prepare(
                "DELETE FROM subscriptions WHERE user_id = ? AND illustrator_id = ?"
            )
            .run(userId, illustratorId);
    }

    getSubscriptions(userId?: string): Subscription[] {
        if (userId) {
            return this.db
                .prepare("SELECT * FROM subscriptions WHERE user_id = ?")
                .all(userId) as Subscription[];
        }
        return this.db.prepare("SELECT * FROM subscriptions").all() as Subscription[];
    }

    getSubscribers(illustratorId: string): Subscription[] {
        return this.db
            .prepare("SELECT * FROM subscriptions WHERE illustrator_id = ?")
            .all(illustratorId) as Subscription[];
    }

    getUserSubscriptions(userId: string): string[] {
        const subs = this.getSubscriptions(userId);
        return subs.map(s => s.illustrator_id);
    }

    getAllSubscriptions(): Subscription[] {
        return this.db.prepare("SELECT * FROM subscriptions").all() as Subscription[];
    }

    updateLastPid(userId: string, illustratorId: string, lastPid: string) {
        this.db
            .prepare(
                "UPDATE subscriptions SET last_pid = ? WHERE user_id = ? AND illustrator_id = ?"
            )
            .run(lastPid, userId, illustratorId);
    }
}
