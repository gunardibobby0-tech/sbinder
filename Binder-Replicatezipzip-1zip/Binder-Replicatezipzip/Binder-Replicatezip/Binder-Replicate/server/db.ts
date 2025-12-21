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
  } catch (err) {
    console.error('Migration error:', err);
    // Don't throw - let server continue even if migrations fail (they might already be applied)
  }
})();
