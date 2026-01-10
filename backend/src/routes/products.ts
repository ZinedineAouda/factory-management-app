import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/db';
import { authenticate, requireRole, requirePermission, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for product image uploads
const storage = multer.diskStorage({
  destination: (req: any, file: Express.Multer.File, cb: any) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
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

// List all products (Users with can_view_products permission)
router.get('/', authenticate, requirePermission('can_view_products'), async (req: AuthRequest, res) => {
  try {
    const products = await dbAll('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (error: any) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID (Users with can_view_products permission)
router.get('/:id', authenticate, requirePermission('can_view_products'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const product = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (Users with can_edit_products permission)
router.post('/', authenticate, requirePermission('can_edit_products'), upload.single('image'), async (req: any, res) => {
  try {
    console.log('=== CREATE PRODUCT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('File:', req.file);
    console.log('User:', (req as AuthRequest).user);
    
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      console.error('Validation failed: name is missing or invalid');
      return res.status(400).json({ error: 'Product name is required' });
    }

    const trimmedName = name.trim();

    console.log('Checking for existing product with name:', trimmedName);
    const existingProduct = await dbGet('SELECT * FROM products WHERE LOWER(name) = LOWER(?)', [trimmedName]);
    if (existingProduct) {
      console.error('Validation failed: product already exists');
      return res.status(400).json({ error: 'Product name already exists' });
    }

    const productId = uuidv4();
    const trimmedDescription = description && typeof description === 'string' ? description.trim() : null;
    
    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    }
    
    console.log('Inserting product:', { id: productId, name: trimmedName, description: trimmedDescription, imageUrl });
    await dbRun(
      'INSERT INTO products (id, name, description, image_url) VALUES (?, ?, ?, ?)',
      [productId, trimmedName, trimmedDescription, imageUrl]
    );

    console.log('Product inserted successfully, fetching created product...');
    const newProduct = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (!newProduct) {
      console.error('Error: Product was inserted but could not be retrieved');
      return res.status(500).json({ error: 'Product created but could not be retrieved' });
    }
    
    console.log('Product created successfully:', newProduct);
    res.status(201).json(newProduct);
  } catch (error: any) {
    console.error('=== CREATE PRODUCT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    
    let errorMessage = 'Failed to create product';
    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('UNIQUE')) {
        errorMessage = 'Product name already exists';
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

// Update product (Users with can_edit_products permission)
router.put('/:id', authenticate, requirePermission('can_edit_products'), upload.single('image'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingProduct = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (name && name !== existingProduct.name) {
      const nameExists = await dbGet('SELECT * FROM products WHERE name = ? AND id != ?', [name, id]);
      if (nameExists) {
        return res.status(400).json({ error: 'Product name already exists' });
      }
    }

    // Handle image upload - if new image provided, use it; otherwise keep existing
    let imageUrl = existingProduct.image_url;
    if (req.file) {
      // Delete old image if exists
      if (existingProduct.image_url) {
        const oldImagePath = path.join(__dirname, '../../', existingProduct.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    await dbRun(
      'UPDATE products SET name = ?, description = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name || existingProduct.name, description !== undefined ? description : existingProduct.description, imageUrl, id]
    );

    const updatedProduct = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updatedProduct);
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (Users with can_edit_products permission)
router.delete('/:id', authenticate, requirePermission('can_edit_products'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const tasksUsingProduct = await dbGet('SELECT id FROM tasks WHERE product_id = ? LIMIT 1', [id]);
    if (tasksUsingProduct) {
      return res.status(400).json({ error: 'Cannot delete product: It is assigned to tasks' });
    }

    await dbRun('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;

