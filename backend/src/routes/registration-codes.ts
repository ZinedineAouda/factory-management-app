import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Generate registration codes (Admin only) - No role, admin assigns role after registration
router.post('/generate', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { quantity, expiresAt } = req.body;

    // Parse quantity - ensure it's a number
    let quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum < 1) {
      quantityNum = 1;
    }
    if (quantityNum > 10) {
      return res.status(400).json({ error: 'Maximum 10 codes can be generated at once' });
    }
    
    const codes = [];

    // Format expiresAt date if provided
    let formattedExpiresAt = null;
    if (expiresAt) {
      try {
        // Ensure the date is in a format SQLite can handle
        const date = new Date(expiresAt);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ error: 'Invalid expiration date format' });
        }
        formattedExpiresAt = date.toISOString().replace('T', ' ').substring(0, 19);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid expiration date format' });
      }
    }

    // Use transaction for bulk inserts
    try {
      await dbRun('BEGIN TRANSACTION');
      
      for (let i = 0; i < quantityNum; i++) {
        const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
        const code = `REG-${randomPart}`;

        const id = uuidv4();
        // No role in registration code - admin will assign role after registration
        await dbRun(
          `INSERT INTO registration_codes (id, code, role, expires_at, created_by)
           VALUES (?, ?, ?, ?, ?)`,
          [id, code, null, formattedExpiresAt, req.user!.id]
        );

        codes.push({
          id,
          code,
          role: null,
          expiresAt: formattedExpiresAt,
          createdAt: new Date().toISOString(),
        });
      }
      
      await dbRun('COMMIT');
      console.log(`✅ Successfully generated ${quantityNum} registration code(s)`);
      res.status(201).json({ codes, message: `Successfully generated ${quantityNum} code(s)` });
    } catch (insertError: any) {
      await dbRun('ROLLBACK').catch(() => {});
      console.error('Error generating codes:', insertError);
      throw insertError;
    }
  } catch (error: any) {
    console.error('Generate codes error:', error);
    res.status(500).json({ 
      error: 'Failed to generate codes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// List registration codes (Admin only)
router.get('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { role, used } = req.query;

    // Join with users table to get username
    let query = `
      SELECT 
        rc.*,
        u.username as used_by_username,
        u.email as used_by_email
      FROM registration_codes rc
      LEFT JOIN users u ON rc.used_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      query += ' AND rc.role = ?';
      params.push(role);
    }

    if (used !== undefined) {
      query += ' AND rc.is_used = ?';
      params.push(used === 'true' ? 1 : 0);
    }

    query += ' ORDER BY rc.created_at DESC';

    const codes = await dbAll(query, params);

    res.json(codes.map(code => ({
      id: code.id,
      code: code.code,
      role: code.role,
      isUsed: code.is_used === 1,
      usedBy: code.used_by,
      usedByUsername: code.used_by_username || null,
      usedByEmail: code.used_by_email || null,
      usedAt: code.used_at,
      createdAt: code.created_at,
      expiresAt: code.expires_at,
      createdBy: code.created_by,
    })));
  } catch (error: any) {
    console.error('List codes error:', error);
    res.status(500).json({ error: 'Failed to fetch codes' });
  }
});

// Delete all registration codes (Admin only)
router.delete('/all', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Get count before deletion
    const countResult = await dbGet('SELECT COUNT(*) as count FROM registration_codes');
    const count = countResult?.count || 0;

    // Delete all codes
    await dbRun('DELETE FROM registration_codes');

    console.log(`✅ Deleted ${count} registration code(s)`);
    res.json({ 
      message: `Successfully deleted ${count} registration code(s)`,
      deletedCount: count
    });
  } catch (error: any) {
    console.error('Delete all codes error:', error);
    res.status(500).json({ error: 'Failed to delete all registration codes' });
  }
});

// Delete registration code (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Code ID is required' });
    }

    // Check if code exists
    const code = await dbGet('SELECT * FROM registration_codes WHERE id = ?', [id]);

    if (!code) {
      return res.status(404).json({ error: 'Registration code not found' });
    }

    // Delete the code
    await dbRun('DELETE FROM registration_codes WHERE id = ?', [id]);

    res.json({ 
      message: 'Registration code deleted successfully',
      deletedCode: {
        id: code.id,
        code: code.code,
        role: code.role,
      }
    });
  } catch (error: any) {
    console.error('Delete code error:', error);
    res.status(500).json({ error: 'Failed to delete registration code' });
  }
});

export default router;

