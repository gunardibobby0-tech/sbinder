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
        
        // Add missing columns to events table if they don't exist
        await pool.query(`
          ALTER TABLE "events" 
          ADD COLUMN IF NOT EXISTS "latitude" text,
          ADD COLUMN IF NOT EXISTS "longitude" text
        `);

        // Add missing columns to user_settings table if they don't exist
        await pool.query(`
          ALTER TABLE "user_settings" 
          ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'IDR'
        `);

        // Add missing columns to crew_master table if they don't exist
        await pool.query(`
          ALTER TABLE "crew_master" 
          ADD COLUMN IF NOT EXISTS "cost_amount" text,
          ADD COLUMN IF NOT EXISTS "payment_type" text,
          ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'IDR'
        `);

        // Create storyboards table if missing
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "storyboards" (
            "id" serial PRIMARY KEY NOT NULL,
            "project_id" integer NOT NULL,
            "title" text NOT NULL,
            "description" text,
            "created_at" timestamp DEFAULT now(),
            "updated_at" timestamp DEFAULT now()
          )
        `);

        // Create storyboard_images table if missing
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "storyboard_images" (
            "id" serial PRIMARY KEY NOT NULL,
            "storyboard_id" integer NOT NULL,
            "image_url" text NOT NULL,
            "caption" text,
            "sequence_order" integer,
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
