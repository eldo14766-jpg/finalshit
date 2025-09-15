import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure PostgreSQL client for Replit environment
const sql = postgres(process.env.DATABASE_URL, {
  ssl: false, // Disable SSL since DATABASE_URL includes sslmode=disable
  max: 10,    // Maximum connections
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql, { schema });
