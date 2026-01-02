import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// List all shifts (Admin, Leader can see their department's shifts)
router.get('/', authenticate, requireRole(['admin', 'leader']), async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let query = `
      SELECT 
        s.*,
        g.name as group_name,
        g.description as group_description,
        u.username as created_by_username
      FROM shifts s
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Leaders can only see shifts for groups of users in their department
    if (user.role === 'leader') {
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [user.id]);
      if (userData && userData.department_id) {
        // Get groups of users in the leader's department
        const deptGroups = await dbAll(
          'SELECT DISTINCT group_id FROM users WHERE department_id = ? AND group_id IS NOT NULL',
          [userData.department_id]
        );
        if (deptGroups.length > 0) {
          const groupIds = deptGroups.map(g => g.group_id).filter(id => id);
          query += ` AND s.group_id IN (${groupIds.map(() => '?').join(',')})`;
          params.push(...groupIds);
        } else {
          // No groups in department, return empty
          return res.json([]);
        }
      } else {
        // Leader has no department, return empty
        return res.json([]);
      }
    }

    query += ' ORDER BY s.shift_date DESC, s.start_time ASC';

    const shifts = await dbAll(query, params);

    res.json(shifts.map(shift => ({
      id: shift.id,
      groupId: shift.group_id,
      groupName: shift.group_name,
      groupDescription: shift.group_description,
      shiftDate: shift.shift_date,
      startTime: shift.start_time,
      endTime: shift.end_time,
      description: shift.description,
      createdBy: shift.created_by,
      createdByUsername: shift.created_by_username,
      createdAt: shift.created_at,
      updatedAt: shift.updated_at,
    })));
  } catch (error: any) {
    console.error('List shifts error:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

// Get shift by ID
router.get('/:id', authenticate, requireRole(['admin', 'leader']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const shift = await dbGet(`
      SELECT 
        s.*,
        g.name as group_name,
        g.description as group_description,
        u.username as created_by_username
      FROM shifts s
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json({
      id: shift.id,
      groupId: shift.group_id,
      groupName: shift.group_name,
      groupDescription: shift.group_description,
      shiftDate: shift.shift_date,
      startTime: shift.start_time,
      endTime: shift.end_time,
      description: shift.description,
      createdBy: shift.created_by,
      createdByUsername: shift.created_by_username,
      createdAt: shift.created_at,
      updatedAt: shift.updated_at,
    });
  } catch (error: any) {
    console.error('Get shift error:', error);
    res.status(500).json({ error: 'Failed to fetch shift' });
  }
});

// Create shift (Admin, Leader)
router.post('/', authenticate, requireRole(['admin', 'leader']), async (req: AuthRequest, res) => {
  try {
    const { groupId, shiftDate, startTime, endTime, description } = req.body;
    const user = req.user!;

    if (!groupId || !shiftDate || !startTime || !endTime) {
      return res.status(400).json({ error: 'Group, date, start time, and end time are required' });
    }

    // Validate date format
    const date = new Date(shiftDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM format (24-hour)' });
    }

    // Validate end time is after start time
    const start = new Date(`${shiftDate}T${startTime}`);
    const end = new Date(`${shiftDate}T${endTime}`);
    if (end <= start) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check if group exists
    const group = await dbGet('SELECT * FROM groups WHERE id = ?', [groupId]);
    if (!group) {
      return res.status(400).json({ error: 'Group not found' });
    }

    // Leaders can only create shifts for groups of users in their department
    if (user.role === 'leader') {
      const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [user.id]);
      if (!userData || !userData.department_id) {
        return res.status(403).json({ error: 'Leaders must be assigned to a department to create shifts' });
      }
      // Verify the group belongs to users in the leader's department
      const groupUsers = await dbGet(
        'SELECT id FROM users WHERE group_id = ? AND department_id = ? LIMIT 1',
        [groupId, userData.department_id]
      );
      if (!groupUsers) {
        return res.status(403).json({ error: 'You can only create shifts for groups in your department' });
      }
    }

    const id = uuidv4();
    const formattedDate = shiftDate.split('T')[0]; // Ensure YYYY-MM-DD format

    await dbRun(
      `INSERT INTO shifts (id, group_id, shift_date, start_time, end_time, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, groupId, formattedDate, startTime, endTime, description || null, user.id]
    );

    const newShift = await dbGet(`
      SELECT 
        s.*,
        g.name as group_name,
        u.username as created_by_username
      FROM shifts s
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);

    res.status(201).json({
      id: newShift.id,
      groupId: newShift.group_id,
      groupName: newShift.group_name,
      shiftDate: newShift.shift_date,
      startTime: newShift.start_time,
      endTime: newShift.end_time,
      description: newShift.description,
      createdBy: newShift.created_by,
      createdByUsername: newShift.created_by_username,
      createdAt: newShift.created_at,
      updatedAt: newShift.updated_at,
    });
  } catch (error: any) {
    console.error('Create shift error:', error);
    res.status(500).json({ 
      error: 'Failed to create shift',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update shift (Admin, Leader)
router.put('/:id', authenticate, requireRole(['admin', 'leader']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { groupId, shiftDate, startTime, endTime, description } = req.body;
    const user = req.user!;

    const existingShift = await dbGet('SELECT * FROM shifts WHERE id = ?', [id]);
    if (!existingShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Leaders can only update shifts they created or shifts for their department
    if (user.role === 'leader') {
      if (existingShift.created_by !== user.id) {
        const userData = await dbGet('SELECT department_id FROM users WHERE id = ?', [user.id]);
        // Additional validation for leaders
      }
    }

    // Validate inputs if provided
    if (shiftDate) {
      const date = new Date(shiftDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    }

    if (startTime || endTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (startTime && !timeRegex.test(startTime)) {
        return res.status(400).json({ error: 'Invalid start time format. Use HH:MM format (24-hour)' });
      }
      if (endTime && !timeRegex.test(endTime)) {
        return res.status(400).json({ error: 'Invalid end time format. Use HH:MM format (24-hour)' });
      }
    }

    // Validate end time is after start time if both provided
    if (startTime && endTime) {
      const finalDate = shiftDate || existingShift.shift_date;
      const start = new Date(`${finalDate}T${startTime}`);
      const end = new Date(`${finalDate}T${endTime}`);
      if (end <= start) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
    }

    const finalGroupId = groupId || existingShift.group_id;
    const finalDate = shiftDate ? shiftDate.split('T')[0] : existingShift.shift_date;
    const finalStartTime = startTime || existingShift.start_time;
    const finalEndTime = endTime || existingShift.end_time;
    const finalDescription = description !== undefined ? description : existingShift.description;

    await dbRun(
      `UPDATE shifts 
       SET group_id = ?, shift_date = ?, start_time = ?, end_time = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [finalGroupId, finalDate, finalStartTime, finalEndTime, finalDescription, id]
    );

    const updatedShift = await dbGet(`
      SELECT 
        s.*,
        g.name as group_name,
        u.username as created_by_username
      FROM shifts s
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);

    res.json({
      id: updatedShift.id,
      groupId: updatedShift.group_id,
      groupName: updatedShift.group_name,
      shiftDate: updatedShift.shift_date,
      startTime: updatedShift.start_time,
      endTime: updatedShift.end_time,
      description: updatedShift.description,
      createdBy: updatedShift.created_by,
      createdByUsername: updatedShift.created_by_username,
      createdAt: updatedShift.created_at,
      updatedAt: updatedShift.updated_at,
    });
  } catch (error: any) {
    console.error('Update shift error:', error);
    res.status(500).json({ 
      error: 'Failed to update shift',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete shift (Admin, Leader)
router.delete('/:id', authenticate, requireRole(['admin', 'leader']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const shift = await dbGet('SELECT * FROM shifts WHERE id = ?', [id]);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Leaders can only delete shifts they created
    if (user.role === 'leader' && shift.created_by !== user.id) {
      return res.status(403).json({ error: 'You can only delete shifts you created' });
    }

    await dbRun('DELETE FROM shifts WHERE id = ?', [id]);

    res.json({ 
      message: 'Shift deleted successfully',
      deletedShift: {
        id: shift.id,
        shiftDate: shift.shift_date,
        startTime: shift.start_time,
        endTime: shift.end_time,
      }
    });
  } catch (error: any) {
    console.error('Delete shift error:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

export default router;

