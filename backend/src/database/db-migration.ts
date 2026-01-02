// Migration script to add image_url to products and create role_permissions table
import { dbRun, dbGet, dbAll } from './db';

export const runMigrations = async () => {
  try {
    // Add image_url column to products table if it doesn't exist
    try {
      const productsTableInfo = await dbAll("PRAGMA table_info(products)");
      const hasImageUrl = productsTableInfo.some((col: any) => col.name === 'image_url');
      
      if (!hasImageUrl) {
        console.log('🔄 Adding image_url column to products table...');
        await dbRun('ALTER TABLE products ADD COLUMN image_url TEXT');
        console.log('✅ Successfully added image_url column to products table.');
      }
    } catch (error: any) {
      console.error('Error adding image_url to products:', error.message);
    }

    // Create role_permissions table
    try {
      await dbRun(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id TEXT PRIMARY KEY,
          role TEXT NOT NULL UNIQUE,
          can_view_users INTEGER DEFAULT 0,
          can_edit_users INTEGER DEFAULT 0,
          can_view_departments INTEGER DEFAULT 0,
          can_edit_departments INTEGER DEFAULT 0,
          can_view_groups INTEGER DEFAULT 0,
          can_edit_groups INTEGER DEFAULT 0,
          can_view_products INTEGER DEFAULT 0,
          can_edit_products INTEGER DEFAULT 0,
          can_view_reports INTEGER DEFAULT 0,
          can_edit_reports INTEGER DEFAULT 0,
          can_view_tasks INTEGER DEFAULT 0,
          can_edit_tasks INTEGER DEFAULT 0,
          can_view_analytics INTEGER DEFAULT 0,
          max_data_reach TEXT DEFAULT 'own',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default permissions for each role if they don't exist
      const roles = ['admin', 'worker', 'operator', 'leader'];
      for (const role of roles) {
        const existing = await dbGet('SELECT id FROM role_permissions WHERE role = ?', [role]);
        if (!existing) {
          const id = require('uuid').v4();
          // Set default permissions based on role
          let permissions: any = {
            id,
            role,
            can_view_users: role === 'admin' ? 1 : 0,
            can_edit_users: role === 'admin' ? 1 : 0,
            can_view_departments: role === 'admin' ? 1 : 0,
            can_edit_departments: role === 'admin' ? 1 : 0,
            can_view_groups: role === 'admin' ? 1 : 0,
            can_edit_groups: role === 'admin' ? 1 : 0,
            can_view_products: ['admin', 'worker'].includes(role) ? 1 : 0,
            can_edit_products: role === 'admin' ? 1 : 0,
            can_view_reports: ['admin', 'operator', 'leader'].includes(role) ? 1 : 0,
            can_edit_reports: ['admin', 'operator'].includes(role) ? 1 : 0,
            can_view_tasks: 1,
            can_edit_tasks: ['admin', 'operator', 'leader'].includes(role) ? 1 : 0,
            can_view_analytics: role === 'admin' ? 1 : 0,
            max_data_reach: role === 'admin' ? 'all' : 'own',
          };
          
          await dbRun(
            `INSERT INTO role_permissions (
              id, role, can_view_users, can_edit_users, can_view_departments, can_edit_departments,
              can_view_groups, can_edit_groups, can_view_products, can_edit_products,
              can_view_reports, can_edit_reports, can_view_tasks, can_edit_tasks,
              can_view_analytics, max_data_reach
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              permissions.id, permissions.role,
              permissions.can_view_users, permissions.can_edit_users,
              permissions.can_view_departments, permissions.can_edit_departments,
              permissions.can_view_groups, permissions.can_edit_groups,
              permissions.can_view_products, permissions.can_edit_products,
              permissions.can_view_reports, permissions.can_edit_reports,
              permissions.can_view_tasks, permissions.can_edit_tasks,
              permissions.can_view_analytics, permissions.max_data_reach,
            ]
          );
        }
      }
      
      console.log('✅ Role permissions table initialized.');
    } catch (error: any) {
      console.error('Error creating role_permissions table:', error.message);
    }
  } catch (error: any) {
    console.error('Migration error:', error);
  }
};

