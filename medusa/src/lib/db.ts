import Database from "@tauri-apps/plugin-sql";

const db = await Database.load('sqlite:medusa.db');

// SQLX
await db.execute('');