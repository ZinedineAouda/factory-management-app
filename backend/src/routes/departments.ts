import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Diagnostic endpoint to test database connection (Admin only)
router.get('/test', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Test database connection
    const testQuery = await dbGet('SELECT 1 as test');
    const tableExists = await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name='departments'");
    const departmentCount = await dbGet('SELECT COUNT(*) as count FROM departments');
    
    res.json({
      status: 'ok',
      database: {
        connected: !!testQuery,
        departmentsTableExists: !!tableExists,
        departmentCount: departmentCount?.count || 0
      },
      message: 'Database connection test successful'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all departments
router.get('/', authenticate, async (req, res) => {
  try {
    const departments = await dbAll('SELECT * FROM departments ORDER BY name');
    res.json(departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      isSystem: dept.is_system === 1,
      createdAt: dept.created_at,
    })));
  } catch (error: any) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Create department (Admin only)
router.post('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    console.log('=== CREATE DEPARTMENT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    const { name, description } = req.body;

    // Validate input
    if (!name) {
      console.error('Validation failed: name is missing');
      return res.status(400).json({ error: 'Department name is required' });
    }

    if (typeof name !== 'string') {
      console.error('Validation failed: name is not a string');
      return res.status(400).json({ error: 'Department name must be a string' });
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      console.error('Validation failed: name is empty after trimming');
      return res.status(400).json({ error: 'Department name cannot be empty' });
    }

    // Check if department already exists (case-insensitive)
    console.log('Checking for existing department with name:', trimmedName);
    const existing = await dbGet('SELECT * FROM departments WHERE LOWER(name) = LOWER(?)', [trimmedName]);
    if (existing) {
      console.error('Validation failed: department already exists');
      return res.status(400).json({ error: 'Department already exists' });
    }

    // Generate ID and insert
    const id = uuidv4();
    const trimmedDescription = description && typeof description === 'string' ? description.trim() : null;
    
    console.log('Inserting department:', { id, name: trimmedName, description: trimmedDescription });
    
    await dbRun(
      'INSERT INTO departments (id, name, description) VALUES (?, ?, ?)',
      [id, trimmedName, trimmedDescription]
    );

    console.log('Department inserted successfully, fetching created department...');
    
    // Fetch the created department
    const department = await dbGet('SELECT * FROM departments WHERE id = ?', [id]);
    
    if (!department) {
      console.error('Error: Department was inserted but could not be retrieved');
      return res.status(500).json({ error: 'Department created but could not be retrieved' });
    }

    console.log('Department created successfully:', department);
    
    res.status(201).json({
      id: department.id,
      name: department.name,
      description: department.description,
      createdAt: department.created_at,
    });
  } catch (error: any) {
    console.error('=== CREATE DEPARTMENT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create department';
    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('UNIQUE')) {
        errorMessage = 'Department name already exists';
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

// Update department (Admin only)
router.put('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    // Check if department exists
    const existing = await dbGet('SELECT * FROM departments WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Protect system departments (Production) from editing
    if (existing.is_system === 1) {
      return res.status(403).json({ error: 'Cannot edit system department (Production)' });
    }

    // Check if another department with the same name exists (excluding current one)
    if (name !== existing.name) {
      const duplicate = await dbGet('SELECT * FROM departments WHERE name = ? AND id != ?', [name, id]);
      if (duplicate) {
        return res.status(400).json({ error: 'Department name already exists' });
      }
    }

    await dbRun(
      'UPDATE departments SET name = ?, description = ? WHERE id = ?',
      [name.trim(), description ? description.trim() : null, id]
    );

    const department = await dbGet('SELECT * FROM departments WHERE id = ?', [id]);
    res.json({
      id: department.id,
      name: department.name,
      description: department.description,
      isSystem: department.is_system === 1,
      createdAt: department.created_at,
    });
  } catch (error: any) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if department exists and is system/protected
    const department = await dbGet('SELECT * FROM departments WHERE id = ?', [id]);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Protect system departments (Production) from deletion
    if (department.is_system === 1) {
      return res.status(403).json({ error: 'Cannot delete system department (Production)' });
    }

    await dbRun('DELETE FROM departments WHERE id = ?', [id]);
    res.json({ message: 'Department deleted' });
  } catch (error: any) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;

