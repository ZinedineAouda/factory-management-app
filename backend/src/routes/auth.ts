import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper function to get user with group info
const getUserWithGroup = async (userId: string) => {
  return await dbGet(
    `SELECT u.id, u.email, u.username, u.role, u.group_id, u.status, u.created_at, u.is_active, 
            g.name as group_name
     FROM users u
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
  groupId: user.group_id,
  groupName: user.group_name,
  createdAt: user.created_at,
  isActive: user.is_active === 1,
});

// Helper function to clean up user-related data before deletion
const cleanupUserData = async (userId: string, adminId: string) => {
  try {
    console.log(`[CLEANUP] Starting cleanup for user ${userId}`);
    
    // Check which tables have references to this user
    const tablesToCheck = [
      { name: 'task_updates', column: 'user_id', action: 'delete' },
      { name: 'tasks', column: 'created_by', action: 'update' },
      { name: 'tasks', column: 'assigned_to', action: 'update' },
      { name: 'registration_codes', column: 'used_by', action: 'null' },
      { name: 'registration_codes', column: 'created_by', action: 'null' },
      { name: 'reports', column: 'operator_id', action: 'update' },
      { name: 'reports', column: 'solved_by', action: 'update' },
      { name: 'report_comments', column: 'user_id', action: 'delete' },
      { name: 'product_deliveries', column: 'worker_id', action: 'delete' },
      { name: 'notifications', column: 'user_id', action: 'delete' },
      { name: 'activity_log', column: 'user_id', action: 'null' },
      { name: 'user_notification_preferences', column: 'user_id', action: 'delete' },
    ];
    
    const adminExists = await dbGet('SELECT id FROM users WHERE id = ?', [adminId]);
    
    for (const table of tablesToCheck) {
      try {
        // Check if table exists and has records
        const checkResult = await dbGet(
          `SELECT COUNT(*) as count FROM ${table.name} WHERE ${table.column} = ?`,
          [userId]
        );
        const count = (checkResult as any)?.count || 0;
        
        if (count > 0) {
          console.log(`[CLEANUP] Found ${count} records in ${table.name}.${table.column} for user ${userId}`);
          
          if (table.action === 'delete') {
            await dbRun(`DELETE FROM ${table.name} WHERE ${table.column} = ?`, [userId]);
            console.log(`[CLEANUP] Deleted ${count} records from ${table.name}`);
          } else if (table.action === 'null') {
            await dbRun(`UPDATE ${table.name} SET ${table.column} = NULL WHERE ${table.column} = ?`, [userId]);
            console.log(`[CLEANUP] Set ${count} records to NULL in ${table.name}`);
          } else if (table.action === 'update' && adminExists) {
            if (table.name === 'reports' && table.column === 'operator_id') {
              // For reports.operator_id, we need to reassign, but if no admin, we can't delete reports
              await dbRun(`UPDATE ${table.name} SET ${table.column} = ? WHERE ${table.column} = ?`, [adminId, userId]);
            } else if (table.name === 'reports' && table.column === 'solved_by') {
              // For reports.solved_by, we can set to NULL if needed
              await dbRun(`UPDATE ${table.name} SET ${table.column} = ? WHERE ${table.column} = ?`, [adminId, userId]);
    } else {
              await dbRun(`UPDATE ${table.name} SET ${table.column} = ? WHERE ${table.column} = ?`, [adminId, userId]);
            }
            console.log(`[CLEANUP] Updated ${count} records in ${table.name} to admin ${adminId}`);
          } else if (table.action === 'update' && !adminExists) {
            if (table.name === 'reports') {
              // For reports, set to NULL instead of deleting
              await dbRun(`UPDATE ${table.name} SET ${table.column} = NULL WHERE ${table.column} = ?`, [userId]);
              console.log(`[CLEANUP] Set ${count} records to NULL in ${table.name} (no admin)`);
            } else {
              await dbRun(`DELETE FROM ${table.name} WHERE ${table.column} = ?`, [userId]);
              console.log(`[CLEANUP] Deleted ${count} records from ${table.name} (no admin)`);
            }
          }
        }
      } catch (tableError: any) {
        // If table doesn't exist, skip it
        if (tableError.message?.includes('no such table')) {
          console.log(`[CLEANUP] Table ${table.name} does not exist, skipping`);
          continue;
        }
        console.error(`[CLEANUP] Error processing ${table.name}.${table.column}:`, tableError);
        throw tableError;
      }
    }
    
    console.log(`[CLEANUP] Completed cleanup for user ${userId}`);
  } catch (error: any) {
    console.error(`[CLEANUP] Error cleaning up user ${userId}:`, error);
    console.error(`[CLEANUP] Error details:`, error.message, error.stack);
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
      `INSERT INTO users (id, username, password_hash, role, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, username, passwordHash, code.role, initialStatus]
    );

    // Mark code as used
    await dbRun(
      'UPDATE registration_codes SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId, code.id]
    );

    // Don't generate token - user must be approved first
    const user = await dbGet('SELECT id, username, role, status, created_at, is_active FROM users WHERE id = ?', [userId]);

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
              `User "${username}" has registered and is pending approval.`,
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

    // Get role permissions for the user (if they exist)
    let rolePermissions = null;
    try {
      rolePermissions = await dbGet(
        'SELECT * FROM role_permissions WHERE role = ?',
        [user.role]
      );
    } catch (error) {
      // If role_permissions table doesn't exist or query fails, continue without permissions
      console.warn(`Could not fetch permissions for role ${user.role}:`, error);
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        groupId: userWithGroup?.group_id || null,
        groupName: userWithGroup?.group_name || null,
        profilePhotoUrl: user.profile_photo_url,
        bio: user.bio,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        isActive: user.is_active,
        permissions: rolePermissions ? {
          canViewUsers: rolePermissions.can_view_users === 1,
          canEditUsers: rolePermissions.can_edit_users === 1,
          canViewGroups: rolePermissions.can_view_groups === 1,
          canEditGroups: rolePermissions.can_edit_groups === 1,
          canViewProducts: rolePermissions.can_view_products === 1,
          canEditProducts: rolePermissions.can_edit_products === 1,
          canViewReports: rolePermissions.can_view_reports === 1,
          canEditReports: rolePermissions.can_edit_reports === 1,
          canViewTasks: rolePermissions.can_view_tasks === 1,
          canEditTasks: rolePermissions.can_edit_tasks === 1,
          canViewAnalytics: rolePermissions.can_view_analytics === 1,
          maxDataReach: rolePermissions.max_data_reach || 'own',
        } : null,
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
      `SELECT u.id, u.username, u.email, u.role, u.group_id, u.status, 
              u.profile_photo_url, u.bio, u.created_at, u.updated_at, u.is_active, 
              g.name as group_name
       FROM users u
       LEFT JOIN groups g ON u.group_id = g.id
       WHERE u.id = ?`,
      [req.user!.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get role permissions for the user (if they exist)
    let rolePermissions = null;
    try {
      rolePermissions = await dbGet(
        'SELECT * FROM role_permissions WHERE role = ?',
        [user.role]
      );
    } catch (error) {
      // If role_permissions table doesn't exist or query fails, continue without permissions
      console.warn(`Could not fetch permissions for role ${user.role}:`, error);
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      groupId: user.group_id,
      groupName: user.group_name,
      profilePhotoUrl: user.profile_photo_url,
      bio: user.bio,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      isActive: user.is_active === 1,
      permissions: rolePermissions ? {
        canViewUsers: rolePermissions.can_view_users === 1,
        canEditUsers: rolePermissions.can_edit_users === 1,
        canViewDepartments: rolePermissions.can_view_departments === 1,
        canEditDepartments: rolePermissions.can_edit_departments === 1,
        canViewGroups: rolePermissions.can_view_groups === 1,
        canEditGroups: rolePermissions.can_edit_groups === 1,
        canViewProducts: rolePermissions.can_view_products === 1,
        canEditProducts: rolePermissions.can_edit_products === 1,
        canViewReports: rolePermissions.can_view_reports === 1,
        canEditReports: rolePermissions.can_edit_reports === 1,
        canViewTasks: rolePermissions.can_view_tasks === 1,
        canEditTasks: rolePermissions.can_edit_tasks === 1,
        canViewAnalytics: rolePermissions.can_view_analytics === 1,
        maxDataReach: rolePermissions.max_data_reach || 'own',
      } : null,
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

// Approve user (Admin only) - COMPLETE REBUILD
router.post('/users/:id/approve', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  const startTime = Date.now();
  const userId = req.params.id;
  
  try {
    // Step 1: Validate request body
    const { role, departmentId, groupId } = req.body;
    
    console.log(`[APPROVE] Starting approval process for user ${userId}`);
    console.log(`[APPROVE] Request body:`, { role, departmentId, groupId });
    console.log(`[APPROVE] Admin user:`, req.user?.id);

    // Step 2: Validate role is provided
    if (!role) {
      console.error(`[APPROVE] Missing role parameter`);
      return res.status(400).json({ 
        error: 'Role is required',
        code: 'MISSING_ROLE'
      });
    }

    // Step 3: Normalize and validate role dynamically against database
    const normalizedRole = String(role || '').toLowerCase().trim();
    if (!normalizedRole) {
      console.error(`[APPROVE] Empty role parameter`);
      return res.status(400).json({ 
        error: 'Role is required and cannot be empty',
        code: 'EMPTY_ROLE'
      });
    }
    
    const dbRoles = await dbAll('SELECT role FROM role_permissions');
    const validRoleNames = dbRoles
      .filter((r: any) => r && r.role && typeof r.role === 'string')
      .map((r: any) => String(r.role).toLowerCase());
    
    if (validRoleNames.length === 0) {
      console.error(`[APPROVE] No valid roles found in database`);
      return res.status(500).json({ 
        error: 'No valid roles configured in the system',
        code: 'NO_ROLES_CONFIGURED'
      });
    }
    
    if (!validRoleNames.includes(normalizedRole)) {
      console.error(`[APPROVE] Invalid role: ${normalizedRole}`);
      return res.status(400).json({ 
        error: `Invalid role. Must be one of: ${validRoleNames.join(', ')}`,
        code: 'INVALID_ROLE',
        received: role,
        validRoles: validRoleNames
      });
    }

    // Step 4: Get user to approve
    const user = await dbGet(
      'SELECT id, username, email, status, role, group_id FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      console.error(`[APPROVE] User not found: ${userId}`);
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    console.log(`[APPROVE] Found user:`, { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      currentStatus: user.status 
    });

    // Step 5: Check if already approved
    if (user.status === 'active') {
      console.warn(`[APPROVE] User already approved: ${userId}`);
      return res.status(400).json({ 
        error: 'User is already approved',
        code: 'ALREADY_APPROVED'
      });
    }

    // Step 6: Validate group if provided
    let finalGroupId = null;
    if (groupId && String(groupId).trim()) {
      const grpId = String(groupId).trim();
      const group = await dbGet('SELECT id, name FROM groups WHERE id = ?', [grpId]);
      if (!group) {
        console.error(`[APPROVE] Invalid group ID: ${grpId}`);
        return res.status(400).json({ 
          error: 'Invalid group ID',
          code: 'INVALID_GROUP',
          groupId: grpId
        });
      }
      finalGroupId = grpId;
      console.log(`[APPROVE] Valid group: ${group.name}`);
    }

    // Step 7: Update user (SAFE - only updates specific fields, preserves all other data)
    console.log(`[APPROVE] Updating user with:`, {
      status: 'active',
      role: normalizedRole,
      groupId: finalGroupId
    });

    const updateResult = await dbRun(
      `UPDATE users 
       SET status = ?, 
           role = ?, 
           group_id = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      ['active', normalizedRole, finalGroupId, userId]
    );

    console.log(`[APPROVE] Update result:`, { 
      changes: (updateResult as any).changes,
      lastID: (updateResult as any).lastID 
    });

    // Step 9: Create notification (non-blocking)
    try {
      const notificationId = uuidv4();
      await dbRun(
        `INSERT INTO notifications (id, user_id, type, title, message, related_id, is_read, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
        [
          notificationId,
          userId,
          'account_approved',
          'Account Approved',
          'Your account has been approved. You can now log in and access the system.',
          userId
        ]
      );
      console.log(`[APPROVE] Notification created: ${notificationId}`);
    } catch (notifError: any) {
      console.warn(`[APPROVE] Failed to create notification (non-critical):`, notifError.message);
      // Continue even if notification fails
    }

    // Step 10: Get updated user data
    const updatedUser = await getUserWithGroup(userId);
    
    if (!updatedUser) {
      console.error(`[APPROVE] Failed to retrieve updated user data`);
      return res.status(500).json({ 
        error: 'User approved but failed to retrieve updated data',
        code: 'RETRIEVE_ERROR'
      });
    }

    const responseData = {
      message: 'User approved successfully',
      user: formatUserResponse(updatedUser),
    };

    const duration = Date.now() - startTime;
    console.log(`[APPROVE] ✅ Successfully approved user ${userId} in ${duration}ms`);

    res.json(responseData);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[APPROVE] ❌ Error after ${duration}ms:`, {
      message: error.message,
      code: error.code,
      stack: error.stack,
      userId,
      body: req.body,
    });

    // Provide detailed error in development
    const errorResponse: any = {
      error: 'Failed to approve user',
      code: 'APPROVAL_ERROR'
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.message;
      errorResponse.stack = error.stack;
    }

    res.status(500).json(errorResponse);
  }
});

// Get pending users (Admin only)
router.get('/users/pending', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const users = await dbAll(
      `SELECT u.id, u.email, u.username, u.role, u.department_id, u.group_id, u.status, u.created_at, u.is_active, 
              d.name as department_name, g.name as group_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN groups g ON u.group_id = g.id
       WHERE u.status = 'pending'
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
    console.error('Get pending users error:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
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


// Update user role (Admin only) - Validates against dynamic roles from database
router.put('/users/:id/role', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate user exists
    const existingUser = await dbGet('SELECT id, email FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate role dynamically against database
    if (!role || typeof role !== 'string') {
      return res.status(400).json({ 
        error: 'Role is required and must be a string'
      });
    }
    
    const validRoles = await dbAll('SELECT role FROM role_permissions');
    const validRoleNames = validRoles
      .filter((r: any) => r && r.role && typeof r.role === 'string')
      .map((r: any) => String(r.role).toLowerCase());
    
    if (validRoleNames.length === 0) {
      return res.status(500).json({ 
        error: 'No valid roles configured in the system'
      });
    }
    
    const normalizedRole = String(role).toLowerCase().trim();
    if (!validRoleNames.includes(normalizedRole)) {
      return res.status(400).json({ 
        error: `Invalid role. Must be one of: ${validRoleNames.join(', ')}` 
      });
    }

    // Prevent changing own role
    if (id === req.user!.id && role !== req.user!.role) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    // Update user role
    try {
      await dbRun('BEGIN TRANSACTION');
      await dbRun('UPDATE users SET role = ? WHERE id = ?', [normalizedRole, id]);
      await dbRun('COMMIT');
    } catch (txError: any) {
      await dbRun('ROLLBACK').catch(() => {});
      throw txError;
    }

    // Fetch updated user
    const updatedUser = await getUserWithGroup(id);
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

// Update user username (Admin only)
router.put('/users/:id/username', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    const newUsername = username.trim();

    // Validate user exists
    const existingUser = await dbGet('SELECT id, username FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username already exists (excluding current user)
    const usernameTaken = await dbGet('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, id]);
    if (usernameTaken) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Update username
    await dbRun('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newUsername, id]);

    // Fetch updated user
    const updatedUser = await getUserWithGroup(id);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found after update' });
    }

    res.json(formatUserResponse(updatedUser));
  } catch (error: any) {
    console.error('Update user username error:', error);
    res.status(500).json({
      error: 'Failed to update username',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user password (Admin only)
router.put('/users/:id/password', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate user exists
    const existingUser = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await dbRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Update user password error:', error);
    res.status(500).json({
      error: 'Failed to update password',
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

    // Disable foreign keys BEFORE any operations
    // SQLite requires PRAGMA to be set per connection and before transactions
    console.log(`[DELETE USER] Starting deletion process for user ${id}`);
    
    try {
      // Get current foreign key setting
      const fkResult = await dbGet('PRAGMA foreign_keys');
      const fkEnabled = (fkResult as any)?.foreign_keys === 1;
      console.log(`[DELETE USER] Foreign keys currently: ${fkEnabled ? 'ON' : 'OFF'}`);
      
      // Disable foreign keys to allow deletion of records with references
      await dbRun('PRAGMA foreign_keys = OFF');
      console.log(`[DELETE USER] Foreign keys disabled`);
      
      // Clean up all user-related data (must be done before deletion)
      await cleanupUserData(id, adminId);

      // Start transaction for atomic deletion
      await dbRun('BEGIN TRANSACTION');
      console.log(`[DELETE USER] Transaction started`);

      // Delete the user
      const deleteResult = await dbRun('DELETE FROM users WHERE id = ?', [id]);
      console.log(`[DELETE USER] User deletion query executed`);
      
      // Verify deletion
      const verifyUser = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
      if (verifyUser) {
        throw new Error('User still exists after deletion attempt');
      }
      console.log(`[DELETE USER] User deletion verified`);
      
      await dbRun('COMMIT');
      console.log(`[DELETE USER] Transaction committed`);
      
      // Re-enable foreign keys
      await dbRun('PRAGMA foreign_keys = ON');
      console.log(`[DELETE USER] Foreign keys re-enabled`);
      
      console.log(`[DELETE USER] User ${id} deleted successfully`);
    } catch (deleteErr: any) {
      console.error(`[DELETE USER] Error deleting user ${id}:`, deleteErr);
      console.error(`[DELETE USER] Error message:`, deleteErr.message);
      console.error(`[DELETE USER] Error code:`, (deleteErr as any)?.code);
      console.error(`[DELETE USER] Error stack:`, deleteErr.stack);
      
      // Rollback transaction if it was started
      try {
        await dbRun('ROLLBACK');
        console.log(`[DELETE USER] Transaction rolled back`);
      } catch (rollbackErr: any) {
        console.error(`[DELETE USER] Rollback error (might not be in transaction):`, rollbackErr.message);
      }
      
      // Always re-enable foreign keys, even on error
      try {
        await dbRun('PRAGMA foreign_keys = ON');
        console.log(`[DELETE USER] Foreign keys re-enabled after error`);
      } catch (fkErr: any) {
        console.error(`[DELETE USER] Error re-enabling foreign keys:`, fkErr.message);
      }
      
      // Re-throw the error so it can be handled by the outer catch block
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

