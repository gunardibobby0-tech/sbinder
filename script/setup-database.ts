import { pool } from '../server/db';
import { hashPassword } from '../server/auth-utils';

async function setupDatabase() {
  try {
    console.log('🔧 Setting up StudioBinder database...');

    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Create users table with password hash column if it doesn't exist
    console.log('👥 Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar UNIQUE,
        "first_name" varchar,
        "last_name" varchar,
        "password_hash" varchar,
        "profile_image_url" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);
    console.log('✅ Users table ready');

    // Create sessions table for authentication
    console.log('🔐 Creating sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar PRIMARY KEY NOT NULL,
        "sess" jsonb NOT NULL,
        "expire" timestamp NOT NULL
      )
    `);
    console.log('✅ Sessions table ready');

    // Create index for sessions
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire")
    `);

    // Create demo user
    console.log('🌱 Creating demo user...');
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['demo@studiobinder.com']);
    
    if (existingUser.rows.length === 0) {
      const passwordHash = await hashPassword('Demo123!@#');
      await pool.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ($1, $2, $3, $4)
      `, ['demo@studiobinder.com', 'Demo', 'User', passwordHash]);
      console.log('✅ Demo user created: demo@studiobinder.com / Demo123!@#');
    } else {
      console.log('✅ Demo user already exists');
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the app: npm run dev');
    console.log('2. Visit: http://localhost:5000');
    console.log('3. Login with: demo@studiobinder.com / Demo123!@#');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your DATABASE_URL in .env file');
    console.log('3. Ensure the database exists: createdb studiobinder');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };
