import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// List all groups (Admin only)
router.get('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const groups = await dbAll(
      'SELECT * FROM groups ORDER BY created_at DESC'
    );
    res.json(groups);
  } catch (error: any) {
    console.error('List groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const group = await dbGet('SELECT * FROM groups WHERE id = ?', [id]);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (error: any) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Create group (Admin only)
router.post('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    console.log('=== CREATE GROUP REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    const { name, description, startTime, endTime } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      console.error('Validation failed: name is missing or invalid');
      return res.status(400).json({ error: 'Group name is required' });
    }

    const trimmedName = name.trim();

    // Check if group name already exists
    console.log('Checking for existing group with name:', trimmedName);
    const existingGroup = await dbGet('SELECT * FROM groups WHERE LOWER(name) = LOWER(?)', [trimmedName]);
    if (existingGroup) {
      console.error('Validation failed: group already exists');
      return res.status(400).json({ error: 'Group name already exists' });
    }

    // Validate time format if provided
    if (startTime || endTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (startTime && !timeRegex.test(startTime)) {
        return res.status(400).json({ error: 'Invalid start time format. Use HH:MM format (24-hour)' });
      }
      if (endTime && !timeRegex.test(endTime)) {
        return res.status(400).json({ error: 'Invalid end time format. Use HH:MM format (24-hour)' });
      }
      // Allow overnight shifts (end time can be earlier than start time, e.g., 16:00 to 00:00)
      // Only validate that times are not exactly the same
      if (startTime && endTime && startTime === endTime) {
        return res.status(400).json({ error: 'Start time and end time cannot be the same' });
      }
    }

    const groupId = uuidv4();
    const trimmedDescription = description && typeof description === 'string' ? description.trim() : null;
    
    console.log('Inserting group:', { id: groupId, name: trimmedName, description: trimmedDescription, startTime, endTime });
    await dbRun(
      'INSERT INTO groups (id, name, description, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
      [groupId, trimmedName, trimmedDescription, startTime || null, endTime || null]
    );

    console.log('Group inserted successfully, fetching created group...');
    const newGroup = await dbGet('SELECT * FROM groups WHERE id = ?', [groupId]);
    
    if (!newGroup) {
      console.error('Error: Group was inserted but could not be retrieved');
      return res.status(500).json({ error: 'Group created but could not be retrieved' });
    }
    
    console.log('Group created successfully:', newGroup);
    res.status(201).json(newGroup);
  } catch (error: any) {
    console.error('=== CREATE GROUP ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    
    let errorMessage = 'Failed to create group';
    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('UNIQUE')) {
        errorMessage = 'Group name already exists';
      } else if (error.message.includes('NOT NULL')) {
        errorMessage = 'Required field is missing';
      } else {
        errorMessage = 'Database constraint violation: ' + error.message;
      }
    } else if (error.code === 'SQLITE_ERROR') {
      errorMessage = 'Database error: ' + error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update group (Admin only)
router.put('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, startTime, endTime } = req.body;

    const existingGroup = await dbGet('SELECT * FROM groups WHERE id = ?', [id]);
    if (!existingGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (name && name !== existingGroup.name) {
      const nameExists = await dbGet('SELECT * FROM groups WHERE name = ? AND id != ?', [name, id]);
      if (nameExists) {
        return res.status(400).json({ error: 'Group name already exists' });
      }
    }

    // Validate time format if provided
    if (startTime || endTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (startTime && !timeRegex.test(startTime)) {
        return res.status(400).json({ error: 'Invalid start time format. Use HH:MM format (24-hour)' });
      }
      if (endTime && !timeRegex.test(endTime)) {
        return res.status(400).json({ error: 'Invalid end time format. Use HH:MM format (24-hour)' });
      }
      // Allow overnight shifts (end time can be earlier than start time, e.g., 16:00 to 00:00)
      // Only validate that times are not exactly the same
      const finalStartTime = startTime !== undefined ? startTime : existingGroup.start_time;
      const finalEndTime = endTime !== undefined ? endTime : existingGroup.end_time;
      if (finalStartTime && finalEndTime && finalStartTime === finalEndTime) {
        return res.status(400).json({ error: 'Start time and end time cannot be the same' });
      }
    }

    await dbRun(
      'UPDATE groups SET name = ?, description = ?, start_time = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        name || existingGroup.name,
        description !== undefined ? description : existingGroup.description,
        startTime !== undefined ? startTime : existingGroup.start_time,
        endTime !== undefined ? endTime : existingGroup.end_time,
        id
      ]
    );

    const updatedGroup = await dbGet('SELECT * FROM groups WHERE id = ?', [id]);
    res.json(updatedGroup);
  } catch (error: any) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete group (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const group = await dbGet('SELECT * FROM groups WHERE id = ?', [id]);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if group is in use
    const tasksUsingGroup = await dbGet('SELECT id FROM tasks WHERE group_id = ? LIMIT 1', [id]);
    if (tasksUsingGroup) {
      return res.status(400).json({ error: 'Cannot delete group: It is assigned to tasks' });
    }

    await dbRun('DELETE FROM groups WHERE id = ?', [id]);
    res.json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

export default router;

