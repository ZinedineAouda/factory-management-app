import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { calculateAnalytics } from '../services/analyticsService';

const router = express.Router();

// Create maintenance task (Leader of Maintenance department only)
router.post('/', authenticate, requireRole(['leader', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { title, description, additionalInfo, priority, deadline, assignedTo } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!title || !priority || !deadline) {
      return res.status(400).json({ error: 'Title, priority, and deadline are required' });
    }

    let departmentId;
    if (userRole === 'leader') {
      // Leaders can only create tasks for their department
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [userId]);
      if (!userData || !userData.department_id) {
        return res.status(403).json({ error: 'Leaders must be assigned to a department to create tasks' });
      }
      
      // Verify it's maintenance department
      const department = await dbGet('SELECT id, name FROM departments WHERE id = ?', [userData.department_id]);
      if (!department || department.name.toLowerCase() !== 'maintenance') {
        return res.status(403).json({ error: 'Leaders can only create tasks for Maintenance department' });
      }
      
      departmentId = userData.department_id;
    } else {
      // Admin can specify department, but must be maintenance
      const { departmentId: deptId } = req.body;
      if (!deptId) {
        return res.status(400).json({ error: 'Department ID is required for admin' });
      }
      const department = await dbGet('SELECT id, name FROM departments WHERE id = ?', [deptId]);
      if (!department || department.name.toLowerCase() !== 'maintenance') {
        return res.status(400).json({ error: 'Department must be Maintenance' });
      }
      departmentId = deptId;
    }

    // Verify assigned worker is in maintenance department if provided
    if (assignedTo) {
      const assignedUser = await dbGet(
        `SELECT u.id, u.department_id, d.name as department_name 
         FROM users u 
         LEFT JOIN departments d ON u.department_id = d.id 
         WHERE u.id = ?`,
        [assignedTo]
      );
      if (!assignedUser || assignedUser.department_name?.toLowerCase() !== 'maintenance') {
        return res.status(400).json({ error: 'Assigned worker must be in Maintenance department' });
      }
    }

    const taskId = uuidv4();
    await dbRun(
      `INSERT INTO tasks (id, title, description, additional_info, department_id, department_type, priority, deadline, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [taskId, title, description || null, additionalInfo || null, departmentId, 'maintenance', priority, deadline, assignedTo || null, userId]
    );

    const task = await dbGet(
      `SELECT t.*, d.name as department_name, 
       u1.username as created_by_username,
       u2.username as assigned_to_username
       FROM tasks t
       LEFT JOIN departments d ON t.department_id = d.id
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       WHERE t.id = ?`,
      [taskId]
    );

    // Update analytics
    calculateAnalytics().catch(err => console.error('Analytics update error:', err));

    res.status(201).json({
      id: task.id,
      title: task.title,
      description: task.description,
      additionalInfo: task.additional_info,
      departmentId: task.department_id,
      departmentName: task.department_name,
      departmentType: task.department_type,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status,
      progressPercentage: task.progress_percentage,
      assignedTo: task.assigned_to,
      assignedToUsername: task.assigned_to_username,
      createdBy: task.created_by,
      createdByUsername: task.created_by_username,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    });
  } catch (error: any) {
    console.error('Create maintenance task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get maintenance tasks (Leaders see all for their dept, Workers see assigned/all for their dept)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let tasks;
    if (userRole === 'admin') {
      // Admin sees all maintenance tasks
      tasks = await dbAll(
        `SELECT t.*, d.name as department_name,
         u1.username as created_by_username,
         u2.username as assigned_to_username
         FROM tasks t
         LEFT JOIN departments d ON t.department_id = d.id
         LEFT JOIN users u1 ON t.created_by = u1.id
         LEFT JOIN users u2 ON t.assigned_to = u2.id
         WHERE t.department_type = 'maintenance'
         ORDER BY t.created_at DESC`
      );
    } else if (userRole === 'leader') {
      // Leaders see tasks for their department
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [userId]);
      if (!userData || !userData.department_id) {
        return res.json([]);
      }
      tasks = await dbAll(
        `SELECT t.*, d.name as department_name,
         u1.username as created_by_username,
         u2.username as assigned_to_username
         FROM tasks t
         LEFT JOIN departments d ON t.department_id = d.id
         LEFT JOIN users u1 ON t.created_by = u1.id
         LEFT JOIN users u2 ON t.assigned_to = u2.id
         WHERE t.department_id = ? AND t.department_type = 'maintenance'
         ORDER BY t.created_at DESC`,
        [userData.department_id]
      );
    } else if (userRole === 'worker') {
      // Workers see tasks assigned to them or all tasks in their department
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [userId]);
      if (!userData || !userData.department_id) {
        return res.json([]);
      }
      tasks = await dbAll(
        `SELECT t.*, d.name as department_name,
         u1.username as created_by_username,
         u2.username as assigned_to_username
         FROM tasks t
         LEFT JOIN departments d ON t.department_id = d.id
         LEFT JOIN users u1 ON t.created_by = u1.id
         LEFT JOIN users u2 ON t.assigned_to = u2.id
         WHERE t.department_id = ? AND t.department_type = 'maintenance'
         AND (t.assigned_to = ? OR t.assigned_to IS NULL)
         ORDER BY t.created_at DESC`,
        [userData.department_id, userId]
      );
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      additionalInfo: task.additional_info,
      departmentId: task.department_id,
      departmentName: task.department_name,
      departmentType: task.department_type,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status,
      progressPercentage: task.progress_percentage,
      assignedTo: task.assigned_to,
      assignedToUsername: task.assigned_to_username,
      createdBy: task.created_by,
      createdByUsername: task.created_by_username,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    })));
  } catch (error: any) {
    console.error('Get maintenance tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const task = await dbGet(
      `SELECT t.*, d.name as department_name,
       u1.username as created_by_username,
       u2.username as assigned_to_username
       FROM tasks t
       LEFT JOIN departments d ON t.department_id = d.id
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       WHERE t.id = ? AND t.department_type = 'maintenance'`,
      [id]
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    if (userRole === 'worker') {
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [userId]);
      if (task.department_id !== userData?.department_id || (task.assigned_to && task.assigned_to !== userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (userRole === 'leader') {
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [userId]);
      if (task.department_id !== userData?.department_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get task updates
    const updates = await dbAll(
      `SELECT tu.*, u.username as worker_username
       FROM task_updates tu
       JOIN users u ON tu.worker_id = u.id
       WHERE tu.task_id = ?
       ORDER BY tu.created_at DESC`,
      [id]
    );

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      additionalInfo: task.additional_info,
      departmentId: task.department_id,
      departmentName: task.department_name,
      departmentType: task.department_type,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status,
      progressPercentage: task.progress_percentage,
      assignedTo: task.assigned_to,
      assignedToUsername: task.assigned_to_username,
      createdBy: task.created_by,
      createdByUsername: task.created_by_username,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      updates: updates.map(update => ({
        id: update.id,
        taskId: update.task_id,
        workerId: update.worker_id,
        workerUsername: update.worker_username,
        updateText: update.update_text,
        progressPercentage: update.progress_percentage,
        createdAt: update.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Update task progress and add update/comment (Worker only)
router.put('/:id/progress', authenticate, requireRole(['worker']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { progressPercentage, updateText } = req.body;
    const workerId = req.user!.id;

    if (progressPercentage === undefined && !updateText) {
      return res.status(400).json({ error: 'Progress percentage or update text is required' });
    }

    // Get task
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify worker is in maintenance department and has access
    const userData = await dbGet(
      `SELECT u.department_id, d.name as department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = ?`,
      [workerId]
    );

    if (!userData || userData.department_name?.toLowerCase() !== 'maintenance') {
      return res.status(403).json({ error: 'Only workers in Maintenance department can update tasks' });
    }

    if (task.department_id !== userData.department_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.assigned_to && task.assigned_to !== workerId) {
      return res.status(403).json({ error: 'This task is assigned to another worker' });
    }

    // Update task progress if provided
    if (progressPercentage !== undefined) {
      const finalProgress = Math.max(0, Math.min(100, parseInt(progressPercentage)));
      await dbRun(
        'UPDATE tasks SET progress_percentage = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [finalProgress, finalProgress === 100 ? 'completed' : finalProgress > 0 ? 'in_progress' : 'pending', id]
      );
    }

    // Add update/comment if provided
    if (updateText && updateText.trim()) {
      const updateId = uuidv4();
      await dbRun(
        'INSERT INTO task_updates (id, task_id, worker_id, update_text, progress_percentage) VALUES (?, ?, ?, ?, ?)',
        [updateId, id, workerId, updateText.trim(), progressPercentage !== undefined ? progressPercentage : task.progress_percentage]
      );
    }

    // Update analytics
    calculateAnalytics().catch(err => console.error('Analytics update error:', err));

    // Get updated task with updates
    const updatedTask = await dbGet(
      `SELECT t.*, d.name as department_name,
       u1.username as created_by_username,
       u2.username as assigned_to_username
       FROM tasks t
       LEFT JOIN departments d ON t.department_id = d.id
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       WHERE t.id = ?`,
      [id]
    );

    const updates = await dbAll(
      `SELECT tu.*, u.username as worker_username
       FROM task_updates tu
       JOIN users u ON tu.worker_id = u.id
       WHERE tu.task_id = ?
       ORDER BY tu.created_at DESC`,
      [id]
    );

    res.json({
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      additionalInfo: updatedTask.additional_info,
      departmentId: updatedTask.department_id,
      departmentName: updatedTask.department_name,
      departmentType: updatedTask.department_type,
      priority: updatedTask.priority,
      deadline: updatedTask.deadline,
      status: updatedTask.status,
      progressPercentage: updatedTask.progress_percentage,
      assignedTo: updatedTask.assigned_to,
      assignedToUsername: updatedTask.assigned_to_username,
      createdBy: updatedTask.created_by,
      createdByUsername: updatedTask.created_by_username,
      createdAt: updatedTask.created_at,
      updatedAt: updatedTask.updated_at,
      updates: updates.map(update => ({
        id: update.id,
        taskId: update.task_id,
        workerId: update.worker_id,
        workerUsername: update.worker_username,
        updateText: update.update_text,
        progressPercentage: update.progress_percentage,
        createdAt: update.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Update task progress error:', error);
    res.status(500).json({ error: 'Failed to update task progress' });
  }
});

// Update task (Leader/Admin only)
router.put('/:id', authenticate, requireRole(['leader', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, additionalInfo, priority, deadline, assignedTo, status } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify access
    if (userRole === 'leader') {
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [userId]);
      if (task.department_id !== userData?.department_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Verify assigned worker if provided
    if (assignedTo) {
      const assignedUser = await dbGet(
        `SELECT u.id, u.department_id, d.name as department_name 
         FROM users u 
         LEFT JOIN departments d ON u.department_id = d.id 
         WHERE u.id = ?`,
        [assignedTo]
      );
      if (!assignedUser || assignedUser.department_name?.toLowerCase() !== 'maintenance') {
        return res.status(400).json({ error: 'Assigned worker must be in Maintenance department' });
      }
    }

    await dbRun(
      `UPDATE tasks 
       SET title = ?, description = ?, additional_info = ?, priority = ?, deadline = ?, 
           assigned_to = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title || task.title,
        description !== undefined ? description : task.description,
        additionalInfo !== undefined ? additionalInfo : task.additional_info,
        priority || task.priority,
        deadline || task.deadline,
        assignedTo !== undefined ? assignedTo : task.assigned_to,
        status !== undefined ? status : task.status,
        id
      ]
    );

    // Update analytics
    calculateAnalytics().catch(err => console.error('Analytics update error:', err));

    const updatedTask = await dbGet(
      `SELECT t.*, d.name as department_name,
       u1.username as created_by_username,
       u2.username as assigned_to_username
       FROM tasks t
       LEFT JOIN departments d ON t.department_id = d.id
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       WHERE t.id = ?`,
      [id]
    );

    res.json({
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      additionalInfo: updatedTask.additional_info,
      departmentId: updatedTask.department_id,
      departmentName: updatedTask.department_name,
      departmentType: updatedTask.department_type,
      priority: updatedTask.priority,
      deadline: updatedTask.deadline,
      status: updatedTask.status,
      progressPercentage: updatedTask.progress_percentage,
      assignedTo: updatedTask.assigned_to,
      assignedToUsername: updatedTask.assigned_to_username,
      createdBy: updatedTask.created_by,
      createdByUsername: updatedTask.created_by_username,
      createdAt: updatedTask.created_at,
      updatedAt: updatedTask.updated_at,
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

export default router;




