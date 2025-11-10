import { processFactoryProfits, deactivateExpiredFactories } from './factoryService.js';
import { updateWeeklyRatings, distributeWeeklyRewards } from './ratingService.js';

let profitInterval;
let ratingInterval;

export function startScheduler() {
  console.log('🎯 Starting background scheduler...');

  // Process factory profits every minute
  profitInterval = setInterval(async () => {
    try {
      await deactivateExpiredFactories();
      await processFactoryProfits();
    } catch (error) {
      console.error('Error in profit processing:', error);
    }
  }, 60000); // Every 1 minute

  // Update ratings every hour
  ratingInterval = setInterval(async () => {
    try {
      await updateWeeklyRatings();
    } catch (error) {
      console.error('Error updating ratings:', error);
    }
  }, 3600000); // Every 1 hour

  // Distribute weekly rewards every 6 hours (checking if it's a new week)
  setInterval(async () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      // Distribute at midnight (UTC)
      if (hour === 0) {
        await distributeWeeklyRewards();
      }
    } catch (error) {
      console.error('Error distributing rewards:', error);
    }
  }, 3600000); // Every 1 hour

  console.log('✅ Scheduler started successfully');
  console.log('   📊 Profit processing: every 1 minute');
  console.log('   📈 Rating updates: every 1 hour');
  console.log('   🎁 Weekly rewards: daily at midnight UTC');

  // Run initial processes
  (async () => {
    try {
      await updateWeeklyRatings();
    } catch (error) {
      console.error('Error in initial rating update:', error);
    }
  })();
}

export function stopScheduler() {
  if (profitInterval) clearInterval(profitInterval);
  if (ratingInterval) clearInterval(ratingInterval);
  console.log('⏹️  Scheduler stopped');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping scheduler...');
  stopScheduler();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping scheduler...');
  stopScheduler();
  process.exit(0);
});
