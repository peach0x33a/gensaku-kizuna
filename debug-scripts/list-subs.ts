
import { Database } from "bun:sqlite";

const db = new Database("packages/bot-service/db.sqlite");
const subs = db.prepare("SELECT * FROM subscriptions").all();
console.log(subs);
