import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, requirePermission, AuthRequest } from '../middleware/auth';
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

// Create report (Users with can_edit_reports permission)
router.post('/', authenticate, requirePermission('can_edit_reports'), upload.array('images', 5), async (req: any, res) => {
  try {
    console.log('=== Report Creation Request ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('User:', (req as AuthRequest).user);
    
    const { departmentName, message } = req.body;
    const operatorId = (req as AuthRequest).user!.id;

    if (!departmentName || !departmentName.trim()) {
      console.error('Missing departmentName');
      return res.status(400).json({ error: 'Department name is required' });
    }

    if (!message || !message.trim()) {
      console.error('Missing or empty message');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create report with department_name as text
    const reportId = uuidv4();
    await dbRun(
      'INSERT INTO reports (id, department_name, operator_id, message, task_id) VALUES (?, ?, ?, ?, ?)',
      [reportId, departmentName.trim(), operatorId, message, null]
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

    // Create notification for admins
    const adminUsers = await dbAll('SELECT id FROM users WHERE role = ?', ['admin']);
    for (const admin of adminUsers) {
      const notificationId = uuidv4();
      await dbRun(
        'INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)',
        [notificationId, admin.id, 'report', 'New Report Created', `A new report has been created for ${departmentName.trim()} department`, reportId]
      );
    }

    const report = await dbGet(
      `SELECT r.*, u.username as operator_username
       FROM reports r 
       JOIN users u ON r.operator_id = u.id 
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

// Get reports by department name (Users with can_view_reports permission)
router.get('/department/:departmentName', authenticate, requirePermission('can_view_reports'), async (req: AuthRequest, res) => {
  try {
    const { departmentName } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Admin can see all reports, operators see their own
    let reports;
    if (userRole === 'admin') {
      reports = await dbAll(
        `SELECT r.*, u.username as operator_username
         FROM reports r 
         JOIN users u ON r.operator_id = u.id 
         WHERE r.department_name = ? 
         ORDER BY r.created_at DESC`,
        [departmentName]
      );
    } else {
      // Operators see their own reports only
      reports = await dbAll(
        `SELECT r.*, u.username as operator_username
         FROM reports r 
         JOIN users u ON r.operator_id = u.id 
         WHERE r.department_name = ? AND r.operator_id = ? 
         ORDER BY r.created_at DESC`,
        [departmentName, userId]
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

// Get all reports (Users with can_view_reports permission)
router.get('/', authenticate, requirePermission('can_view_reports'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let reports;
    if (userRole === 'admin') {
      // Admin sees all reports
      reports = await dbAll(
        `SELECT r.*, u.username as operator_username,
                solver.username as solved_by_username
         FROM reports r 
         JOIN users u ON r.operator_id = u.id 
         LEFT JOIN users solver ON r.solved_by = solver.id
         ORDER BY r.created_at DESC`
      );
    } else {
      // Operators and workers see their own reports only
      reports = await dbAll(
        `SELECT r.*, u.username as operator_username,
                solver.username as solved_by_username
         FROM reports r 
         JOIN users u ON r.operator_id = u.id 
         LEFT JOIN users solver ON r.solved_by = solver.id
         WHERE r.operator_id = ?
         ORDER BY r.created_at DESC`,
        [userId]
      );
    }

    // Get attachments and solved info for each report
    for (const report of reports) {
      const attachments = await dbAll('SELECT * FROM report_attachments WHERE report_id = ?', [report.id]);
      (report as any).attachments = attachments;
      
      // Get solved by username if solved
      if (report.is_solved && report.solved_by) {
        const solvedByUser = await dbGet('SELECT username FROM users WHERE id = ?', [report.solved_by]);
        (report as any).solved_by_username = solvedByUser?.username || null;
      }
    }

    res.json(reports);
  } catch (error: any) {
    console.error('Get all reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report details with comments (Users with can_view_reports permission)
router.get('/:id', authenticate, requirePermission('can_view_reports'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Get report
    const report = await dbGet(
      `SELECT r.*, u.username as operator_username
       FROM reports r 
       JOIN users u ON r.operator_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check permissions
    if (userRole === 'admin') {
      // Admin can see all
    } else if (userRole === 'operator') {
      // Operator can see their own reports
      if (report.operator_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      // Workers and others can see their own reports only
      if (report.operator_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get attachments
    const attachments = await dbAll('SELECT * FROM report_attachments WHERE report_id = ?', [id]);
    (report as any).attachments = attachments;

    // Get solved by username if solved
    if (report.is_solved && report.solved_by) {
      const solvedByUser = await dbGet('SELECT username FROM users WHERE id = ?', [report.solved_by]);
      (report as any).solved_by_username = solvedByUser?.username || null;
    }

    // Get comments
    const comments = await dbAll(
      `SELECT c.*, u.username as user_username
       FROM report_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.report_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );
    (report as any).comments = comments;

    res.json(report);
  } catch (error: any) {
    console.error('Get report details error:', error);
    res.status(500).json({ error: 'Failed to fetch report details' });
  }
});

// Add comment to report (Users with can_view_reports permission - can view means can comment)
router.post('/:id/comments', authenticate, requirePermission('can_view_reports'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Get report to check permissions
    const report = await dbGet('SELECT * FROM reports WHERE id = ?', [id]);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check permissions (same as viewing)
    if (userRole === 'admin') {
      // Admin can comment
    } else {
      // Operators and workers can comment on their own reports
      if (report.operator_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Create comment
    const commentId = uuidv4();
    await dbRun(
      'INSERT INTO report_comments (id, report_id, user_id, comment) VALUES (?, ?, ?, ?)',
      [commentId, id, userId, comment.trim()]
    );

    // Get comment with username
    const newComment = await dbGet(
      `SELECT c.*, u.username as user_username
       FROM report_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );

    res.json(newComment);
  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Mark report as solved (Users with can_edit_reports permission)
router.put('/:id/solve', authenticate, requirePermission('can_edit_reports'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Get report
    const report = await dbGet('SELECT * FROM reports WHERE id = ?', [id]);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check permissions: Non-admin users can only solve their own reports
    if (userRole !== 'admin' && report.operator_id !== userId) {
      return res.status(403).json({ error: 'You can only mark your own reports as solved' });
    }

    // Mark as solved
    await dbRun(
      'UPDATE reports SET is_solved = 1, solved_at = CURRENT_TIMESTAMP, solved_by = ? WHERE id = ?',
      [userId, id]
    );

    // Get updated report with solved_by username
    const updatedReport = await dbGet(
      `SELECT r.*, u.username as operator_username, 
              solver.username as solved_by_username
       FROM reports r 
       JOIN users u ON r.operator_id = u.id 
       LEFT JOIN users solver ON r.solved_by = solver.id
       WHERE r.id = ?`,
      [id]
    );

    res.json(updatedReport);
  } catch (error: any) {
    console.error('Mark report as solved error:', error);
    res.status(500).json({ error: 'Failed to mark report as solved' });
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

