import { calculateAnalytics } from '../services/analyticsService';

// Scheduled analytics job - runs every hour
export const runAnalyticsJob = async () => {
  try {
    console.log('🔄 Running scheduled analytics calculation...');
    await calculateAnalytics();
    console.log('✅ Analytics calculation completed');
  } catch (error: any) {
    console.error('❌ Analytics job error:', error);
  }
};

// Start the analytics job scheduler (runs every hour)
export const startAnalyticsScheduler = () => {
  // Run immediately on startup
  runAnalyticsJob();

  // Then run every hour
  setInterval(() => {
    runAnalyticsJob();
  }, 60 * 60 * 1000); // 1 hour in milliseconds

  console.log('📊 Analytics scheduler started (runs every hour)');
};

