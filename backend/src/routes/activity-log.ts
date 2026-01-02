import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get activity log (Admin only)
router.get('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activities = await dbAll(
      `SELECT al.*, u.username 
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json(activities);
  } catch (error: any) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

// Clear activity log (Admin only)
router.delete('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    await dbRun('DELETE FROM activity_log');
    res.json({ message: 'Activity log cleared successfully' });
  } catch (error: any) {
    console.error('Clear activity log error:', error);
    res.status(500).json({ error: 'Failed to clear activity log' });
  }
});

// Helper function to log activity
export const logActivity = async (
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: string
) => {
  try {
    const id = uuidv4();
    await dbRun(
      'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, action, entityType || null, entityId || null, details || null]
    );
  } catch (error: any) {
    console.error('Error logging activity:', error);
  }
};

export default router;

