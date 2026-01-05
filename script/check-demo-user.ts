import 'dotenv/config';

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

const dbUrl = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: dbUrl });

async function checkDemoUser() {
  try {
    console.log('🔍 Checking demo user...');
    
    // Check for demo user
    const userResult = await pool.query(`
      SELECT id, email, first_name, last_name, password_hash 
      FROM users 
      WHERE email = $1
    `, ['demo@studiobinder.com']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Demo user not found');
      console.log('💡 Creating demo user...');
      
      // Create the demo user
      const passwordHash = await bcrypt.hash('Demo123!@#', 12);
      await pool.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ($1, $2, $3, $4)
      `, ['demo@studiobinder.com', 'Demo', 'User', passwordHash]);
      
      console.log('✅ Demo user created successfully!');
      console.log('   Email: demo@studiobinder.com');
      console.log('   Password: Demo123!@#');
      
    } else {
      const user = userResult.rows[0];
      console.log('✅ Demo user found:');
      console.log('   Email:', user.email);
      console.log('   Name:', user.first_name, user.last_name);
      console.log('   Has Password:', !!user.password_hash);
      
      if (user.password_hash) {
        console.log('🔐 Testing password...');
        const isValid = await bcrypt.compare('Demo123!@#', user.password_hash);
        console.log('   Password "Demo123!@#" valid:', isValid);
        
        if (!isValid) {
          console.log('❌ Password verification failed - recreating user...');
          await pool.query('DELETE FROM users WHERE email = $1', ['demo@studiobinder.com']);
          
          const passwordHash = await bcrypt.hash('Demo123!@#', 12);
          await pool.query(`
            INSERT INTO users (email, first_name, last_name, password_hash)
            VALUES ($1, $2, $3, $4)
          `, ['demo@studiobinder.com', 'Demo', 'User', passwordHash]);
          
          console.log('✅ Demo user recreated with correct password!');
        }
      } else {
        console.log('❌ No password hash - recreating user...');
        await pool.query('DELETE FROM users WHERE email = $1', ['demo@studiobinder.com']);
        
        const passwordHash = await bcrypt.hash('Demo123!@#', 12);
        await pool.query(`
          INSERT INTO users (email, first_name, last_name, password_hash)
          VALUES ($1, $2, $3, $4)
        `, ['demo@studiobinder.com', 'Demo', 'User', passwordHash]);
        
        console.log('✅ Demo user recreated with password!');
      }
    }
    
    // Final verification
    const finalCheck = await pool.query(`
      SELECT email, first_name, last_name, password_hash 
      FROM users 
      WHERE email = $1
    `, ['demo@studiobinder.com']);
    
    if (finalCheck.rows.length > 0) {
      const user = finalCheck.rows[0];
      const isValid = await bcrypt.compare('Demo123!@#', user.password_hash);
      console.log('🎉 Final verification:');
      console.log('   User exists: ✅');
      console.log('   Password works:', isValid ? '✅' : '❌');
      
      if (isValid) {
        console.log('');
        console.log('🚀 Ready to login!');
        console.log('   Go to: http://localhost:5000');
        console.log('   Email: demo@studiobinder.com');
        console.log('   Password: Demo123!@#');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  } finally {
    await pool.end();
  }
}

checkDemoUser();
