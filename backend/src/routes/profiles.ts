import express from 'express';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { createNotification } from './settings';
import { logActivity } from './activity-log';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads (profile photos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
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

// Get user profile (own profile or admin viewing any profile)
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    // Users can only view their own profile unless admin
    if (id !== currentUserId && !isAdmin) {
      return res.status(403).json({ error: 'You can only view your own profile' });
    }

    const user = await dbGet(
      `SELECT u.id, u.username, u.email, u.role, u.department_id, u.status, 
              u.profile_photo_url, u.bio, u.created_at, u.updated_at, u.is_active,
              d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [id]
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
      profilePhotoUrl: user.profile_photo_url,
      bio: user.bio,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      isActive: user.is_active === 1,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update own profile
router.put('/:id', authenticate, upload.single('profilePhoto'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as AuthRequest).user!.id;
    const { bio } = req.body;

    // Users can only update their own profile
    if (id !== currentUserId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    // Check if user exists
    const existingUser = await dbGet('SELECT id, profile_photo_url FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profilePhotoUrl = existingUser.profile_photo_url;

    // Handle file upload
    if (req.file) {
      profilePhotoUrl = `/uploads/profiles/${req.file.filename}`;
      
      // Delete old profile photo if exists
      if (existingUser.profile_photo_url) {
        const oldPhotoPath = path.join(__dirname, '../../', existingUser.profile_photo_url);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
    }

    // Update profile
    await dbRun(
      'UPDATE users SET bio = ?, profile_photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [bio || null, profilePhotoUrl, id]
    );

    // Create notification and log activity
    await createNotification(
      id,
      'profile_update',
      'Profile Updated',
      'Your profile has been updated successfully.'
    );
    await logActivity(id, 'Profile updated', 'user', id, 'User updated their profile');

    const updatedUser = await dbGet(
      `SELECT u.id, u.username, u.email, u.role, u.department_id, u.status,
              u.profile_photo_url, u.bio, u.created_at, u.updated_at, u.is_active,
              d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [id]
    );

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      departmentId: updatedUser.department_id,
      departmentName: updatedUser.department_name,
      profilePhotoUrl: updatedUser.profile_photo_url,
      bio: updatedUser.bio,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
      isActive: updatedUser.is_active === 1,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

