import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { calculateAnalytics } from '../services/analyticsService';

const router = express.Router();

// Create delivery (Production Worker only)
router.post('/', authenticate, requireRole(['worker']), async (req: AuthRequest, res) => {
  try {
    const { productId, amount, deliveryDate, notes } = req.body;
    const workerId = req.user!.id;

    if (!productId || !amount) {
      return res.status(400).json({ error: 'Product ID and amount are required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Verify worker is in Production department
    const userData = await dbGet(
      `SELECT u.department_id, d.name as department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = ?`,
      [workerId]
    );

    if (!userData || !userData.department_name || userData.department_name.toLowerCase() !== 'production') {
      return res.status(403).json({ error: 'Only workers in Production department can create deliveries' });
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
      [deliveryId, productId, workerId, amount, deliveryDateValue, notes || null]
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

// Get deliveries for a product (Admin and Production Workers)
router.get('/product/:productId', authenticate, async (req: AuthRequest, res) => {
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
    } else if (userRole === 'worker') {
      // Workers can see their own deliveries
      deliveries = await dbAll(
        `SELECT pd.*, u.username as worker_username, p.name as product_name
         FROM product_deliveries pd
         JOIN users u ON pd.worker_id = u.id
         JOIN products p ON pd.product_id = p.id
         WHERE pd.product_id = ? AND pd.worker_id = ?
         ORDER BY pd.delivery_date DESC, pd.created_at DESC`,
        [productId, userId]
      );
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(deliveries);
  } catch (error: any) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Get all deliveries (Admin only)
router.get('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const deliveries = await dbAll(
      `SELECT pd.*, u.username as worker_username, p.name as product_name
       FROM product_deliveries pd
       JOIN users u ON pd.worker_id = u.id
       JOIN products p ON pd.product_id = p.id
       ORDER BY pd.delivery_date DESC, pd.created_at DESC`
    );

    res.json(deliveries);
  } catch (error: any) {
    console.error('Get all deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Get worker's deliveries (Production Worker only)
router.get('/my-deliveries', authenticate, requireRole(['worker']), async (req: AuthRequest, res) => {
  try {
    const workerId = req.user!.id;

    // Verify worker is in Production department
    const userData = await dbGet(
      `SELECT u.department_id, d.name as department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = ?`,
      [workerId]
    );

    if (!userData || !userData.department_name || userData.department_name.toLowerCase() !== 'production') {
      return res.status(403).json({ error: 'Only workers in Production department can view deliveries' });
    }

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




