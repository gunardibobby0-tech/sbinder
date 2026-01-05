import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

// Simple database connection without migrations
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/studiobinder'
});

async function debugSimple() {
  try {
    console.log('🔍 Simple auth debug...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    
    // Check if users table exists
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
    
    // Check for demo user
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
        }
      } catch (error) {
        console.log('❌ Password verification error:', error.message);
      }
    } else {
      console.log('❌ No password hash found!');
      console.log('💡 User was created without password');
      console.log('💡 Try: npm run db:setup to recreate user');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check DATABASE_URL in .env file');
    console.log('2. Make sure PostgreSQL is running');
    console.log('3. Make sure database "studiobinder" exists');
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugSimple();
}

export { debugSimple };
