import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all role permissions (Admin only)
router.get('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const permissions = await dbAll('SELECT * FROM role_permissions ORDER BY role');
    res.json(permissions);
  } catch (error: any) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

// Get permissions for a specific role (Admin only)
router.get('/:role', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { role } = req.params;
    const permissions = await dbGet('SELECT * FROM role_permissions WHERE role = ?', [role]);
    
    if (!permissions) {
      return res.status(404).json({ error: 'Role permissions not found' });
    }
    
    res.json(permissions);
  } catch (error: any) {
    console.error('Get role permission error:', error);
    res.status(500).json({ error: 'Failed to fetch role permission' });
  }
});

// Create new role (Admin only)
router.post('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const {
      role,
      role_display_name,
      can_view_users,
      can_edit_users,
      can_view_groups,
      can_edit_groups,
      can_view_products,
      can_edit_products,
      can_view_reports,
      can_edit_reports,
      can_view_tasks,
      can_edit_tasks,
      can_view_analytics,
      max_data_reach,
    } = req.body;

    if (!role || typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const trimmedRole = role.trim().toLowerCase();
    
    // Validate role name format (alphanumeric and underscores only)
    if (!/^[a-z0-9_]+$/.test(trimmedRole)) {
      return res.status(400).json({ error: 'Role name can only contain lowercase letters, numbers, and underscores' });
    }

    // Check if role already exists
    const existing = await dbGet('SELECT id FROM role_permissions WHERE role = ?', [trimmedRole]);
    if (existing) {
      return res.status(400).json({ error: 'Role already exists' });
    }

    // Validate max_data_reach
    const validReaches = ['own', 'group', 'all'];
    const dataReach = max_data_reach || 'own';
    if (!validReaches.includes(dataReach)) {
      return res.status(400).json({ error: 'Invalid max_data_reach. Must be: own, group, or all' });
    }

    const id = uuidv4();
    await dbRun(
      `INSERT INTO role_permissions (
        id, role, role_display_name, can_view_users, can_edit_users,
        can_view_groups, can_edit_groups, can_view_products, can_edit_products,
        can_view_reports, can_edit_reports, can_view_tasks, can_edit_tasks,
        can_view_analytics, max_data_reach
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        trimmedRole,
        role_display_name || trimmedRole,
        can_view_users ? 1 : 0,
        can_edit_users ? 1 : 0,
        can_view_groups ? 1 : 0,
        can_edit_groups ? 1 : 0,
        can_view_products ? 1 : 0,
        can_edit_products ? 1 : 0,
        can_view_reports ? 1 : 0,
        can_edit_reports ? 1 : 0,
        can_view_tasks ? 1 : 0,
        can_edit_tasks ? 1 : 0,
        can_view_analytics ? 1 : 0,
        dataReach,
      ]
    );

    const newRole = await dbGet('SELECT * FROM role_permissions WHERE id = ?', [id]);
    res.status(201).json(newRole);
  } catch (error: any) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Update role permissions (Admin only)
router.put('/:role', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { role } = req.params;
    const {
      role_display_name,
      new_role_name,
      can_view_users,
      can_edit_users,
      can_view_groups,
      can_edit_groups,
      can_view_products,
      can_edit_products,
      can_view_reports,
      can_edit_reports,
      can_view_tasks,
      can_edit_tasks,
      can_view_analytics,
      max_data_reach,
    } = req.body;

    // Validate max_data_reach
    const validReaches = ['own', 'department', 'group', 'all'];
    if (max_data_reach && !validReaches.includes(max_data_reach)) {
      return res.status(400).json({ error: 'Invalid max_data_reach. Must be: own, department, group, or all' });
    }

    // Check if permissions exist
    const existing = await dbGet('SELECT * FROM role_permissions WHERE role = ?', [role]);
    
    if (!existing) {
      return res.status(404).json({ error: 'Role permissions not found' });
    }

    // If new_role_name is provided, validate and update role name
    let finalRole = role;
    if (new_role_name && new_role_name.trim() !== role) {
      const trimmedNewRole = new_role_name.trim().toLowerCase();
      
      // Validate role name format
      if (!/^[a-z0-9_]+$/.test(trimmedNewRole)) {
        return res.status(400).json({ error: 'Role name can only contain lowercase letters, numbers, and underscores' });
      }

      // Check if new role name already exists
      const roleExists = await dbGet('SELECT id FROM role_permissions WHERE role = ?', [trimmedNewRole]);
      if (roleExists) {
        return res.status(400).json({ error: 'Role name already exists' });
      }

      finalRole = trimmedNewRole;
    }

    // Update permissions and role name if changed
    await dbRun(
      `UPDATE role_permissions SET
        role = ?,
        role_display_name = ?,
        can_view_users = ?,
        can_edit_users = ?,
        can_view_groups = ?,
        can_edit_groups = ?,
        can_view_products = ?,
        can_edit_products = ?,
        can_view_reports = ?,
        can_edit_reports = ?,
        can_view_tasks = ?,
        can_edit_tasks = ?,
        can_view_analytics = ?,
        max_data_reach = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE role = ?`,
      [
        finalRole,
        role_display_name !== undefined ? role_display_name : existing.role_display_name || existing.role,
        can_view_users !== undefined ? (can_view_users ? 1 : 0) : existing.can_view_users,
        can_edit_users !== undefined ? (can_edit_users ? 1 : 0) : existing.can_edit_users,
        can_view_groups !== undefined ? (can_view_groups ? 1 : 0) : existing.can_view_groups,
        can_edit_groups !== undefined ? (can_edit_groups ? 1 : 0) : existing.can_edit_groups,
        can_view_products !== undefined ? (can_view_products ? 1 : 0) : existing.can_view_products,
        can_edit_products !== undefined ? (can_edit_products ? 1 : 0) : existing.can_edit_products,
        can_view_reports !== undefined ? (can_view_reports ? 1 : 0) : existing.can_view_reports,
        can_edit_reports !== undefined ? (can_edit_reports ? 1 : 0) : existing.can_edit_reports,
        can_view_tasks !== undefined ? (can_view_tasks ? 1 : 0) : existing.can_view_tasks,
        can_edit_tasks !== undefined ? (can_edit_tasks ? 1 : 0) : existing.can_edit_tasks,
        can_view_analytics !== undefined ? (can_view_analytics ? 1 : 0) : existing.can_view_analytics,
        max_data_reach || existing.max_data_reach,
        role,
      ]
    );

    // If role name changed, update users table
    if (finalRole !== role) {
      await dbRun('UPDATE users SET role = ? WHERE role = ?', [finalRole, role]);
    }

    const updated = await dbGet('SELECT * FROM role_permissions WHERE role = ?', [finalRole]);
    res.json(updated);
  } catch (error: any) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

// Delete role (Admin only)
router.delete('/:role', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { role } = req.params;

    // Prevent deleting admin role
    if (role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin role' });
    }

    // Check if role exists
    const existing = await dbGet('SELECT id FROM role_permissions WHERE role = ?', [role]);
    if (!existing) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Check if any users have this role
    const usersWithRole = await dbGet('SELECT id FROM users WHERE role = ? LIMIT 1', [role]);
    if (usersWithRole) {
      return res.status(400).json({ error: 'Cannot delete role: Users are assigned to this role' });
    }

    await dbRun('DELETE FROM role_permissions WHERE role = ?', [role]);
    res.json({ message: 'Role deleted successfully' });
  } catch (error: any) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

export default router;

