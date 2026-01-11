import express from 'express';
import { authenticate, requireRole, requirePermission, AuthRequest } from '../middleware/auth';
import { calculateAnalytics, getCachedAnalytics, getWorkerAnalytics } from '../services/analyticsService';
import { dbAll } from '../database/db';

const router = express.Router();

// Get production analytics (Users with can_view_analytics permission) - Now based on product deliveries
router.get('/production', authenticate, requirePermission('can_view_analytics'), async (req: AuthRequest, res) => {
  try {
    // Get date range from query parameters (optional)
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    
    // Build WHERE clause for date filtering
    let dateFilter = '';
    const params: any[] = [];
    if (startDate || endDate) {
      const conditions: string[] = [];
      if (startDate) {
        conditions.push('pd.delivery_date >= ?');
        params.push(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDateStr = endDateObj.toISOString().split('T')[0];
        conditions.push('pd.delivery_date < ?');
        params.push(endDateStr);
      }
      if (conditions.length > 0) {
        dateFilter = 'WHERE ' + conditions.join(' AND ');
      }
    }
    
    // Get product deliveries with optional date filtering
    const deliveries = await dbAll(`
      SELECT pd.*, p.name as product_name, u.username as worker_username
      FROM product_deliveries pd
      JOIN products p ON pd.product_id = p.id
      JOIN users u ON pd.worker_id = u.id
      ${dateFilter}
      ORDER BY pd.delivery_date DESC, pd.created_at DESC
    `, params);
    
    const totalDeliveries = deliveries.length;
    const totalAmount = deliveries.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
    
    // Group by product
    const productMap = new Map<string, { count: number; totalAmount: number }>();
    deliveries.forEach((delivery: any) => {
      const productName = delivery.product_name || 'Unknown';
      const existing = productMap.get(productName) || { count: 0, totalAmount: 0 };
      productMap.set(productName, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + (delivery.amount || 0)
      });
    });
    const deliveriesByProduct = Array.from(productMap.entries()).map(([productName, data]) => ({
      productName,
      deliveryCount: data.count,
      totalAmount: data.totalAmount
    }));
    
    // Group by worker
    const workerMap = new Map<string, { count: number; totalAmount: number }>();
    deliveries.forEach((delivery: any) => {
      const workerName = delivery.worker_username || 'Unknown';
      const existing = workerMap.get(workerName) || { count: 0, totalAmount: 0 };
      workerMap.set(workerName, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + (delivery.amount || 0)
      });
    });
    const deliveriesByWorker = Array.from(workerMap.entries()).map(([workerName, data]) => ({
      workerName,
      deliveryCount: data.count,
      totalAmount: data.totalAmount
    }));
    
    // Group by date (all dates in the filtered results)
    const dateMap = new Map<string, number>();
    deliveries.forEach((delivery: any) => {
      const deliveryDate = new Date(delivery.delivery_date);
      const dateKey = deliveryDate.toISOString().split('T')[0];
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + (delivery.amount || 0));
    });
    const deliveriesByDate = Array.from(dateMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({
      totalDeliveries,
      totalAmount,
      deliveriesByProduct,
      deliveriesByWorker,
      deliveriesByDate,
    });
  } catch (error: any) {
    console.error('Get production analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch production analytics' });
  }
});

// Get maintenance analytics (Users with can_view_analytics permission)
router.get('/maintenance', authenticate, requirePermission('can_view_analytics'), async (req: AuthRequest, res) => {
  try {
    // Get date range from query parameters (optional)
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    
    // Build WHERE clause for date filtering
    let dateFilter = '';
    const params: any[] = [];
    if (startDate || endDate) {
      const conditions: string[] = [];
      if (startDate) {
        conditions.push('r.created_at >= ?');
        params.push(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDateStr = endDateObj.toISOString().split('T')[0];
        conditions.push('r.created_at < ?');
        params.push(endDateStr);
      }
      if (conditions.length > 0) {
        dateFilter = 'WHERE ' + conditions.join(' AND ');
      }
    }
    
    // Get reports with optional date filtering
    const reports = await dbAll(`
      SELECT r.*, g.name as group_name
      FROM reports r
      LEFT JOIN tasks t ON r.task_id = t.id
      LEFT JOIN groups g ON t.group_id = g.id
      ${dateFilter}
    `, params);
    
    const totalReports = reports.length;
    
    // Group by group
    const groupMap = new Map<string, number>();
    reports.forEach((report: any) => {
      const groupName = report.group_name || 'Unassigned';
      groupMap.set(groupName, (groupMap.get(groupName) || 0) + 1);
    });
    const reportsByGroup = Array.from(groupMap.entries()).map(([groupName, count]) => ({
      groupName,
      count
    }));
    
    // Calculate average response time (placeholder - calculate from timestamps if needed)
    const averageResponseTime = 0; // TODO: Calculate from report timestamps if needed
    
    res.json({
      totalReports,
      reportsByGroup,
      averageResponseTime,
    });
  } catch (error: any) {
    console.error('Get maintenance analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance analytics' });
  }
});

// Get personal analytics (Worker only)
router.get('/personal', authenticate, requireRole(['worker']), async (req: AuthRequest, res) => {
  try {
    const workerId = req.user!.id;
    const analytics = await getWorkerAnalytics(workerId);
    res.json(analytics);
  } catch (error: any) {
    console.error('Get personal analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch personal analytics' });
  }
});

// Get group performance comparison (Users with can_view_analytics permission)
router.get('/groups', authenticate, requirePermission('can_view_analytics'), async (req: AuthRequest, res) => {
  try {
    // Get date range from query parameters (optional)
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    
    // Build date filter for product_deliveries
    let dateFilter = '';
    const dateParams: any[] = [];
    if (startDate || endDate) {
      const conditions: string[] = [];
      if (startDate) {
        conditions.push('pd.delivery_date >= ?');
        dateParams.push(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDateStr = endDateObj.toISOString().split('T')[0];
        conditions.push('pd.delivery_date < ?');
        dateParams.push(endDateStr);
      }
      if (conditions.length > 0) {
        dateFilter = 'AND ' + conditions.join(' AND ');
      }
    }
    
    // Get all groups with their delivery performance (filtered by date if provided)
    const groupPerformance = await dbAll(`
      SELECT 
        g.id,
        g.name as group_name,
        g.start_time,
        g.end_time,
        COUNT(DISTINCT pd.id) as total_deliveries,
        COALESCE(SUM(pd.amount), 0) as total_amount,
        COUNT(DISTINCT pd.worker_id) as active_workers,
        COUNT(DISTINCT pd.product_id) as products_handled,
        AVG(pd.amount) as avg_delivery_amount,
        MAX(pd.created_at) as last_delivery_at
      FROM groups g
      LEFT JOIN users u ON u.group_id = g.id
      LEFT JOIN product_deliveries pd ON pd.worker_id = u.id ${dateFilter}
      GROUP BY g.id, g.name, g.start_time, g.end_time
      ORDER BY total_amount DESC
    `, dateParams);

    // Calculate efficiency scores (deliveries per worker)
    const groupStats = groupPerformance.map((group: any) => {
      const efficiency = group.active_workers > 0 
        ? (group.total_deliveries / group.active_workers).toFixed(2)
        : '0';
      return {
        ...group,
        efficiency_score: parseFloat(efficiency),
        total_amount: group.total_amount || 0,
        total_deliveries: group.total_deliveries || 0,
        active_workers: group.active_workers || 0,
        products_handled: group.products_handled || 0,
        avg_delivery_amount: group.avg_delivery_amount ? parseFloat(group.avg_delivery_amount).toFixed(2) : 0,
      };
    });

    // Get hourly trends for each group (within date range if provided, otherwise last 24 hours)
    let hourlyDateFilter = '';
    const hourlyDateParams: any[] = [];
    if (startDate || endDate) {
      const conditions: string[] = [];
      if (startDate) {
        conditions.push('pd.delivery_date >= ?');
        hourlyDateParams.push(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDateStr = endDateObj.toISOString().split('T')[0];
        conditions.push('pd.delivery_date < ?');
        hourlyDateParams.push(endDateStr);
      }
      if (conditions.length > 0) {
        hourlyDateFilter = 'AND ' + conditions.join(' AND ');
      }
    } else {
      hourlyDateFilter = "AND pd.created_at >= datetime('now', '-24 hours')";
    }
    
    const hourlyTrends = await dbAll(`
      SELECT 
        g.id as group_id,
        g.name as group_name,
        strftime('%H', pd.created_at) as hour,
        COUNT(DISTINCT pd.id) as deliveries,
        SUM(pd.amount) as amount
      FROM groups g
      LEFT JOIN users u ON u.group_id = g.id
      LEFT JOIN product_deliveries pd ON pd.worker_id = u.id ${hourlyDateFilter}
      GROUP BY g.id, g.name, hour
      ORDER BY g.name, hour
    `, hourlyDateParams);

    res.json({
      groups: groupStats,
      hourlyTrends,
    });
  } catch (error: any) {
    console.error('Get group analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch group analytics' });
  }
});

// Get product-specific analytics (Users with can_view_analytics permission)
router.get('/product/:productId', authenticate, requirePermission('can_view_analytics'), async (req: AuthRequest, res) => {
  try {
    const { productId } = req.params;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    
    // Verify product exists
    const product = await dbAll('SELECT id, name, description, image_url FROM products WHERE id = ?', [productId]);
    if (!product || product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Build date filter
    let dateFilter = '';
    const params: any[] = [productId];
    if (startDate || endDate) {
      const conditions: string[] = ['pd.product_id = ?'];
      if (startDate) {
        conditions.push('pd.delivery_date >= ?');
        params.push(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDateStr = endDateObj.toISOString().split('T')[0];
        conditions.push('pd.delivery_date < ?');
        params.push(endDateStr);
      }
      dateFilter = 'WHERE ' + conditions.join(' AND ');
    } else {
      dateFilter = 'WHERE pd.product_id = ?';
    }
    
    // Get all deliveries for this product
    const deliveries = await dbAll(`
      SELECT pd.*, u.username as worker_username, u.id as worker_id,
             g.name as group_name, g.id as group_id,
             strftime('%H:%M', pd.created_at) as delivery_hour
      FROM product_deliveries pd
      JOIN users u ON pd.worker_id = u.id
      LEFT JOIN groups g ON u.group_id = g.id
      ${dateFilter}
      ORDER BY pd.delivery_date DESC, pd.created_at DESC
    `, params);
    
    const totalDeliveries = deliveries.length;
    const totalAmount = deliveries.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
    const avgAmount = totalDeliveries > 0 ? totalAmount / totalDeliveries : 0;
    
    // Group by group (best performing group)
    const groupMap = new Map<string, { count: number; totalAmount: number }>();
    deliveries.forEach((delivery: any) => {
      const groupName = delivery.group_name || 'Unassigned';
      const existing = groupMap.get(groupName) || { count: 0, totalAmount: 0 };
      groupMap.set(groupName, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + (delivery.amount || 0)
      });
    });
    const groupsByPerformance = Array.from(groupMap.entries())
      .map(([groupName, data]) => ({
        groupName,
        deliveryCount: data.count,
        totalAmount: data.totalAmount,
        avgAmount: data.count > 0 ? data.totalAmount / data.count : 0
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
    const bestGroup = groupsByPerformance.length > 0 ? groupsByPerformance[0] : null;
    
    // Group by worker
    const workerMap = new Map<string, { count: number; totalAmount: number }>();
    deliveries.forEach((delivery: any) => {
      const workerName = delivery.worker_username || 'Unknown';
      const existing = workerMap.get(workerName) || { count: 0, totalAmount: 0 };
      workerMap.set(workerName, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + (delivery.amount || 0)
      });
    });
    const workersByPerformance = Array.from(workerMap.entries())
      .map(([workerName, data]) => ({
        workerName,
        deliveryCount: data.count,
        totalAmount: data.totalAmount,
        avgAmount: data.count > 0 ? data.totalAmount / data.count : 0
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
    
    // Group by date (trends)
    const dateMap = new Map<string, { count: number; totalAmount: number }>();
    deliveries.forEach((delivery: any) => {
      const dateKey = new Date(delivery.delivery_date).toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || { count: 0, totalAmount: 0 };
      dateMap.set(dateKey, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + (delivery.amount || 0)
      });
    });
    const deliveriesByDate = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        deliveryCount: data.count,
        totalAmount: data.totalAmount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({
      product: product[0],
      totalDeliveries,
      totalAmount,
      avgAmount,
      bestGroup,
      groupsByPerformance,
      workersByPerformance: workersByPerformance.slice(0, 10), // Top 10 workers
      deliveriesByDate,
      deliveries: deliveries.slice(0, 100), // Latest 100 deliveries for history
    });
  } catch (error: any) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

// Get delivery drops and causes (Admin only)
router.get('/delivery-drops', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const drops = await dbAll(`
      SELECT 
        dd.*,
        g.name as group_name,
        p.name as product_name,
        u.username as resolved_by_username
      FROM delivery_drops dd
      LEFT JOIN groups g ON dd.group_id = g.id
      LEFT JOIN products p ON dd.product_id = p.id
      LEFT JOIN users u ON dd.resolved_by = u.id
      ORDER BY dd.detected_at DESC
      LIMIT 50
    `);

    // Get causes for each drop
    const dropsWithCauses = await Promise.all(
      drops.map(async (drop: any) => {
        const causes = await dbAll(`
          SELECT 
            ddc.*,
            r.message as report_message,
            u.username as reported_by_username
          FROM delivery_drop_causes ddc
          JOIN reports r ON ddc.report_id = r.id
          JOIN users u ON ddc.reported_by = u.id
          WHERE ddc.drop_id = ?
        `, [drop.id]);

        return {
          ...drop,
          causes,
        };
      })
    );

    res.json({
      drops: dropsWithCauses,
      totalDrops: drops.length,
      unresolvedDrops: drops.filter((d: any) => !d.is_resolved).length,
    });
  } catch (error: any) {
    console.error('Get delivery drops error:', error);
    res.status(500).json({ error: 'Failed to fetch delivery drops' });
  }
});

// Get comprehensive KPIs (Admin only)
router.get('/kpis', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Today's metrics
    const todayDeliveries = await dbAll(`
      SELECT 
        COUNT(*) as total_deliveries,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM product_deliveries
      WHERE DATE(delivery_date) = DATE('now')
    `);

    // Yesterday's metrics (for comparison)
    const yesterdayDeliveries = await dbAll(`
      SELECT 
        COUNT(*) as total_deliveries,
        SUM(amount) as total_amount
      FROM product_deliveries
      WHERE DATE(delivery_date) = DATE('now', '-1 day')
    `);

    // Last 7 days trend
    const weeklyTrend = await dbAll(`
      SELECT 
        DATE(delivery_date) as date,
        COUNT(*) as deliveries,
        SUM(amount) as amount
      FROM product_deliveries
      WHERE delivery_date >= DATE('now', '-7 days')
      GROUP BY DATE(delivery_date)
      ORDER BY date
    `);

    // Worker productivity
    const workerProductivity = await dbAll(`
      SELECT 
        u.username,
        u.id,
        COUNT(pd.id) as deliveries,
        SUM(pd.amount) as total_amount,
        AVG(pd.amount) as avg_amount
      FROM users u
      JOIN product_deliveries pd ON pd.worker_id = u.id
      WHERE pd.delivery_date >= DATE('now', '-30 days')
      GROUP BY u.id, u.username
      ORDER BY total_amount DESC
      LIMIT 10
    `);

    // Product performance
    const productPerformance = await dbAll(`
      SELECT 
        p.name,
        p.id,
        COUNT(pd.id) as deliveries,
        SUM(pd.amount) as total_amount,
        AVG(pd.amount) as avg_amount
      FROM products p
      JOIN product_deliveries pd ON pd.product_id = p.id
      WHERE pd.delivery_date >= DATE('now', '-30 days')
      GROUP BY p.id, p.name
      ORDER BY total_amount DESC
    `);

    // Efficiency metrics
    const totalWorkers = await dbAll(`
      SELECT COUNT(*) as count FROM users WHERE role = 'worker' AND is_active = 1
    `);

    const activeWorkers = await dbAll(`
      SELECT COUNT(DISTINCT worker_id) as count 
      FROM product_deliveries 
      WHERE delivery_date >= DATE('now', '-7 days')
    `);

    const todayData = todayDeliveries[0] || { total_deliveries: 0, total_amount: 0, avg_amount: 0 };
    const yesterdayData = yesterdayDeliveries[0] || { total_deliveries: 0, total_amount: 0 };

    // Calculate growth rates
    const deliveryGrowth = yesterdayData.total_deliveries > 0
      ? (((todayData.total_deliveries - yesterdayData.total_deliveries) / yesterdayData.total_deliveries) * 100).toFixed(2)
      : todayData.total_deliveries > 0 ? '100.00' : '0.00';

    const amountGrowth = yesterdayData.total_amount > 0
      ? (((todayData.total_amount - yesterdayData.total_amount) / yesterdayData.total_amount) * 100).toFixed(2)
      : todayData.total_amount > 0 ? '100.00' : '0.00';

    res.json({
      today: {
        deliveries: todayData.total_deliveries || 0,
        amount: todayData.total_amount || 0,
        avgAmount: parseFloat(todayData.avg_amount || 0).toFixed(2),
      },
      yesterday: {
        deliveries: yesterdayData.total_deliveries || 0,
        amount: yesterdayData.total_amount || 0,
      },
      growth: {
        deliveries: parseFloat(deliveryGrowth),
        amount: parseFloat(amountGrowth),
      },
      weeklyTrend,
      workerProductivity,
      productPerformance,
      efficiency: {
        totalWorkers: totalWorkers[0]?.count || 0,
        activeWorkers: activeWorkers[0]?.count || 0,
        utilizationRate: totalWorkers[0]?.count > 0
          ? ((activeWorkers[0]?.count || 0) / totalWorkers[0].count * 100).toFixed(2)
          : '0.00',
      },
    });
  } catch (error: any) {
    console.error('Get KPIs error:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

// Force refresh analytics (Admin only)
router.post('/refresh', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const metrics = await calculateAnalytics();
    res.json({ message: 'Analytics refreshed successfully', metrics });
  } catch (error: any) {
    console.error('Refresh analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh analytics' });
  }
});

export default router;

