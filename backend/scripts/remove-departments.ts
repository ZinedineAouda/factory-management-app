/**
 * Migration script to remove departments from the database
 * This script:
 * 1. Removes department_id columns from users, tasks, and reports tables
 * 2. Drops the departments table
 * 3. Removes department-related foreign keys
 */

import { dbRun, dbGet, dbAll } from '../src/database/db';
import path from 'path';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

const runMigration = async () => {
  console.log('🗑️  Starting department removal migration...\n');

  try {
    // Disable foreign keys temporarily
    await dbRun('PRAGMA foreign_keys = OFF');

    console.log('1. Removing department_id from users table...');
    try {
      // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
      const users = await dbAll('SELECT * FROM users');
      await dbRun(`
        CREATE TABLE users_new (
          id TEXT PRIMARY KEY,
          email TEXT,
          username TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT,
          group_id TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active INTEGER DEFAULT 1
        )
      `);
      
      for (const user of users) {
        await dbRun(
          `INSERT INTO users_new (id, email, username, password_hash, role, group_id, status, created_at, updated_at, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.email, user.username, user.password_hash, user.role, user.group_id, user.status || 'pending', user.created_at, user.updated_at, user.is_active]
        );
      }
      
      await dbRun('DROP TABLE users');
      await dbRun('ALTER TABLE users_new RENAME TO users');
      console.log('   ✅ Removed department_id from users table\n');
    } catch (error: any) {
      if (error.message.includes('no such column: department_id')) {
        console.log('   ⚠️  department_id column does not exist in users table (already removed)\n');
      } else {
        throw error;
      }
    }

    console.log('2. Removing department_id from tasks table...');
    try {
      const tasks = await dbAll('SELECT * FROM tasks');
      await dbRun(`
        CREATE TABLE tasks_new (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          additional_info TEXT,
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          deadline DATETIME,
          created_by TEXT NOT NULL,
          assigned_to TEXT,
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
          FOREIGN KEY (group_id) REFERENCES groups(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `);
      
      for (const task of tasks) {
        await dbRun(
          `INSERT INTO tasks_new (id, title, description, additional_info, status, priority, deadline, created_by, assigned_to, department_type, task_type, group_id, product_id, progress_percentage, started_at, completed_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            task.id, task.title, task.description, task.additional_info, task.status, task.priority,
            task.deadline, task.created_by, task.assigned_to, task.department_type, task.task_type,
            task.group_id, task.product_id, task.progress_percentage, task.started_at, task.completed_at,
            task.created_at, task.updated_at
          ]
        );
      }
      
      await dbRun('DROP TABLE tasks');
      await dbRun('ALTER TABLE tasks_new RENAME TO tasks');
      console.log('   ✅ Removed department_id from tasks table\n');
    } catch (error: any) {
      if (error.message.includes('no such column: department_id')) {
        console.log('   ⚠️  department_id column does not exist in tasks table (already removed)\n');
      } else {
        throw error;
      }
    }

    console.log('3. Removing department_id from reports table...');
    try {
      const reports = await dbAll('SELECT * FROM reports');
      await dbRun(`
        CREATE TABLE reports_new (
          id TEXT PRIMARY KEY,
          operator_id TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          task_id TEXT,
          solved_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (operator_id) REFERENCES users(id),
          FOREIGN KEY (solved_by) REFERENCES users(id),
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
        )
      `);
      
      for (const report of reports) {
        await dbRun(
          `INSERT INTO reports_new (id, operator_id, message, status, priority, task_id, solved_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [report.id, report.operator_id, report.message, report.status, report.priority, report.task_id, report.solved_by, report.created_at]
        );
      }
      
      await dbRun('DROP TABLE reports');
      await dbRun('ALTER TABLE reports_new RENAME TO reports');
      console.log('   ✅ Removed department_id from reports table\n');
    } catch (error: any) {
      if (error.message.includes('no such column: department_id')) {
        console.log('   ⚠️  department_id column does not exist in reports table (already removed)\n');
      } else {
        throw error;
      }
    }

    console.log('4. Dropping departments table...');
    try {
      await dbRun('DROP TABLE IF EXISTS departments');
      console.log('   ✅ Dropped departments table\n');
    } catch (error: any) {
      console.log('   ⚠️  Could not drop departments table:', error.message, '\n');
    }

    // Re-enable foreign keys
    await dbRun('PRAGMA foreign_keys = ON');

    console.log('✅ Department removal migration completed successfully!\n');
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Run migration
runMigration()
  .then(() => {
    console.log('Migration completed. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

