import 'dotenv/config'; // Add this line at the very top
import pkg from 'pg';
const { Pool } = pkg;

// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import ws from "ws";
import * as schema from "@shared/schema";
import { drizzle } from 'drizzle-orm/node-postgres';

// neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
