import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to create notification
const createNotification = async (userId: string, type: string, title: string, message: string, relatedId?: string) => {
  try {
    // Check user preferences
    const prefs = await dbGet('SELECT * FROM user_notification_preferences WHERE user_id = ?', [userId]);
    if (prefs) {
      const prefMap: Record<string, string> = {
        'profile_update': 'notify_on_profile_update',
        'password_change': 'notify_on_password_change',
        'username_change': 'notify_on_username_change',
        'task_assigned': 'notify_on_task_assigned',
        'task_completed': 'notify_on_task_completed',
        'report_created': 'notify_on_report_created',
        'user_registered': 'notify_on_user_registered',
        'department_changes': 'notify_on_department_changes',
      };
      const prefKey = prefMap[type];
      if (prefKey && prefs[prefKey] === 0) {
        return; // User disabled this notification type
      }
    }

    const notificationId = uuidv4();
    await dbRun(
      'INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)',
      [notificationId, userId, type, title, message, relatedId || null]
    );
  } catch (error: any) {
    console.error('Error creating notification:', error);
  }
};

// Get user settings (notification preferences)
router.get('/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    let prefs = await dbGet('SELECT * FROM user_notification_preferences WHERE user_id = ?', [userId]);
    
    if (!prefs) {
      // Create default preferences
      const id = uuidv4();
      await dbRun(
        `INSERT INTO user_notification_preferences (
          id, user_id, notify_on_profile_update, notify_on_password_change, 
          notify_on_username_change, notify_on_task_assigned, notify_on_task_completed,
          notify_on_report_created, notify_on_user_registered, notify_on_department_changes
        ) VALUES (?, ?, 1, 1, 1, 1, 1, 1, 0, 0)`,
        [id, userId]
      );
      prefs = await dbGet('SELECT * FROM user_notification_preferences WHERE user_id = ?', [userId]);
    }

    res.json({
      notifyOnProfileUpdate: prefs.notify_on_profile_update === 1,
      notifyOnPasswordChange: prefs.notify_on_password_change === 1,
      notifyOnUsernameChange: prefs.notify_on_username_change === 1,
      notifyOnTaskAssigned: prefs.notify_on_task_assigned === 1,
      notifyOnTaskCompleted: prefs.notify_on_task_completed === 1,
      notifyOnReportCreated: prefs.notify_on_report_created === 1,
      notifyOnUserRegistered: prefs.notify_on_user_registered === 1,
      notifyOnDepartmentChanges: prefs.notify_on_department_changes === 1,
    });
  } catch (error: any) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update notification preferences
router.put('/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      notifyOnProfileUpdate,
      notifyOnPasswordChange,
      notifyOnUsernameChange,
      notifyOnTaskAssigned,
      notifyOnTaskCompleted,
      notifyOnReportCreated,
      notifyOnUserRegistered,
      notifyOnDepartmentChanges,
    } = req.body;

    let prefs = await dbGet('SELECT id FROM user_notification_preferences WHERE user_id = ?', [userId]);
    
    if (!prefs) {
      const id = uuidv4();
      await dbRun(
        `INSERT INTO user_notification_preferences (
          id, user_id, notify_on_profile_update, notify_on_password_change,
          notify_on_username_change, notify_on_task_assigned, notify_on_task_completed,
          notify_on_report_created, notify_on_user_registered, notify_on_department_changes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, userId,
          notifyOnProfileUpdate ? 1 : 0,
          notifyOnPasswordChange ? 1 : 0,
          notifyOnUsernameChange ? 1 : 0,
          notifyOnTaskAssigned ? 1 : 0,
          notifyOnTaskCompleted ? 1 : 0,
          notifyOnReportCreated ? 1 : 0,
          notifyOnUserRegistered ? 1 : 0,
          notifyOnDepartmentChanges ? 1 : 0,
        ]
      );
    } else {
      await dbRun(
        `UPDATE user_notification_preferences SET
          notify_on_profile_update = ?,
          notify_on_password_change = ?,
          notify_on_username_change = ?,
          notify_on_task_assigned = ?,
          notify_on_task_completed = ?,
          notify_on_report_created = ?,
          notify_on_user_registered = ?,
          notify_on_department_changes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        [
          notifyOnProfileUpdate ? 1 : 0,
          notifyOnPasswordChange ? 1 : 0,
          notifyOnUsernameChange ? 1 : 0,
          notifyOnTaskAssigned ? 1 : 0,
          notifyOnTaskCompleted ? 1 : 0,
          notifyOnReportCreated ? 1 : 0,
          notifyOnUserRegistered ? 1 : 0,
          notifyOnDepartmentChanges ? 1 : 0,
          userId,
        ]
      );
    }

    await createNotification(
      userId,
      'profile_update',
      'Settings Updated',
      'Your notification preferences have been updated successfully.'
    );

    res.json({ message: 'Preferences updated successfully' });
  } catch (error: any) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Change password
router.put('/password', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await dbGet('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      hashedPassword,
      userId,
    ]);

    // Import logActivity dynamically to avoid circular dependency
    const { logActivity } = await import('./activity-log');
    await logActivity(userId, 'Password changed', 'user', userId);

    await createNotification(
      userId,
      'password_change',
      'Password Changed',
      'Your password has been changed successfully. If you did not make this change, please contact support immediately.'
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Change username
router.put('/username', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { newUsername, password } = req.body;

    if (!newUsername || !password) {
      return res.status(400).json({ error: 'New username and password are required' });
    }

    if (newUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    // Verify password
    const user = await dbGet('SELECT password_hash, username FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }

    // Check if username already exists
    const existingUser = await dbGet('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, userId]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const oldUsername = user.username;
    await dbRun('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      newUsername,
      userId,
    ]);

    // Import logActivity dynamically to avoid circular dependency
    const { logActivity } = await import('./activity-log');
    await logActivity(userId, `Username changed from "${oldUsername}" to "${newUsername}"`, 'user', userId);

    await createNotification(
      userId,
      'username_change',
      'Username Changed',
      `Your username has been changed from "${oldUsername}" to "${newUsername}".`
    );

    res.json({ message: 'Username changed successfully', username: newUsername });
  } catch (error: any) {
    console.error('Change username error:', error);
    res.status(500).json({ error: 'Failed to change username' });
  }
});

export { createNotification };
export default router;

