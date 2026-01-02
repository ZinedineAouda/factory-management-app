import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { calculateAnalytics } from '../services/analyticsService';
import { linkReportToDrop } from '../services/deliveryDropMonitor';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for report image uploads
const storage = multer.diskStorage({
  destination: (req: any, file: Express.Multer.File, cb: any) => {
    const uploadDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `report-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Create report (Operator only)
router.post('/', authenticate, requireRole(['operator']), upload.array('images', 5), async (req: any, res) => {
  try {
    console.log('=== Report Creation Request ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('User:', (req as AuthRequest).user);
    
    const { departmentId, message } = req.body;
    const operatorId = (req as AuthRequest).user!.id;

    if (!departmentId) {
      console.error('Missing departmentId');
      return res.status(400).json({ error: 'Department ID is required' });
    }

    if (!message || !message.trim()) {
      console.error('Missing or empty message');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify department exists
    const department = await dbGet('SELECT id, name FROM departments WHERE id = ?', [departmentId]);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Create report
    const reportId = uuidv4();
    // Insert with task_id as NULL (since we're using department_id now)
    await dbRun(
      'INSERT INTO reports (id, department_id, operator_id, message, task_id) VALUES (?, ?, ?, ?, ?)',
      [reportId, departmentId, operatorId, message, null]
    );

    // Handle image uploads
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      for (const file of files) {
        const attachmentId = uuidv4();
        await dbRun(
          'INSERT INTO report_attachments (id, report_id, file_url, file_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
          [attachmentId, reportId, `/uploads/reports/${file.filename}`, file.originalname, file.size, file.mimetype]
        );
      }
    }

    // Create notification for admin and department leader
    const adminUsers = await dbAll('SELECT id FROM users WHERE role = ?', ['admin']);
    for (const admin of adminUsers) {
      const notificationId = uuidv4();
      await dbRun(
        'INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)',
        [notificationId, admin.id, 'report', 'New Report Created', `A new report has been created for ${department.name} department`, reportId]
      );
    }

    // Notify department leader if exists
    const leader = await dbGet('SELECT id FROM users WHERE role = ? AND department_id = ?', ['leader', departmentId]);
    if (leader) {
      const notificationId = uuidv4();
      await dbRun(
        'INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)',
        [notificationId, leader.id, 'report', 'New Report for Your Department', `A new report has been created for ${department.name} department`, reportId]
      );
    }

    const report = await dbGet(
      `SELECT r.*, u.username as operator_username, d.name as department_name
       FROM reports r 
       JOIN users u ON r.operator_id = u.id 
       JOIN departments d ON r.department_id = d.id
       WHERE r.id = ?`,
      [reportId]
    );

    const attachments = await dbAll('SELECT * FROM report_attachments WHERE report_id = ?', [reportId]);

    // Update analytics after report creation (reports may indicate task issues)
    calculateAnalytics().catch(err => console.error('Analytics update error:', err));

    res.status(201).json({
      ...report,
      attachments,
    });
  } catch (error: any) {
    console.error('=== Create report error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to create report' });
  }
});

// Get reports for a department (Admin, Leader of that department, and Operator who created it)
router.get('/department/:departmentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { departmentId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Admin can see all reports, leaders can see reports for their department, operators can see their own
    let reports;
    if (userRole === 'admin') {
      reports = await dbAll(
        `SELECT r.*, u.username as operator_username, d.name as department_name
         FROM reports r 
         JOIN users u ON r.operator_id = u.id 
         JOIN departments d ON r.department_id = d.id
         WHERE r.department_id = ? 
         ORDER BY r.created_at DESC`,
        [departmentId]
      );
    } else if (userRole === 'leader') {
      // Verify leader belongs to this department
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [userId]);
      if (userData && userData.department_id === departmentId) {
        reports = await dbAll(
          `SELECT r.*, u.username as operator_username, d.name as department_name
           FROM reports r 
           JOIN users u ON r.operator_id = u.id 
           JOIN departments d ON r.department_id = d.id
           WHERE r.department_id = ? 
           ORDER BY r.created_at DESC`,
          [departmentId]
        );
      } else {
        return res.status(403).json({ error: 'You can only view reports for your own department' });
      }
    } else {
      reports = await dbAll(
        `SELECT r.*, u.username as operator_username, d.name as department_name
         FROM reports r 
         JOIN users u ON r.operator_id = u.id 
         JOIN departments d ON r.department_id = d.id
         WHERE r.department_id = ? AND r.operator_id = ? 
         ORDER BY r.created_at DESC`,
        [departmentId, userId]
      );
    }

    // Get attachments for each report
    for (const report of reports) {
      const attachments = await dbAll('SELECT * FROM report_attachments WHERE report_id = ?', [report.id]);
      (report as any).attachments = attachments;
    }

    res.json(reports);
  } catch (error: any) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get all reports (Admin and Leaders can see reports for their departments)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let reports;
    if (userRole === 'admin') {
      // Admin sees all reports
      reports = await dbAll(
        `SELECT r.*, u.username as operator_username, d.name as department_name
         FROM reports r 
         JOIN users u ON r.operator_id = u.id 
         JOIN departments d ON r.department_id = d.id
         ORDER BY r.created_at DESC`
      );
    } else if (userRole === 'leader') {
      // Leaders see reports for their department
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [userId]);
      if (userData && userData.department_id) {
        reports = await dbAll(
          `SELECT r.*, u.username as operator_username, d.name as department_name
           FROM reports r 
           JOIN users u ON r.operator_id = u.id 
           JOIN departments d ON r.department_id = d.id
           WHERE r.department_id = ?
           ORDER BY r.created_at DESC`,
          [userData.department_id]
        );
      } else {
        reports = [];
      }
    } else {
      // Operators see their own reports
      reports = await dbAll(
        `SELECT r.*, u.username as operator_username, d.name as department_name
         FROM reports r 
         JOIN users u ON r.operator_id = u.id 
         JOIN departments d ON r.department_id = d.id
         WHERE r.operator_id = ?
         ORDER BY r.created_at DESC`,
        [userId]
      );
    }

    // Get attachments for each report
    for (const report of reports) {
      const attachments = await dbAll('SELECT * FROM report_attachments WHERE report_id = ?', [report.id]);
      (report as any).attachments = attachments;
    }

    res.json(reports);
  } catch (error: any) {
    console.error('Get all reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Link a report to a delivery drop as a cause (Operator only)
router.post('/:reportId/link-to-drop', authenticate, requireRole(['operator']), async (req: any, res) => {
  try {
    const { reportId } = req.params;
    const { dropId, causeDescription } = req.body;
    const operatorId = (req as AuthRequest).user!.id;

    if (!dropId || !causeDescription) {
      return res.status(400).json({ error: 'Drop ID and cause description are required' });
    }

    // Verify report exists and belongs to the operator
    const report = await dbGet('SELECT id, operator_id FROM reports WHERE id = ?', [reportId]);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.operator_id !== operatorId) {
      return res.status(403).json({ error: 'You can only link your own reports' });
    }

    // Verify drop exists
    const drop = await dbGet('SELECT id FROM delivery_drops WHERE id = ?', [dropId]);
    if (!drop) {
      return res.status(404).json({ error: 'Delivery drop not found' });
    }

    // Link the report to the drop
    await linkReportToDrop(dropId, reportId, causeDescription, operatorId);

    res.json({ message: 'Report successfully linked to delivery drop as cause' });
  } catch (error: any) {
    console.error('Link report to drop error:', error);
    res.status(500).json({ error: 'Failed to link report to drop' });
  }
});

export default router;

