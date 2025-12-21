import 'dotenv/config'; // Add this line at the very top
import pkg from 'pg';
const { Pool } = pkg;

// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import ws from "ws";
import * as schema from "@shared/schema";
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';

// neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Run migrations on startup
(async () => {
  try {
    const migrationsFolder = path.resolve(process.cwd(), 'migrations');
    await migrate(db, { migrationsFolder });
    console.log('✓ Database migrations completed');
  } catch (err: any) {
    // If migrations fail due to existing tables, create missing tables directly
    if (err.code === '42P07' || err.message?.includes('already exists')) {
      console.log('✓ Database tables already exist, ensuring cast/crew_master exist...');
      try {
        // Create cast table if missing
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "cast" (
            "id" serial PRIMARY KEY NOT NULL,
            "project_id" integer NOT NULL,
            "role" text NOT NULL,
            "role_type" text NOT NULL,
            "crew_master_id" integer,
            "notes" text,
            "created_at" timestamp DEFAULT now()
          )
        `);
        // Create crew_master table if missing
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "crew_master" (
            "id" serial PRIMARY KEY NOT NULL,
            "name" text NOT NULL,
            "title" text NOT NULL,
            "department" text,
            "email" text,
            "phone" text,
            "notes" text,
            "created_at" timestamp DEFAULT now()
          )
        `);
        console.log('✓ All required tables ready');
      } catch (tableErr) {
        console.error('Error ensuring cast/crew_master tables:', tableErr);
      }
    } else {
      console.error('Migration error:', err.message);
    }
  }
})();
