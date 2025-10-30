// lib/db.ts
import { initializeDatabase } from "./init-db";

const db = await initializeDatabase();

export { db };
export type Database = typeof db;
