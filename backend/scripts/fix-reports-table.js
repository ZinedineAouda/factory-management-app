// Quick script to fix reports table - add department_id and make task_id nullable
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../factory_management.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF', () => {
    // Check table structure
    db.all("PRAGMA table_info(reports)", (err, rows) => {
      if (err) {
        console.error('Error checking table info:', err);
        db.close();
        return;
      }

      const hasDepartmentId = rows.some(col => col.name === 'department_id');
      const hasTaskId = rows.some(col => col.name === 'task_id');
      const taskIdColumn = rows.find(col => col.name === 'task_id');
      const taskIdNotNull = taskIdColumn && taskIdColumn.notnull === 1;
      
      console.log('Current table structure:');
      console.log('- has department_id:', hasDepartmentId);
      console.log('- has task_id:', hasTaskId);
      console.log('- task_id NOT NULL:', taskIdNotNull);
      
      if (!hasDepartmentId) {
        console.log('\nAdding department_id column...');
        db.run('ALTER TABLE reports ADD COLUMN department_id TEXT', (err) => {
          if (err) {
            console.error('Error adding department_id:', err);
            db.close();
            return;
          }
          console.log('✅ department_id column added!');
          
          // Set default department
          db.get("SELECT id FROM departments WHERE LOWER(name) = 'production' LIMIT 1", (err, dept) => {
            if (err || !dept) {
              console.log('⚠️  No Production department found.');
              fixTaskId();
              return;
            }
            
            db.run('UPDATE reports SET department_id = ? WHERE department_id IS NULL', [dept.id], (err) => {
              if (err) {
                console.error('Error setting default department:', err);
              } else {
                console.log('✅ Set default department for existing reports.');
              }
              fixTaskId();
            });
          });
        });
      } else {
        console.log('✅ department_id column already exists!');
        fixTaskId();
      }
      
      function fixTaskId() {
        if (hasTaskId && taskIdNotNull) {
          console.log('\nMaking task_id nullable...');
          console.log('Recreating reports table without NOT NULL constraint on task_id...');
          
          db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              console.error('Error starting transaction:', err);
              db.close();
              return;
            }
            
            // Create new table
            db.run(`
              CREATE TABLE reports_new (
                id TEXT PRIMARY KEY,
                department_id TEXT NOT NULL,
                operator_id TEXT NOT NULL,
                message TEXT NOT NULL,
                task_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
                FOREIGN KEY (operator_id) REFERENCES users(id)
              )
            `, (err) => {
              if (err) {
                console.error('Error creating new table:', err);
                db.run('ROLLBACK', () => db.close());
                return;
              }
              
              // Copy data
              db.run(`
                INSERT INTO reports_new (id, department_id, operator_id, message, task_id, created_at)
                SELECT id, department_id, operator_id, message, task_id, created_at
                FROM reports
              `, (err) => {
                if (err) {
                  console.error('Error copying data:', err);
                  db.run('ROLLBACK', () => db.close());
                  return;
                }
                
                // Drop old table
                db.run('DROP TABLE reports', (err) => {
                  if (err) {
                    console.error('Error dropping old table:', err);
                    db.run('ROLLBACK', () => db.close());
                    return;
                  }
                  
                  // Rename new table
                  db.run('ALTER TABLE reports_new RENAME TO reports', (err) => {
                    if (err) {
                      console.error('Error renaming table:', err);
                      db.run('ROLLBACK', () => db.close());
                      return;
                    }
                    
                    db.run('COMMIT', (err) => {
                      if (err) {
                        console.error('Error committing:', err);
                      } else {
                        console.log('✅ Successfully made task_id nullable!');
                      }
                      db.run('PRAGMA foreign_keys = ON', () => db.close());
                    });
                  });
                });
              });
            });
          });
        } else {
          console.log('✅ task_id is already nullable or doesn\'t exist!');
          db.run('PRAGMA foreign_keys = ON', () => db.close());
        }
      }
    });
  });
});

