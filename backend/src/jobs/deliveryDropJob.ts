import { checkDeliveryDrops } from '../services/deliveryDropMonitor';

/**
 * Start the delivery drop monitoring job
 * Runs every hour to check for delivery drops
 */
export const startDeliveryDropMonitoring = (): void => {
  // Run immediately on start
  checkDeliveryDrops().catch(console.error);

  // Then run every hour
  setInterval(() => {
    checkDeliveryDrops().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour in milliseconds

  console.log('✅ Delivery drop monitoring started (runs every hour)');
};




