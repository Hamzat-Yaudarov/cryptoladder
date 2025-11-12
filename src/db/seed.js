import { query, testConnection } from './connection.js';
import { UserService } from '../services/userService.js';
import { CityService } from '../services/cityService.js';
import { EconomyService } from '../services/economyService.js';

async function seed() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    console.log('🌱 Seeding database...');

    // Create test users
    const user1 = await UserService.createUser(
      123456789,
      'testuser1',
      'Test',
      'User1',
      null
    );
    console.log('✅ Created user 1:', user1.id);

    const user2 = await UserService.createUser(
      987654321,
      'testuser2',
      'Test',
      'User2',
      user1.id
    );
    console.log('✅ Created user 2:', user2.id);

    // Set balances for testing
    await UserService.setBalance(user1.id, 1000);
    await UserService.setBalance(user2.id, 500);
    console.log('✅ Set user balances');

    // Create cities
    const city1 = await CityService.createCity(user1.id);
    console.log('✅ Created city 1:', city1.id);

    const city2 = await CityService.createCity(user2.id);
    console.log('✅ Created city 2:', city2.id);

    // Create factories
    const factory1 = await EconomyService.createFactory(user1.id);
    console.log('✅ Created factory 1:', factory1.id);

    const factory2 = await EconomyService.createFactory(user2.id);
    console.log('✅ Created factory 2:', factory2.id);

    // Activate factories
    await EconomyService.activateFactory(user1.id);
    await EconomyService.activateFactory(user2.id);
    console.log('✅ Activated factories');

    console.log('\n✨ Database seeding completed!');
    console.log('Test users created:');
    console.log(`  - User 1: ID ${user1.id}, username: @${user1.username}`);
    console.log(`  - User 2: ID ${user2.id}, username: @${user2.username}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
