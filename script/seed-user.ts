import { storage } from '../server/storage';
import { hashPassword } from '../server/auth-utils';

async function seedUser() {
  try {
    console.log('🌱 Seeding default user...');

    // Check if user already exists
    const existingUser = await storage.getUserByEmail('demo@studiobinder.com');
    if (existingUser) {
      console.log('✅ Demo user already exists');
      return;
    }

    // Create demo user
    const passwordHash = await hashPassword('Demo123!@#');
    const user = await storage.createUser({
      email: 'demo@studiobinder.com',
      firstName: 'Demo',
      lastName: 'User',
      passwordHash,
    });

    console.log('✅ Demo user created successfully:');
    console.log('   Email: demo@studiobinder.com');
    console.log('   Password: Demo123!@#');
    console.log('   User ID:', user.id);
  } catch (error) {
    console.error('❌ Error seeding user:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUser()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedUser };
