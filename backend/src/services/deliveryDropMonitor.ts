import { dbAll, dbGet, dbRun } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

interface DeliveryDrop {
  id: string;
  detected_at: string;
  period_start: string;
  period_end: string;
  previous_period_amount: number;
  current_period_amount: number;
  drop_percentage: number;
  group_id?: string;
  product_id?: string;
}

/**
 * Monitor delivery drops by comparing the last 3 hours with the previous 3 hours
 * If drop is > 20%, create a notification
 */
export const checkDeliveryDrops = async (): Promise<void> => {
  try {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    // Get deliveries in the last 3 hours (current period)
    const currentPeriodDeliveries = await dbAll(`
      SELECT 
        SUM(pd.amount) as total_amount,
        u.group_id,
        pd.product_id,
        g.name as group_name,
        p.name as product_name
      FROM product_deliveries pd
      JOIN users u ON pd.worker_id = u.id
      LEFT JOIN groups g ON u.group_id = g.id
      JOIN products p ON pd.product_id = p.id
      WHERE pd.created_at >= ? AND pd.created_at < ?
      GROUP BY u.group_id, pd.product_id
    `, [threeHoursAgo.toISOString(), now.toISOString()]);

    // Get deliveries in the previous 3 hours (previous period)
    const previousPeriodDeliveries = await dbAll(`
      SELECT 
        SUM(pd.amount) as total_amount,
        u.group_id,
        pd.product_id,
        g.name as group_name,
        p.name as product_name
      FROM product_deliveries pd
      JOIN users u ON pd.worker_id = u.id
      LEFT JOIN groups g ON u.group_id = g.id
      JOIN products p ON pd.product_id = p.id
      WHERE pd.created_at >= ? AND pd.created_at < ?
      GROUP BY u.group_id, pd.product_id
    `, [sixHoursAgo.toISOString(), threeHoursAgo.toISOString()]);

    // Create a map of previous period amounts by group and product
    const previousMap = new Map<string, number>();
    previousPeriodDeliveries.forEach((item: any) => {
      const key = `${item.group_id || 'no-group'}_${item.product_id}`;
      previousMap.set(key, item.total_amount || 0);
    });

    // Check for drops
    const drops: DeliveryDrop[] = [];
    currentPeriodDeliveries.forEach((current: any) => {
      const key = `${current.group_id || 'no-group'}_${current.product_id}`;
      const previousAmount = previousMap.get(key) || 0;
      const currentAmount = current.total_amount || 0;

      if (previousAmount > 0 && currentAmount < previousAmount) {
        const dropPercentage = ((previousAmount - currentAmount) / previousAmount) * 100;
        
        // Alert if drop is >= 20%
        if (dropPercentage >= 20) {
          drops.push({
            id: uuidv4(),
            detected_at: now.toISOString(),
            period_start: threeHoursAgo.toISOString(),
            period_end: now.toISOString(),
            previous_period_amount: previousAmount,
            current_period_amount: currentAmount,
            drop_percentage: dropPercentage,
            group_id: current.group_id || null,
            product_id: current.product_id || null,
          });
        }
      }
    });

    // Also check for groups/products that had deliveries in previous period but none in current
    previousPeriodDeliveries.forEach((previous: any) => {
      const key = `${previous.group_id || 'no-group'}_${previous.product_id}`;
      const currentAmount = currentPeriodDeliveries.find(
        (c: any) => `${c.group_id || 'no-group'}_${c.product_id}` === key
      )?.total_amount || 0;

      if (currentAmount === 0 && previous.total_amount > 0) {
        // 100% drop
        drops.push({
          id: uuidv4(),
          detected_at: now.toISOString(),
          period_start: threeHoursAgo.toISOString(),
          period_end: now.toISOString(),
          previous_period_amount: previous.total_amount,
          current_period_amount: 0,
          drop_percentage: 100,
          group_id: previous.group_id || null,
          product_id: previous.product_id || null,
        });
      }
    });

    // Save drops to database and create notifications
    for (const drop of drops) {
      // Check if we already detected this drop (avoid duplicates)
      const existing = await dbGet(`
        SELECT id FROM delivery_drops 
        WHERE group_id = ? AND product_id = ? 
        AND detected_at > datetime('now', '-1 hour')
        AND is_resolved = 0
      `, [drop.group_id || null, drop.product_id || null]);

      if (!existing) {
        // Save the drop
        await dbRun(`
          INSERT INTO delivery_drops (
            id, detected_at, period_start, period_end,
            previous_period_amount, current_period_amount, drop_percentage,
            group_id, product_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          drop.id,
          drop.detected_at,
          drop.period_start,
          drop.period_end,
          drop.previous_period_amount,
          drop.current_period_amount,
          drop.drop_percentage,
          drop.group_id,
          drop.product_id,
        ]);

        // Get group and product names for notification
        const groupName = currentPeriodDeliveries.find((c: any) => c.group_id === drop.group_id)?.group_name || 
                         previousPeriodDeliveries.find((p: any) => p.group_id === drop.group_id)?.group_name || 
                         'Unknown Group';
        const productName = currentPeriodDeliveries.find((c: any) => c.product_id === drop.product_id)?.product_name ||
                           previousPeriodDeliveries.find((p: any) => p.product_id === drop.product_id)?.product_name ||
                           'Unknown Product';

        // Create notifications for admins and operators
        const admins = await dbAll('SELECT id FROM users WHERE role = ?', ['admin']);
        const operators = await dbAll('SELECT id FROM users WHERE role = ?', ['operator']);

        const notifyUsers = [...admins, ...operators];

        for (const user of notifyUsers) {
          await dbRun(`
            INSERT INTO notifications (
              id, user_id, type, title, message, related_id, is_read
            ) VALUES (?, ?, ?, ?, ?, ?, 0)
          `, [
            uuidv4(),
            user.id,
            'delivery_drop',
            'Delivery Drop Detected',
            `Significant drop detected: ${drop.drop_percentage.toFixed(1)}% decrease in ${productName} deliveries for ${groupName}. Previous: ${drop.previous_period_amount}, Current: ${drop.current_period_amount}`,
            drop.id,
          ]);
        }

        console.log(`⚠️  Delivery drop detected: ${drop.drop_percentage.toFixed(1)}% for ${productName} in ${groupName}`);
      }
    }
  } catch (error: any) {
    console.error('Error checking delivery drops:', error);
  }
};

/**
 * Link an operator report to a delivery drop as a cause
 */
export const linkReportToDrop = async (
  dropId: string,
  reportId: string,
  causeDescription: string,
  reportedBy: string
): Promise<void> => {
  try {
    const causeId = uuidv4();
    await dbRun(`
      INSERT INTO delivery_drop_causes (
        id, drop_id, report_id, cause_description, reported_by
      ) VALUES (?, ?, ?, ?, ?)
    `, [causeId, dropId, reportId, causeDescription, reportedBy]);

    console.log(`✅ Linked report ${reportId} to delivery drop ${dropId} as cause`);
  } catch (error: any) {
    console.error('Error linking report to drop:', error);
    throw error;
  }
};




