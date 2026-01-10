import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, requirePermission, AuthRequest } from '../middleware/auth';
import { calculateAnalytics } from '../services/analyticsService';

const router = express.Router();

// Create delivery (Users with can_view_products OR can_edit_products permission)
// - can_view_products: can enter delivery amounts (for analytics tracking)
// - can_edit_products: can declare delivery amounts
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { productId, amount, deliveryDate, notes } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!productId || !amount) {
      return res.status(400).json({ error: 'Product ID and amount are required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Check permissions: Admin always allowed, others need can_view_products OR can_edit_products
    if (userRole !== 'admin') {
      // Normalize role to lowercase for database lookup
      const normalizedRole = String(userRole || '').toLowerCase().trim();
      
      const rolePermissions = await dbGet(
        'SELECT can_view_products, can_edit_products FROM role_permissions WHERE LOWER(role) = ?',
        [normalizedRole]
      );

      if (!rolePermissions) {
        console.error(`[DELIVERY] No permissions found for role: ${userRole} (normalized: ${normalizedRole})`);
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          details: `No role permissions found for role: ${userRole}`
        });
      }

      const hasViewPermission = (rolePermissions as any).can_view_products === 1;
      const hasEditPermission = (rolePermissions as any).can_edit_products === 1;

      console.log(`[DELIVERY] Role: ${userRole}, hasViewPermission: ${hasViewPermission}, hasEditPermission: ${hasEditPermission}`);

      if (!hasViewPermission && !hasEditPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions. You need view or edit products permission to create deliveries.',
          details: `Role ${userRole} does not have can_view_products or can_edit_products permission`
        });
      }
    }

    // Verify product exists
    const product = await dbGet('SELECT id, name FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create delivery
    const deliveryId = uuidv4();
    const deliveryDateValue = deliveryDate || new Date().toISOString().split('T')[0];
    
    await dbRun(
      'INSERT INTO product_deliveries (id, product_id, worker_id, amount, delivery_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [deliveryId, productId, userId, amount, deliveryDateValue, notes || null]
    );

    // Update analytics
    calculateAnalytics().catch(err => console.error('Analytics update error:', err));

    const delivery = await dbGet(
      `SELECT pd.*, u.username as worker_username, p.name as product_name
       FROM product_deliveries pd
       JOIN users u ON pd.worker_id = u.id
       JOIN products p ON pd.product_id = p.id
       WHERE pd.id = ?`,
      [deliveryId]
    );

    res.status(201).json(delivery);
  } catch (error: any) {
    console.error('Create delivery error:', error);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

// Get deliveries for a product (Users with can_view_products permission)
router.get('/product/:productId', authenticate, requirePermission('can_view_products'), async (req: AuthRequest, res) => {
  try {
    const { productId } = req.params;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    // Verify product exists
    const product = await dbGet('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let deliveries;
    if (userRole === 'admin') {
      // Admin can see all deliveries
      deliveries = await dbAll(
        `SELECT pd.*, u.username as worker_username, p.name as product_name
         FROM product_deliveries pd
         JOIN users u ON pd.worker_id = u.id
         JOIN products p ON pd.product_id = p.id
         WHERE pd.product_id = ?
         ORDER BY pd.delivery_date DESC, pd.created_at DESC`,
        [productId]
      );
    } else {
      // Non-admin users see their own deliveries
      deliveries = await dbAll(
        `SELECT pd.*, u.username as worker_username, p.name as product_name
         FROM product_deliveries pd
         JOIN users u ON pd.worker_id = u.id
         JOIN products p ON pd.product_id = p.id
         WHERE pd.product_id = ? AND pd.worker_id = ?
         ORDER BY pd.delivery_date DESC, pd.created_at DESC`,
        [productId, userId]
      );
    }

    res.json(deliveries);
  } catch (error: any) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Get all deliveries (Users with can_view_products permission, admin sees all, others see their own)
router.get('/', authenticate, requirePermission('can_view_products'), async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.id;

    let deliveries;
    if (userRole === 'admin') {
      // Admin sees all deliveries
      deliveries = await dbAll(
        `SELECT pd.*, u.username as worker_username, p.name as product_name
         FROM product_deliveries pd
         JOIN users u ON pd.worker_id = u.id
         JOIN products p ON pd.product_id = p.id
         ORDER BY pd.delivery_date DESC, pd.created_at DESC`
      );
    } else {
      // Non-admin users see their own deliveries
      deliveries = await dbAll(
        `SELECT pd.*, u.username as worker_username, p.name as product_name
         FROM product_deliveries pd
         JOIN users u ON pd.worker_id = u.id
         JOIN products p ON pd.product_id = p.id
         WHERE pd.worker_id = ?
         ORDER BY pd.delivery_date DESC, pd.created_at DESC`,
        [userId]
      );
    }

    res.json(deliveries);
  } catch (error: any) {
    console.error('Get all deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Get worker's deliveries (Users with can_view_products permission)
router.get('/my-deliveries', authenticate, requirePermission('can_view_products'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const deliveries = await dbAll(
      `SELECT pd.*, p.name as product_name
       FROM product_deliveries pd
       JOIN products p ON pd.product_id = p.id
       WHERE pd.worker_id = ?
       ORDER BY pd.delivery_date DESC, pd.created_at DESC`,
      [workerId]
    );

    res.json(deliveries);
  } catch (error: any) {
    console.error('Get my deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

export default router;




