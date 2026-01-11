import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Use persistent storage path for production (Railway uses /data, Vercel uses /tmp)
// IMPORTANT: Always check for existing database files first to preserve data
const getDatabasePath = (): string => {
  // Check for custom database path in environment variable (highest priority)
  if (process.env.DATABASE_PATH) {
    const customPath = process.env.DATABASE_PATH;
    console.log(`📁 Using custom database path from DATABASE_PATH: ${customPath}`);
    return customPath;
  }

  // List of possible database locations (in order of preference)
  const possiblePaths = [
    // 1. Original project directory (check first to preserve existing data)
    path.join(__dirname, '../../factory_management.db'),
    // 2. Railway volume path
    process.env.RAILWAY_VOLUME_PATH ? path.join(process.env.RAILWAY_VOLUME_PATH, 'factory_management.db') : null,
    // 3. /data directory (persistent storage)
    '/data/factory_management.db',
  ].filter((p): p is string => p !== null);

  // Check if any existing database file exists
  for (const dbPath of possiblePaths) {
    if (fs.existsSync(dbPath)) {
      console.log(`📁 Found existing database file: ${dbPath}`);
      console.log(`✅ Using existing database to preserve your data`);
      return dbPath;
    }
  }

  // No existing database found - use the best available location
  // Railway persistent storage (recommended for production)
  if (process.env.RAILWAY_VOLUME_PATH) {
    const railwayPath = path.join(process.env.RAILWAY_VOLUME_PATH, 'factory_management.db');
    const dir = path.dirname(railwayPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created Railway volume directory: ${dir}`);
      } catch (error: any) {
        console.warn(`⚠️ Could not create Railway volume directory: ${error.message}`);
      }
    }
    console.log(`📁 Using Railway volume path: ${railwayPath}`);
    return railwayPath;
  }

  // Try /data directory (common persistent storage location)
  const dataPath = '/data/factory_management.db';
  if (process.env.NODE_ENV === 'production') {
    try {
      if (!fs.existsSync('/data')) {
        fs.mkdirSync('/data', { recursive: true });
        console.log(`📁 Created /data directory`);
      }
      console.log(`📁 Using /data directory: ${dataPath}`);
      return dataPath;
    } catch (error: any) {
      console.warn(`⚠️ Could not create /data directory: ${error.message}`);
    }
  }

  // Fallback to project directory (for local development)
  const fallbackPath = path.join(__dirname, '../../factory_management.db');
  console.log(`📁 Using fallback path (project directory): ${fallbackPath}`);
  return fallbackPath;
};

const dbPath = getDatabasePath();
console.log(`📁 Database path: ${dbPath}`);

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`✅ Created database directory: ${dbDir}`);
  } catch (error: any) {
    console.error(`❌ Failed to create database directory: ${error.message}`);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    console.error(`Database path attempted: ${dbPath}`);
  } else {
    console.log('✅ Database connected successfully');
    console.log(`📊 Database file: ${dbPath}`);
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
  // Add status column if it doesn't exist (default 'pending', but admin needs 'active')
  await dbRun(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'`).catch(() => {});
  // Add updated_at column if it doesn't exist
  await dbRun(`ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`).catch(() => {});

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
      role TEXT CHECK(role IN ('worker', 'operator', 'leader') OR role IS NULL),
      expires_at DATETIME,
      is_used INTEGER DEFAULT 0,
      created_by TEXT,
      used_by TEXT,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  
  // Add missing columns if they don't exist (migration)
  try {
    await dbRun(`ALTER TABLE registration_codes ADD COLUMN expires_at DATETIME`);
    console.log('✅ Added expires_at column to registration_codes');
  } catch (err: any) {
    // Column might already exist
    if (!err.message.includes('duplicate column')) {
      console.log('⚠️  Could not add expires_at column:', err.message);
    }
  }
  
  try {
    await dbRun(`ALTER TABLE registration_codes ADD COLUMN is_used INTEGER DEFAULT 0`);
    console.log('✅ Added is_used column to registration_codes');
  } catch (err: any) {
    // Column might already exist
    if (!err.message.includes('duplicate column')) {
      console.log('⚠️  Could not add is_used column:', err.message);
    }
  }

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
      department_name TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      message TEXT NOT NULL,
      task_id TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      is_solved INTEGER DEFAULT 0,
      solved_at DATETIME,
      solved_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES users(id),
      FOREIGN KEY (solved_by) REFERENCES users(id)
    )
  `);
  
  // Migration: Add department_name column if it doesn't exist (for existing databases)
  await dbRun(`ALTER TABLE reports ADD COLUMN department_name TEXT`).catch(() => {});
  // Migration: Copy data from department_id to department_name if needed (for existing databases)
  // This will be handled by a separate migration script if needed

  // Add is_solved, solved_at, solved_by columns if they don't exist
  await dbRun(`ALTER TABLE reports ADD COLUMN is_solved INTEGER DEFAULT 0`).catch(() => {});
  await dbRun(`ALTER TABLE reports ADD COLUMN solved_at DATETIME`).catch(() => {});
  await dbRun(`ALTER TABLE reports ADD COLUMN solved_by TEXT`).catch(() => {});

  // Report comments table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS report_comments (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
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
  // Check if table exists and has correct schema, migrate if needed (don't drop - cache can be regenerated)
  try {
    const tableInfo = await dbAll(`PRAGMA table_info(analytics_cache)`);
    const hasMetricType = tableInfo.some((col: any) => col.name === 'metric_type');
    
    if (tableInfo.length > 0 && !hasMetricType) {
      // Table exists but has wrong schema - cache data can be regenerated, so it's safe to recreate
      // But only drop if absolutely necessary (cache is temporary data anyway)
      console.log('⚠️ Analytics cache table schema outdated - will be recreated (cache data will be regenerated)');
      await dbRun(`DROP TABLE IF EXISTS analytics_cache`).catch(() => {});
    }
  } catch (error) {
    // Table doesn't exist, will be created below
  }
  
  await dbRun(`
    CREATE TABLE IF NOT EXISTS analytics_cache (
      id TEXT PRIMARY KEY,
      metric_type TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      metric_value TEXT NOT NULL,
      period_start DATETIME,
      period_end DATETIME,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(metric_type, metric_key)
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


  // Ensure admin account exists (using environment variables if available)
  await ensureAdminAccount();
  
  // Also check for legacy admin account and ensure it's active
  const adminExists = await dbGet('SELECT id FROM users WHERE username = ?', ['admin']);
  if (adminExists) {
    // Ensure existing admin user has status='active' and is_active=1
    const adminUser = await dbGet('SELECT id, status, is_active FROM users WHERE username = ?', ['admin']);
    if (adminUser) {
      const updates: string[] = [];
      const params: any[] = [];
      
      if (adminUser.status !== 'active') {
        updates.push('status = ?');
        params.push('active');
      }
      
      if (adminUser.is_active !== 1) {
        updates.push('is_active = ?');
        params.push(1);
      }
      
      if (updates.length > 0) {
        params.push(adminUser.id);
        await dbRun(
          `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          params
        );
        console.log('✅ Updated admin user status to active');
      }
    }
    console.log('✅ Admin user already exists');
  }
  
  // Final check: Ensure admin account exists (creates if missing)
  await ensureAdminAccount();

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

// Ensure admin account exists (called after any cleanup/reset)
// This function ALWAYS preserves admin accounts and creates one if missing
// IMPORTANT: Never deletes or overwrites existing admin accounts
export const ensureAdminAccount = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@factory.com';
    
    // Check for admin by username first (more specific)
    let adminExists = await dbGet('SELECT id, username, status, is_active FROM users WHERE username = ?', [adminUsername]);
    
    // If not found by username, check by role (but only if no admin exists at all)
    if (!adminExists) {
      const anyAdmin = await dbGet('SELECT id, username, status, is_active FROM users WHERE role = ? LIMIT 1', ['admin']);
      if (anyAdmin) {
        console.log(`🔒 Found existing admin account (username: ${anyAdmin.username || 'unknown'}) - preserving it`);
        adminExists = anyAdmin;
      }
    }
    
    if (!adminExists) {
      console.log(`🔐 No admin account found - creating new admin account (username: ${adminUsername})...`);
      const adminId = uuidv4();
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await dbRun(
        'INSERT INTO users (id, username, email, password_hash, role, is_active, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [adminId, adminUsername, adminEmail, hashedPassword, 'admin', 1, 'active']
      );
      console.log(`✅ Admin account created successfully (username: ${adminUsername})`);
    } else {
      // Admin exists - ensure it's active but NEVER modify credentials or delete
      const adminUser = await dbGet('SELECT id, status, is_active FROM users WHERE id = ?', [adminExists.id]);
      if (adminUser && (adminUser.status !== 'active' || adminUser.is_active !== 1)) {
        await dbRun(
          'UPDATE users SET status = ?, is_active = ? WHERE id = ?',
          ['active', 1, adminUser.id]
        );
        console.log(`✅ Admin account status updated to active (preserved existing account: ${adminExists.username || adminExists.id})`);
      } else {
        console.log(`✅ Admin account already exists and is active (username: ${adminExists.username || 'unknown'})`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error ensuring admin account:', error);
    throw error;
  }
};


export default db;
