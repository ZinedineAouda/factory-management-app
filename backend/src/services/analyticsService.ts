import { dbRun, dbGet, dbAll } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsMetrics {
  productionQuantity: Record<string, number>;
  productionProgress: Record<string, number>;
  timeSpent: Record<string, number>;
  delays: any[];
  incompleteTasks: any[];
  maintenanceTasks: number;
  maintenanceStatus: Record<string, number>;
  averageResolutionTime: number;
}

// Calculate and cache analytics
export const calculateAnalytics = async (): Promise<AnalyticsMetrics> => {
  try {
    const now = new Date();
    const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    const periodEnd = now;

    // Production quantity per product
    const productionTasks = await dbAll(
      `SELECT p.name as product_name, COUNT(*) as quantity, 
              SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM tasks t
       JOIN products p ON t.product_id = p.id
       WHERE t.task_type = 'production' AND t.created_at >= ?
       GROUP BY p.id, p.name`,
      [periodStart.toISOString()]
    );

    const productionQuantity: Record<string, number> = {};
    const productionProgress: Record<string, number> = {};
    productionTasks.forEach((task: any) => {
      productionQuantity[task.product_name] = task.quantity;
      productionProgress[task.product_name] = task.quantity > 0 
        ? Math.round((task.completed / task.quantity) * 100) 
        : 0;
    });

    // Time spent per task
    const timeSpentData = await dbAll(
      `SELECT t.id, t.title, 
              CASE 
                WHEN t.completed_at IS NOT NULL AND t.started_at IS NOT NULL 
                THEN (julianday(t.completed_at) - julianday(t.started_at)) * 24
                ELSE NULL 
              END as hours_spent
       FROM tasks t
       WHERE t.started_at IS NOT NULL`,
      []
    );

    const timeSpent: Record<string, number> = {};
    timeSpentData.forEach((task: any) => {
      if (task.hours_spent !== null) {
        timeSpent[task.title] = Math.round(task.hours_spent * 100) / 100;
      }
    });

    // Delays and incomplete tasks
    const delayedTasks = await dbAll(
      `SELECT t.*, p.name as product_name, g.name as group_name
       FROM tasks t
       LEFT JOIN products p ON t.product_id = p.id
       LEFT JOIN groups g ON t.group_id = g.id
       WHERE t.deadline < date('now') AND t.status != 'completed' AND t.status != 'cancelled'`,
      []
    );

    const incompleteTasks = await dbAll(
      `SELECT t.*, p.name as product_name, g.name as group_name
       FROM tasks t
       LEFT JOIN products p ON t.product_id = p.id
       LEFT JOIN groups g ON t.group_id = g.id
       WHERE t.status != 'completed' AND t.status != 'cancelled'`,
      []
    );

    // Maintenance analytics
    const maintenanceTasks = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE task_type = ?',
      ['maintenance']
    );

    const maintenanceStatusData = await dbAll(
      `SELECT status, COUNT(*) as count 
       FROM tasks 
       WHERE task_type = 'maintenance' 
       GROUP BY status`,
      []
    );

    const maintenanceStatus: Record<string, number> = {};
    maintenanceStatusData.forEach((item: any) => {
      maintenanceStatus[item.status] = item.count;
    });

    // Average resolution time for maintenance tasks
    const resolutionTimes = await dbAll(
      `SELECT (julianday(completed_at) - julianday(created_at)) * 24 as hours
       FROM tasks 
       WHERE task_type = 'maintenance' AND completed_at IS NOT NULL`,
      []
    );

    const averageResolutionTime = resolutionTimes.length > 0
      ? Math.round((resolutionTimes.reduce((sum: number, t: any) => sum + t.hours, 0) / resolutionTimes.length) * 100) / 100
      : 0;

    const metrics: AnalyticsMetrics = {
      productionQuantity,
      productionProgress,
      timeSpent,
      delays: delayedTasks,
      incompleteTasks,
      maintenanceTasks: maintenanceTasks?.count || 0,
      maintenanceStatus,
      averageResolutionTime,
    };

    // Cache the results
    const cacheId = uuidv4();
    await dbRun(
      `INSERT OR REPLACE INTO analytics_cache 
       (id, metric_type, metric_key, metric_value, period_start, period_end) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cacheId, 'full_metrics', 'all', JSON.stringify(metrics), periodStart.toISOString(), periodEnd.toISOString()]
    );

    return metrics;
  } catch (error: any) {
    console.error('Calculate analytics error:', error);
    throw error;
  }
};

// Get cached analytics
export const getCachedAnalytics = async (): Promise<AnalyticsMetrics | null> => {
  try {
    const cached = await dbGet(
      `SELECT metric_value, calculated_at 
       FROM analytics_cache 
       WHERE metric_type = ? AND metric_key = ? 
       ORDER BY calculated_at DESC LIMIT 1`,
      ['full_metrics', 'all']
    );

    if (cached) {
      const age = new Date().getTime() - new Date(cached.calculated_at).getTime();
      const oneHour = 60 * 60 * 1000;
      
      // Return cached if less than 1 hour old
      if (age < oneHour) {
        return JSON.parse(cached.metric_value);
      }
    }

    return null;
  } catch (error: any) {
    console.error('Get cached analytics error:', error);
    return null;
  }
};

// Get worker personal analytics
export const getWorkerAnalytics = async (workerId: string) => {
  try {
    const tasksCompleted = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = ?',
      [workerId, 'completed']
    );

    const timeSpentData = await dbAll(
      `SELECT (julianday(completed_at) - julianday(started_at)) * 24 as hours
       FROM tasks 
       WHERE assigned_to = ? AND completed_at IS NOT NULL AND started_at IS NOT NULL`,
      [workerId]
    );

    const totalHours = timeSpentData.reduce((sum: number, t: any) => sum + (t.hours || 0), 0);

    const groupContribution = await dbGet(
      `SELECT g.name as group_name, COUNT(*) as task_count
       FROM tasks t
       JOIN groups g ON t.group_id = g.id
       WHERE t.assigned_to = ?
       GROUP BY g.id, g.name`,
      [workerId]
    );

    return {
      tasksCompleted: tasksCompleted?.count || 0,
      totalHoursSpent: Math.round(totalHours * 100) / 100,
      averageTaskTime: timeSpentData.length > 0 ? Math.round((totalHours / timeSpentData.length) * 100) / 100 : 0,
      groupContribution: groupContribution || {},
    };
  } catch (error: any) {
    console.error('Get worker analytics error:', error);
    throw error;
  }
};

