import { storage } from '../server/storage';
import { verifyPassword } from '../server/auth-utils';

async function debugAuth() {
  try {
    console.log('🔍 Debugging authentication...');
    
    // Check if demo user exists
    console.log('📧 Checking for demo user...');
    const user = await storage.getUserByEmail('demo@studiobinder.com');
    
    if (!user) {
      console.log('❌ Demo user not found in database');
      console.log('💡 Try running: npm run db:seed');
      return;
    }
    
    console.log('✅ Demo user found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.firstName, user.lastName);
    console.log('   Has Password Hash:', !!user.passwordHash);
    console.log('   Password Hash Length:', user.passwordHash?.length || 0);
    
    // Test password verification
    if (user.passwordHash) {
      console.log('🔐 Testing password verification...');
      const isValid = await verifyPassword('Demo123!@#', user.passwordHash);
      console.log('   Password "Demo123!@#" is valid:', isValid);
      
      // Test wrong password
      const isInvalid = await verifyPassword('wrongpassword', user.passwordHash);
      console.log('   Password "wrongpassword" is valid:', isInvalid);
    }
    
    // Test full credential validation
    console.log('🧪 Testing full credential validation...');
    const validatedUser = await storage.validateUserCredentials('demo@studiobinder.com', 'Demo123!@#');
    
    if (validatedUser) {
      console.log('✅ Full validation successful:');
      console.log('   User ID:', validatedUser.id);
      console.log('   Email:', validatedUser.email);
    } else {
      console.log('❌ Full validation failed');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugAuth();
}

export { debugAuth };
