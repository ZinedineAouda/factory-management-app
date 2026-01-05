import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { calculateAnalytics } from '../services/analyticsService';

const router = express.Router();

// Get tasks (filtered by department for workers)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    let tasks;
    if (user.role === 'admin') {
      // Admins see all tasks
      tasks = await dbAll(`
        SELECT t.*, d.name as department_name, g.name as group_name, p.name as product_name
        FROM tasks t
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN groups g ON t.group_id = g.id
        LEFT JOIN products p ON t.product_id = p.id
        ORDER BY t.created_at DESC
      `);
    } else if (user.role === 'leader') {
      // Leaders see tasks for their department
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [user.id]);
      if (!userData || !userData.department_id) {
        return res.json([]);
      }
      tasks = await dbAll(`
        SELECT t.*, d.name as department_name, g.name as group_name, p.name as product_name
        FROM tasks t
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN groups g ON t.group_id = g.id
        LEFT JOIN products p ON t.product_id = p.id
        WHERE t.department_id = ?
        ORDER BY t.created_at DESC
      `, [userData.department_id]);
    } else if (user.role === 'operator') {
      // Operators see maintenance tasks for their groups
      const userData = await dbGet('SELECT group_id FROM users WHERE id = ?', [user.id]);
      if (!userData || !userData.group_id) {
        return res.json([]);
      }
      tasks = await dbAll(`
        SELECT t.*, d.name as department_name, g.name as group_name, p.name as product_name
        FROM tasks t
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN groups g ON t.group_id = g.id
        LEFT JOIN products p ON t.product_id = p.id
        WHERE t.task_type = 'maintenance' AND t.group_id = ?
        ORDER BY t.created_at DESC
      `, [userData.group_id]);
    } else {
      // Workers see tasks assigned to their group
      const userData = await dbGet('SELECT group_id FROM users WHERE id = ?', [user.id]);
      if (!userData || !userData.group_id) {
        return res.json([]);
      }
      tasks = await dbAll(`
        SELECT t.*, d.name as department_name, g.name as group_name, p.name as product_name
        FROM tasks t
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN groups g ON t.group_id = g.id
        LEFT JOIN products p ON t.product_id = p.id
        WHERE t.group_id = ? OR t.assigned_to = ?
        ORDER BY t.created_at DESC
      `, [userData.group_id, user.id]);
    }

    res.json(tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      additionalInfo: task.additional_info,
      departmentId: task.department_id,
      departmentName: task.department_name,
      departmentType: task.department_type,
      groupId: task.group_id,
      groupName: task.group_name,
      productId: task.product_id,
      productName: task.product_name,
      taskType: task.task_type,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status,
      progressPercentage: task.progress_percentage,
      assignedTo: task.assigned_to,
      createdBy: task.created_by,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      startedAt: task.started_at,
      completedAt: task.completed_at,
    })));
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get task detail
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const task = await dbGet(`
      SELECT t.*, d.name as department_name, g.name as group_name, p.name as product_name
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN groups g ON t.group_id = g.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `, [id]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      additionalInfo: task.additional_info,
      departmentId: task.department_id,
      departmentName: task.department_name,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status,
      progressPercentage: task.progress_percentage,
      createdBy: task.created_by,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    });
  } catch (error: any) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task (Admin for production, Operator for maintenance, Leader for their department)
router.post('/', authenticate, requireRole(['admin', 'operator', 'leader']), async (req: AuthRequest, res) => {
  try {
    const { title, description, additionalInfo, departmentId, groupId, priority, deadline, taskType, productId, assignedTo, departmentType } = req.body;
    const userRole = req.user!.role;

    if (!title || !priority || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Leaders can only create tasks for their department
    if (userRole === 'leader') {
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [req.user!.id]);
      if (!userData || !userData.department_id) {
        return res.status(403).json({ error: 'Leaders must be assigned to a department to create tasks' });
      }
      // Force department to be the leader's department
      const finalDepartmentId = userData.department_id;
      if (departmentId && departmentId !== finalDepartmentId) {
        return res.status(403).json({ error: 'Leaders can only create tasks for their own department' });
      }
    }

    // Determine task type based on role or explicit parameter
    const finalTaskType = taskType || (userRole === 'operator' ? 'maintenance' : 'production');

    // Production tasks require product and group
    if (finalTaskType === 'production') {
      if (!productId || !groupId) {
        return res.status(400).json({ error: 'Production tasks require product and group' });
      }
      if (userRole !== 'admin' && userRole !== 'leader') {
        return res.status(403).json({ error: 'Only admins and leaders can create production tasks' });
      }
    }

    // Maintenance tasks require group
    if (finalTaskType === 'maintenance') {
      if (!groupId) {
        return res.status(400).json({ error: 'Maintenance tasks require group' });
      }
    }

    // For leaders, use their department
    const finalDepartmentId = userRole === 'leader' 
      ? (await dbGet('SELECT department_id FROM users WHERE id = ?', [req.user!.id])).department_id
      : departmentId;

    // Validate department type if provided
    const finalDepartmentType = departmentType && ['production', 'maintenance', 'quality'].includes(departmentType) 
      ? departmentType 
      : (finalTaskType === 'production' ? 'production' : finalTaskType === 'maintenance' ? 'maintenance' : null);

    const id = uuidv4();
    await dbRun(
      `INSERT INTO tasks (id, title, description, additional_info, department_id, department_type, group_id, priority, deadline, task_type, product_id, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description || null, additionalInfo || null, finalDepartmentId || null, finalDepartmentType, groupId, priority, deadline, finalTaskType, productId || null, assignedTo || null, req.user!.id]
    );

    const task = await dbGet(`
      SELECT t.*, d.name as department_name, g.name as group_name, p.name as product_name
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN groups g ON t.group_id = g.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `, [id]);

    // Update analytics after task creation
    calculateAnalytics().catch(err => console.error('Analytics update error:', err));

    res.status(201).json({
      id: task.id,
      title: task.title,
      description: task.description,
      additionalInfo: task.additional_info,
      departmentId: task.department_id,
      departmentName: task.department_name,
      departmentType: task.department_type,
      groupId: task.group_id,
      groupName: task.group_name,
      productId: task.product_id,
      productName: task.product_name,
      taskType: task.task_type,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status,
      progressPercentage: task.progress_percentage,
      assignedTo: task.assigned_to,
      createdBy: task.created_by,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      startedAt: task.started_at,
      completedAt: task.completed_at,
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task (Admin for production, Operator for maintenance)
router.put('/:id', authenticate, requireRole(['admin', 'operator']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, additionalInfo, departmentId, groupId, priority, deadline, status, productId, assignedTo, taskType, departmentType } = req.body;
    const userRole = req.user!.role;

    // Get current task
    const currentTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!currentTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    if (currentTask.task_type === 'production' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update production tasks' });
    }

    const finalStatus = status !== undefined ? status : (currentTask?.status || 'pending');
    const finalDepartmentType = departmentType && ['production', 'maintenance', 'quality'].includes(departmentType) 
      ? departmentType 
      : (departmentType === null ? null : currentTask?.department_type);

    await dbRun(
      `UPDATE tasks 
       SET title = ?, description = ?, additional_info = ?, department_id = ?, department_type = ?, group_id = ?,
           priority = ?, deadline = ?, status = ?, product_id = ?, assigned_to = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description || null, additionalInfo || null, departmentId || null, finalDepartmentType, groupId || null, 
       priority, deadline, finalStatus, productId || null, assignedTo || null, id]
    );

    const task = await dbGet(`
      SELECT t.*, d.name as department_name, g.name as group_name, p.name as product_name
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN groups g ON t.group_id = g.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `, [id]);

    // Update analytics after task update
    calculateAnalytics().catch(err => console.error('Analytics update error:', err));

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      additionalInfo: task.additional_info,
      departmentId: task.department_id,
      departmentName: task.department_name,
      departmentType: task.department_type,
      groupId: task.group_id,
      groupName: task.group_name,
      productId: task.product_id,
      productName: task.product_name,
      taskType: task.task_type,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status,
      progressPercentage: task.progress_percentage,
      assignedTo: task.assigned_to,
      createdBy: task.created_by,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      startedAt: task.started_at,
      completedAt: task.completed_at,
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task progress (Worker)
router.put('/:id/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { progressPercentage, updateText } = req.body;

    if (progressPercentage === undefined) {
      return res.status(400).json({ error: 'Progress percentage required' });
    }

    // Update task progress with automatic started_at and completed_at tracking
    await dbRun(
      `UPDATE tasks 
       SET progress_percentage = ?, 
           started_at = CASE WHEN ? > 0 AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
           completed_at = CASE WHEN ? = 100 AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [progressPercentage, progressPercentage, progressPercentage, id]
    );

    // Add task update if text provided
    if (updateText) {
      const updateId = uuidv4();
      await dbRun(
        'INSERT INTO task_updates (id, task_id, user_id, progress_percentage, update_text) VALUES (?, ?, ?, ?, ?)',
        [updateId, id, req.user!.id, progressPercentage, updateText]
      );
    }

    // Update analytics after progress update
    calculateAnalytics().catch(err => console.error('Analytics update error:', err));

    const task = await dbGet(`
      SELECT t.*, d.name as department_name, g.name as group_name, p.name as product_name
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN groups g ON t.group_id = g.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `, [id]);

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      additionalInfo: task.additional_info,
      departmentId: task.department_id,
      departmentName: task.department_name,
      departmentType: task.department_type,
      groupId: task.group_id,
      groupName: task.group_name,
      productId: task.product_id,
      productName: task.product_name,
      taskType: task.task_type,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status,
      progressPercentage: task.progress_percentage,
      assignedTo: task.assigned_to,
      createdBy: task.created_by,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      startedAt: task.started_at,
      completedAt: task.completed_at,
    });
  } catch (error: any) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Delete task (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;

