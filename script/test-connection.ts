import 'dotenv/config';

console.log('🚀 Testing database connection...');

import pkg from 'pg';
const { Pool } = pkg;

const dbUrl = process.env.DATABASE_URL;
console.log('📋 DATABASE_URL:', dbUrl ? 'SET' : 'NOT SET');

if (!dbUrl) {
  console.log('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('🔗 Testing connection to:', dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

const pool = new Pool({ connectionString: dbUrl });

async function testConnection() {
  try {
    console.log('📡 Connecting...');
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Connected successfully!');
    console.log('📅 Server time:', result.rows[0].current_time);
    console.log('📋 PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    
    // Test if database exists and we can query tables
    console.log('🔍 Checking database access...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in database:');
    if (tables.rows.length === 0) {
      console.log('   No tables found - database might be empty');
    } else {
      tables.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', (error as Error).message);
    
    // Common PostgreSQL errors and solutions
    const errorMsg = (error as Error).message;
    
    if (errorMsg.includes('database "studiobinder" does not exist')) {
      console.log('');
      console.log('💡 Solution: Create the database');
      console.log('   createdb studiobinder');
    } else if (errorMsg.includes('password authentication failed')) {
      console.log('');
      console.log('💡 Solution: Check your PostgreSQL password');
      console.log('   Current password in .env: 123123');
      console.log('   Make sure this matches your Laragon PostgreSQL setup');
    } else if (errorMsg.includes('connection refused')) {
      console.log('');
      console.log('💡 Solution: Start PostgreSQL service');
      console.log('   Make sure PostgreSQL is running in Laragon');
    } else if (errorMsg.includes('ECONNREFUSED')) {
      console.log('');
      console.log('💡 Solution: Check PostgreSQL port');
      console.log('   Make sure PostgreSQL is running on port 5432');
    }
    
  } finally {
    await pool.end();
    console.log('🏁 Test complete');
  }
}

testConnection();
