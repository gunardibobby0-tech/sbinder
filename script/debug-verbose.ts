import 'dotenv/config'; // Load environment variables first
console.log('🚀 Starting verbose debug...');

// Check environment variables
console.log('📋 Environment check:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

// Simple database connection without migrations
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/studiobinder';
console.log('🔗 Using DB URL:', dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide password

const pool = new Pool({ connectionString: dbUrl });

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('❌ Pool error:', err.message);
});

async function debugVerbose() {
  try {
    console.log('📡 Testing database connection...');
    const timeResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connected at:', timeResult.rows[0].now);
    
    // Check if users table exists
    console.log('🔍 Checking for users table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist');
      console.log('💡 Run: npm run db:push');
      return;
    }
    
    console.log('✅ Users table exists');
    
    // Count users
    const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Total users in database:', countResult.rows[0].count);
    
    // List all users
    const allUsers = await pool.query(`
      SELECT id, email, first_name, last_name, 
             CASE WHEN password_hash IS NULL THEN 'NULL' ELSE 'EXISTS' END as has_password,
             length(password_hash) as hash_length
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log('📋 All users:');
    allUsers.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.first_name} ${user.last_name} - Password: ${user.has_password}`);
    });
    
    // Check for demo user specifically
    const userResult = await pool.query(`
      SELECT id, email, first_name, last_name, password_hash 
      FROM users 
      WHERE email = $1
    `, ['demo@studiobinder.com']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Demo user not found');
      console.log('💡 Run: npm run db:seed');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Demo user found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.first_name, user.last_name);
    console.log('   Has Password Hash:', !!user.password_hash);
    console.log('   Hash Length:', user.password_hash?.length || 0);
    
    // Test password verification
    if (user.password_hash) {
      console.log('🔐 Testing password verification...');
      
      try {
        const isValid = await bcrypt.compare('Demo123!@#', user.password_hash);
        console.log('   Password "Demo123!@#" is valid:', isValid);
        
        if (!isValid) {
          console.log('❌ Password verification failed!');
          console.log('💡 User may have been created with wrong password');
          console.log('💡 Try: npm run db:setup to recreate user');
          
          // Test what the hash looks like
          console.log('   Hash starts with:', user.password_hash.substring(0, 10) + '...');
        }
      } catch (error) {
        console.log('❌ Password verification error:', (error as Error).message);
      }
    } else {
      console.log('❌ No password hash found!');
      console.log('💡 User was created without password');
      console.log('💡 Try: npm run db:setup to recreate user');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', (error as Error).message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check DATABASE_URL in .env file');
    console.log('2. Make sure PostgreSQL is running');
    console.log('3. Make sure database "studiobinder" exists');
    console.log('4. Try: createdb studiobinder');
  } finally {
    await pool.end();
    console.log('🏁 Debug complete');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugVerbose();
}

export { debugVerbose };
