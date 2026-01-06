import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper function to get user with department and group info
const getUserWithDepartment = async (userId: string) => {
  return await dbGet(
    `SELECT u.id, u.email, u.username, u.role, u.department_id, u.group_id, u.status, u.created_at, u.is_active, 
            d.name as department_name, g.name as group_name
     FROM users u
     LEFT JOIN departments d ON u.department_id = d.id
     LEFT JOIN groups g ON u.group_id = g.id
     WHERE u.id = ?`,
    [userId]
  );
};

// Helper function to format user response
const formatUserResponse = (user: any) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  status: user.status,
  departmentId: user.department_id,
  departmentName: user.department_name,
  groupId: user.group_id,
  groupName: user.group_name,
  createdAt: user.created_at,
  isActive: user.is_active === 1,
});

// Helper function to clean up user-related data before deletion
const cleanupUserData = async (userId: string, adminId: string) => {
  try {
    // Delete task updates by this user
    await dbRun('DELETE FROM task_updates WHERE user_id = ?', [userId]);
    
    // Reassign tasks created by this user to admin, or delete if no admin exists
    const adminExists = await dbGet('SELECT id FROM users WHERE id = ?', [adminId]);
    if (adminExists) {
      await dbRun('UPDATE tasks SET created_by = ? WHERE created_by = ?', [adminId, userId]);
    } else {
      await dbRun('DELETE FROM tasks WHERE created_by = ?', [userId]);
    }
    
    // Update registration codes - set references to null
    await dbRun('UPDATE registration_codes SET used_by = NULL WHERE used_by = ?', [userId]);
    await dbRun('UPDATE registration_codes SET created_by = NULL WHERE created_by = ?', [userId]);
  } catch (error: any) {
    console.error('Error in cleanupUserData:', error);
    throw error;
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, registrationCode } = req.body;

    if (!username || !password || !registrationCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Trim and uppercase the registration code for case-insensitive matching
    const normalizedCode = registrationCode.trim().toUpperCase();

    // Validate registration code (case-insensitive)
    const code = await dbGet(
      'SELECT * FROM registration_codes WHERE UPPER(code) = ? AND is_used = 0',
      [normalizedCode]
    );

    if (!code) {
      console.log(`Registration code validation failed for code: ${normalizedCode}`);
      return res.status(400).json({ error: 'Invalid or already used registration code' });
    }

    // Check if code is expired
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Registration code has expired' });
    }

    // Only worker and operator can register (admin created manually)
    if (code.role === 'admin') {
      return res.status(400).json({ error: 'Admin accounts cannot be registered' });
    }

    // Check if username already exists (case-insensitive)
    const existingUser = await dbGet('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists (if email is provided)
    if (req.body.email) {
      const existingEmail = await dbGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [req.body.email]);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with status='pending' (requires admin approval)
    // In development mode, auto-approve users
    const initialStatus = process.env.NODE_ENV === 'development' && process.env.AUTO_APPROVE_USERS === 'true' 
      ? 'active' 
      : 'pending';
    
    const userId = uuidv4();
    await dbRun(
      `INSERT INTO users (id, username, password_hash, role, department_id, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, passwordHash, code.role, null, initialStatus]
    );

    // Mark code as used
    await dbRun(
      'UPDATE registration_codes SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId, code.id]
    );

    // Don't generate token - user must be approved first
    const user = await dbGet('SELECT id, username, role, department_id, status, created_at, is_active FROM users WHERE id = ?', [userId]);

    // Notify all admins about pending user approval (only if status is pending)
    if (initialStatus === 'pending') {
      try {
        const admins = await dbAll('SELECT id FROM users WHERE role = ? AND status = ?', ['admin', 'active']);
        for (const admin of admins) {
          const notificationId = uuidv4();
          await dbRun(
            'INSERT INTO notifications (id, user_id, type, title, message, related_id, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)',
            [
              notificationId,
              admin.id,
              'user_registered',
              'New User Registration',
              `User "${username}" (${code.role}) has registered and is pending approval.`,
              userId
            ]
          );
        }
        console.log(`✅ Notified ${admins.length} admin(s) about pending user: ${username}`);
      } catch (notifError: any) {
        console.error('Error creating admin notifications:', notifError);
        // Don't fail registration if notification fails
      }
    }

    res.json({
      message: initialStatus === 'active' 
        ? 'Registration successful. You can now log in.'
        : 'Registration successful. Your account is pending approval by an administrator.',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        departmentId: user.department_id,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login - supports both username and email for backward compatibility
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({ error: 'Username or email and password required' });
    }

    // Try username first, then email (backward compatibility)
    let user;
    if (username) {
      user = await dbGet(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [username]
      );
    } else if (email) {
      user = await dbGet(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email]
      );
    }

    if (!user) {
      return res.status(401).json({ 
        error: 'Account not found',
        errorCode: 'ACCOUNT_NOT_FOUND',
        message: 'The username or email you entered does not exist. Please check your credentials and try again.'
      });
    }

    // Check if user is approved (status must be 'active')
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        errorCode: 'ACCOUNT_PENDING',
        message: 'Your account is pending approval. Please wait for administrator approval.' 
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Incorrect password',
        errorCode: 'INVALID_PASSWORD',
        message: 'The password you entered is incorrect. Please try again or use the "Forgot password" option if available.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const expiresIn: string = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: expiresIn as any }
    );

    // Get user's group info
    const userWithGroup = await dbGet(
      `SELECT u.*, g.name as group_name 
       FROM users u 
       LEFT JOIN groups g ON u.group_id = g.id 
       WHERE u.id = ?`,
      [user.id]
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        departmentId: user.department_id,
        groupId: userWithGroup?.group_id || null,
        groupName: userWithGroup?.group_name || null,
        profilePhotoUrl: user.profile_photo_url,
        bio: user.bio,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        isActive: user.is_active,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.trim().length === 0) {
      return res.status(400).json({ available: false, message: 'Username is required' });
    }

    // Check if username already exists (case-insensitive)
    const existingUser = await dbGet('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()]);
    
    if (existingUser) {
      return res.json({ available: false, message: 'Username already taken' });
    }

    return res.json({ available: true, message: 'Username is available' });
  } catch (error: any) {
    console.error('Check username error:', error);
    res.status(500).json({ available: false, message: 'Error checking username availability' });
  }
});

// Validate registration code
router.get('/validate-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    // Trim and uppercase the code for case-insensitive matching
    const normalizedCode = code.trim().toUpperCase();
    const codeData = await dbGet(
      'SELECT * FROM registration_codes WHERE UPPER(code) = ? AND is_used = 0',
      [normalizedCode]
    );

    if (!codeData) {
      return res.status(404).json({ error: 'Invalid or used code' });
    }

    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code expired' });
    }

    res.json({
      valid: true,
      role: codeData.role,
      expiresAt: codeData.expires_at,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await dbGet(
      `SELECT u.id, u.username, u.email, u.role, u.department_id, u.group_id, u.status, 
              u.profile_photo_url, u.bio, u.created_at, u.updated_at, u.is_active, 
              d.name as department_name, g.name as group_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN groups g ON u.group_id = g.id
       WHERE u.id = ?`,
      [req.user!.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      departmentId: user.department_id,
      departmentName: user.department_name,
      groupId: user.group_id,
      groupName: user.group_name,
      profilePhotoUrl: user.profile_photo_url,
      bio: user.bio,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      isActive: user.is_active === 1,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Approve user by username (for convenience - development only)
router.post('/users/approve/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Allow approval without auth in development mode
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      return res.status(403).json({ error: 'This endpoint is only available in development mode' });
    }

    const user = await dbGet('SELECT id, username, status FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status === 'active') {
      return res.json({ 
        message: 'User is already approved',
        user: { id: user.id, username: user.username, status: user.status }
      });
    }

    await dbRun(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['active', user.id]
    );

    res.json({
      message: 'User approved successfully',
      user: {
        id: user.id,
        username: user.username,
        status: 'active',
      },
    });
  } catch (error: any) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Approve user (Admin only) - Phase 2
router.post('/users/:id/approve', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role, departmentId, groupId } = req.body;

    const user = await dbGet('SELECT id, username, status FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ error: 'User is already approved' });
    }

    // Validate role if provided
    if (role && !['worker', 'operator', 'leader', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Update user: approve and optionally assign role, department, and group
    const updates: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = ['active'];

    if (role) {
      updates.push('role = ?');
      values.push(role);
    }

    if (departmentId !== undefined) {
      updates.push('department_id = ?');
      values.push(departmentId || null);
    }

    if (groupId !== undefined) {
      updates.push('group_id = ?');
      values.push(groupId || null);
    }

    values.push(id);

    await dbRun(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Notify the approved user
    try {
      const notificationId = uuidv4();
      await dbRun(
        'INSERT INTO notifications (id, user_id, type, title, message, related_id, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)',
        [
          notificationId,
          id,
          'account_approved',
          'Account Approved',
          'Your account has been approved. You can now log in and access the system.',
          id
        ]
      );
    } catch (notifError: any) {
      console.error('Error creating approval notification:', notifError);
      // Don't fail approval if notification fails
    }

    res.json({
      message: 'User approved successfully',
      user: {
        id: user.id,
        username: user.username,
        status: 'active',
        role: role || user.role,
      },
    });
  } catch (error: any) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// List all users (Admin only) - Only returns approved users (status='active')
router.get('/users', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const users = await dbAll(
      `SELECT u.id, u.email, u.username, u.role, u.department_id, u.group_id, u.status, u.created_at, u.is_active, 
              d.name as department_name, g.name as group_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN groups g ON u.group_id = g.id
       WHERE u.status = 'active'
       ORDER BY u.created_at DESC`
    );

    res.json(users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      departmentId: user.department_id,
      departmentName: user.department_name,
      groupName: user.group_name,
      createdAt: user.created_at,
      isActive: user.is_active === 1,
    })));
  } catch (error: any) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Diagnostic endpoint to test authentication and authorization
router.get('/test-auth', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Authentication and authorization working!',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Get worker statistics (Admin only) - must come before /users/:id to avoid route conflicts
router.get('/users/:id/statistics', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get user's department
    const user = await dbGet('SELECT department_id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.department_id) {
      return res.json({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        cancelledTasks: 0,
        averageProgress: 0,
        completionRate: 0,
      });
    }

    // Get all tasks for the user's department
    const allTasks = await dbAll(
      'SELECT status, progress_percentage FROM tasks WHERE department_id = ?',
      [user.department_id]
    );

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const cancelledTasks = allTasks.filter(t => t.status === 'cancelled').length;

    // Calculate average progress
    const totalProgress = allTasks.reduce((sum, task) => sum + (task.progress_percentage || 0), 0);
    const averageProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      cancelledTasks,
      averageProgress,
      completionRate,
    });
  } catch (error: any) {
    console.error('Get worker statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch worker statistics' });
  }
});

// Update user department (Admin only)
router.put('/users/:id/department', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { departmentId } = req.body;

    // Validate user exists
    const existingUser = await dbGet('SELECT id, email FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Normalize department ID: empty string or undefined becomes null
    const normalizedDeptId = (departmentId === '' || departmentId === undefined || departmentId === null) ? null : departmentId;

    // Validate department exists if provided
    if (normalizedDeptId !== null && normalizedDeptId !== undefined) {
      const department = await dbGet('SELECT id, name FROM departments WHERE id = ?', [normalizedDeptId]);
      if (!department) {
        return res.status(400).json({ error: 'Department not found' });
      }
    }

    // Update user department - use transaction for atomicity
    try {
      await dbRun('BEGIN TRANSACTION');
      await dbRun('UPDATE users SET department_id = ? WHERE id = ?', [normalizedDeptId, id]);
      await dbRun('COMMIT');
    } catch (txError: any) {
      await dbRun('ROLLBACK').catch(() => {}); // Ignore rollback errors if transaction already failed
      throw txError;
    }

    // Fetch updated user with department info
    const updatedUser = await getUserWithDepartment(id);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found after update' });
    }

    res.json(formatUserResponse(updatedUser));
  } catch (error: any) {
    console.error('Update user department error:', error);
    res.status(500).json({
      error: 'Failed to update user department',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user role (Admin only)
router.put('/users/:id/role', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate user exists
    const existingUser = await dbGet('SELECT id, email FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate role
    const validRoles = ['admin', 'worker', 'operator', 'leader'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: admin, worker, operator, or leader' });
    }

    // Prevent changing own role
    if (id === req.user!.id && role !== req.user!.role) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    // Update user role
    try {
      await dbRun('BEGIN TRANSACTION');
      await dbRun('UPDATE users SET role = ? WHERE id = ?', [role, id]);
      await dbRun('COMMIT');
    } catch (txError: any) {
      await dbRun('ROLLBACK').catch(() => {});
      throw txError;
    }

    // Fetch updated user
    const updatedUser = await getUserWithDepartment(id);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found after update' });
    }

    res.json(formatUserResponse(updatedUser));
  } catch (error: any) {
    console.error('Update user role error:', error);
    res.status(500).json({
      error: 'Failed to update user role',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user group (Admin only)
router.put('/users/:id/group', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { groupId } = req.body;

    // Validate user exists
    const existingUser = await dbGet('SELECT id, email FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Normalize group ID: empty string or undefined becomes null
    const normalizedGroupId = (groupId === '' || groupId === undefined || groupId === null) ? null : groupId;

    // Validate group exists if provided
    if (normalizedGroupId !== null && normalizedGroupId !== undefined) {
      const group = await dbGet('SELECT id, name FROM groups WHERE id = ?', [normalizedGroupId]);
      if (!group) {
        return res.status(400).json({ error: 'Group not found' });
      }
    }

    // Update user group - use transaction for atomicity
    try {
      await dbRun('BEGIN TRANSACTION');
      await dbRun('UPDATE users SET group_id = ? WHERE id = ?', [normalizedGroupId, id]);
      await dbRun('COMMIT');
    } catch (txError: any) {
      await dbRun('ROLLBACK').catch(() => {});
      throw txError;
    }

    // Fetch updated user with group info
    const updatedUser = await dbGet(
      `SELECT u.id, u.email, u.role, u.department_id, u.group_id, u.created_at, u.is_active, 
              d.name as department_name, g.name as group_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN groups g ON u.group_id = g.id
       WHERE u.id = ?`,
      [id]
    );
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found after update' });
    }

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      departmentId: updatedUser.department_id,
      departmentName: updatedUser.department_name,
      groupId: updatedUser.group_id,
      groupName: updatedUser.group_name,
      createdAt: updatedUser.created_at,
      isActive: updatedUser.is_active === 1,
    });
  } catch (error: any) {
    console.error('Update user group error:', error);
    res.status(500).json({
      error: 'Failed to update user group',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    // Prevent self-deletion
    if (id === currentUserId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Validate user exists
    const user = await dbGet('SELECT id, email, role FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get admin user ID for reassigning tasks (prefer current admin, fallback to any admin)
    const adminUser = await dbGet(
      'SELECT id FROM users WHERE role = ? AND id != ? LIMIT 1',
      ['admin', id]
    ) || await dbGet('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);

    const adminId = adminUser?.id || currentUserId;

    // Use transaction for atomic deletion
    try {
      await dbRun('BEGIN TRANSACTION');
      
      // Clean up all user-related data
      await cleanupUserData(id, adminId);

      // Delete the user
      await dbRun('DELETE FROM users WHERE id = ?', [id]);
      
      await dbRun('COMMIT');
    } catch (deleteErr: any) {
      // Rollback on error
      await dbRun('ROLLBACK').catch(() => {}); // Ignore rollback errors
      throw deleteErr;
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    
    // Provide user-friendly error messages
    const errorMessage = error.message || error.toString() || 'Failed to delete user';
    
    if (errorMessage.includes('FOREIGN KEY constraint') || errorMessage.includes('foreign key')) {
      return res.status(400).json({ 
        error: 'Cannot delete user: They have associated records that prevent deletion.' 
      });
    }
    
    if (errorMessage.includes('SQLITE_CONSTRAINT')) {
      return res.status(400).json({ 
        error: 'Cannot delete user due to database constraints.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

export default router;

