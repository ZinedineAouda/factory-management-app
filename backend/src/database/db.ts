import sqlite3 from 'sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const dbPath = path.join(__dirname, '../../factory_management.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Enable foreign keys and WAL mode for better concurrency
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
      console.error('Failed to enable foreign keys:', err);
    }
  });
  db.run('PRAGMA journal_mode = WAL', (err) => {
    if (err) {
      console.error('Failed to enable WAL mode:', err);
    }
  });
});

// Promisify database methods with proper parameter handling
export const dbRun = (sql: string, params?: any[]): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export const dbGet = (sql: string, params?: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql: string, params?: any[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize database
export const initDatabase = async () => {
  // Ensure foreign keys are enabled
  await dbRun('PRAGMA foreign_keys = ON');
  // Enable WAL mode for better concurrency
  await dbRun('PRAGMA journal_mode = WAL');

  // Users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      username TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT,
      department_id TEXT,
      group_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Add username column if it doesn't exist
  await dbRun(`ALTER TABLE users ADD COLUMN username TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE users ADD COLUMN group_id TEXT`).catch(() => {});

  // Departments table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Groups table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      start_time TEXT,
      end_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Registration codes table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS registration_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      role TEXT CHECK(role IN ('worker', 'operator', 'leader')),
      created_by TEXT,
      used_by TEXT,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (used_by) REFERENCES users(id)
    )
  `);

  // Tasks table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      additional_info TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      deadline DATETIME,
      created_by TEXT NOT NULL,
      assigned_to TEXT,
      department_id TEXT,
      department_type TEXT CHECK(department_type IN ('production', 'maintenance', 'quality') OR department_type IS NULL),
      task_type TEXT DEFAULT 'production',
      group_id TEXT,
      product_id TEXT,
      progress_percentage INTEGER DEFAULT 0,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Add new columns to tasks table (safe migration)
  await dbRun(`ALTER TABLE tasks ADD COLUMN task_type TEXT DEFAULT 'production'`).catch(() => {});
  await dbRun(`ALTER TABLE tasks ADD COLUMN group_id TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE tasks ADD COLUMN product_id TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE tasks ADD COLUMN assigned_to TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE tasks ADD COLUMN started_at DATETIME`).catch(() => {});
  await dbRun(`ALTER TABLE tasks ADD COLUMN completed_at DATETIME`).catch(() => {});
  await dbRun(`ALTER TABLE tasks ADD COLUMN department_type TEXT CHECK(department_type IN ('production', 'maintenance', 'quality') OR department_type IS NULL)`).catch(() => {});
  await dbRun(`ALTER TABLE tasks ADD COLUMN deadline DATETIME`).catch(() => {});
  await dbRun(`ALTER TABLE tasks ADD COLUMN additional_info TEXT`).catch(() => {});

  // Task updates table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS task_updates (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      progress_percentage INTEGER,
      update_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Products table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add image_url column if it doesn't exist
  await dbRun(`ALTER TABLE products ADD COLUMN image_url TEXT`).catch(() => {});

  // Product deliveries table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS product_deliveries (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      worker_id TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(amount > 0),
      delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Reports table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      message TEXT NOT NULL,
      task_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    )
  `);

  // Report attachments table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS report_attachments (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    )
  `);

  // Notifications table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Analytics cache table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS analytics_cache (
      id TEXT PRIMARY KEY,
      cache_key TEXT NOT NULL UNIQUE,
      cache_data TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Delivery drops table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS delivery_drops (
      id TEXT PRIMARY KEY,
      product_delivery_id TEXT NOT NULL,
      drop_percentage REAL NOT NULL,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_delivery_id) REFERENCES product_deliveries(id) ON DELETE CASCADE
    )
  `);

  // Delivery drop causes table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS delivery_drop_causes (
      id TEXT PRIMARY KEY,
      delivery_drop_id TEXT NOT NULL,
      cause_type TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (delivery_drop_id) REFERENCES delivery_drops(id) ON DELETE CASCADE
    )
  `);

  // Group performance metrics table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS group_performance_metrics (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      metric_date DATE NOT NULL,
      total_deliveries INTEGER DEFAULT 0,
      total_amount INTEGER DEFAULT 0,
      average_daily_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      UNIQUE(group_id, metric_date)
    )
  `);

  // Create default Production department if it doesn't exist
  const productionDept = await dbGet("SELECT id FROM departments WHERE LOWER(name) = 'production' LIMIT 1");
  if (!productionDept) {
    const deptId = uuidv4();
    await dbRun(
      "INSERT INTO departments (id, name, description) VALUES (?, 'Production', 'Production department')",
      [deptId]
    );
    console.log('✅ Created default Production department');
  }

  // Create default admin user if it doesn't exist (check by username)
  const adminExists = await dbGet('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    await dbRun(
      'INSERT INTO users (id, username, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'admin', hashedPassword, 'admin', 1]
    );
    console.log('✅ Created default admin user (username: admin, password: admin1234)');
  } else {
    console.log('✅ Admin user already exists');
  }

  // User notification preferences table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS user_notification_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      notify_on_profile_update INTEGER DEFAULT 1,
      notify_on_password_change INTEGER DEFAULT 1,
      notify_on_username_change INTEGER DEFAULT 1,
      notify_on_task_assigned INTEGER DEFAULT 1,
      notify_on_task_completed INTEGER DEFAULT 1,
      notify_on_report_created INTEGER DEFAULT 1,
      notify_on_user_registered INTEGER DEFAULT 0,
      notify_on_department_changes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Activity log table for dashboard
  await dbRun(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Run migrations for new features (add image_url to products, create role_permissions)
  try {
    // Add image_url column to products if it doesn't exist
    const productsTableInfo = await dbAll("PRAGMA table_info(products)");
    const hasImageUrl = productsTableInfo.some((col: any) => col.name === 'image_url');
    if (!hasImageUrl) {
      await dbRun('ALTER TABLE products ADD COLUMN image_url TEXT');
      console.log('✅ Added image_url column to products table');
    }

    // Create role_permissions table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL UNIQUE,
        role_display_name TEXT,
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
    
    // Add role_display_name column if it doesn't exist
    const rolePermsTableInfo = await dbAll("PRAGMA table_info(role_permissions)");
    const hasDisplayName = rolePermsTableInfo.some((col: any) => col.name === 'role_display_name');
    if (!hasDisplayName) {
      await dbRun('ALTER TABLE role_permissions ADD COLUMN role_display_name TEXT');
    }

    // Insert default permissions for each role if they don't exist
    const roles = ['admin', 'worker', 'operator', 'leader'];
    const roleDisplayNames: Record<string, string> = {
      admin: 'Administrator',
      worker: 'Worker',
      operator: 'Operator',
      leader: 'Leader',
    };
    for (const role of roles) {
      const existing = await dbGet('SELECT id FROM role_permissions WHERE role = ?', [role]);
      if (!existing) {
        const id = uuidv4();
        const permissions = {
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
            id, role, role_display_name, can_view_users, can_edit_users, can_view_departments, can_edit_departments,
            can_view_groups, can_edit_groups, can_view_products, can_edit_products,
            can_view_reports, can_edit_reports, can_view_tasks, can_edit_tasks,
            can_view_analytics, max_data_reach
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, role, roleDisplayNames[role] || role,
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
    console.log('✅ Role permissions initialized');
  } catch (error: any) {
    console.error('Migration error:', error.message);
  }

  console.log('✅ Database initialized successfully');
};

// Clean up all users except admin (by username)
export const cleanupUsersExceptAdmin = async () => {
  try {
    const adminUsername = 'admin';
    const adminUser = await dbGet('SELECT id FROM users WHERE username = ?', [adminUsername]);
    
    if (!adminUser) {
      console.log('⚠️  Admin user not found, skipping cleanup');
      return;
    }

    const nonAdminUsers = await dbAll('SELECT id FROM users WHERE username != ? OR username IS NULL', [adminUsername]);
    
    if (nonAdminUsers.length === 0) {
      console.log('✅ No users to clean up (only admin exists)');
      return;
    }

    console.log(`\n🧹 Cleaning up ${nonAdminUsers.length} user(s) except admin...`);
    await dbRun('PRAGMA foreign_keys = OFF');

    try {
      for (const user of nonAdminUsers) {
        const userId = user.id;
        await dbRun('DELETE FROM task_updates WHERE user_id = ?', [userId]);
        await dbRun('UPDATE tasks SET created_by = ? WHERE created_by = ?', [adminUser.id, userId]);
        await dbRun('UPDATE registration_codes SET used_by = NULL WHERE used_by = ?', [userId]);
        await dbRun('UPDATE registration_codes SET created_by = NULL WHERE created_by = ?', [userId]);
        await dbRun('DELETE FROM users WHERE id = ?', [userId]);
        console.log(`   ✓ Deleted user ${userId}`);
      }
      
      await dbRun('PRAGMA foreign_keys = ON');
      console.log(`✅ Successfully cleaned up ${nonAdminUsers.length} user(s)\n`);
    } catch (error: any) {
      await dbRun('PRAGMA foreign_keys = ON');
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Error during user cleanup:', error);
    throw error;
  }
};

// Clear ALL users from the database
export const clearAllUsers = async () => {
  try {
    console.log('\n🗑️  Clearing all users from database...');
    const allUsers = await dbAll('SELECT id, email FROM users');
    
    if (allUsers.length === 0) {
      console.log('✅ No users to delete (database is already empty)');
      return;
    }

    console.log(`   Found ${allUsers.length} user(s) to delete`);
    await dbRun('PRAGMA foreign_keys = OFF');

    try {
      for (const user of allUsers) {
        const userId = user.id;
        await dbRun('DELETE FROM task_updates WHERE user_id = ?', [userId]);
        await dbRun('DELETE FROM tasks WHERE created_by = ?', [userId]);
        await dbRun('UPDATE registration_codes SET used_by = NULL WHERE used_by = ?', [userId]);
        await dbRun('UPDATE registration_codes SET created_by = NULL WHERE created_by = ?', [userId]);
        await dbRun('DELETE FROM users WHERE id = ?', [userId]);
        console.log(`   ✓ Deleted user: ${user.email} (${userId})`);
      }
      
      await dbRun('PRAGMA foreign_keys = ON');
      console.log(`✅ Successfully deleted all ${allUsers.length} user(s)\n`);
    } catch (error: any) {
      await dbRun('PRAGMA foreign_keys = ON');
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Error during user deletion:', error);
    throw error;
  }
};

export default db;
