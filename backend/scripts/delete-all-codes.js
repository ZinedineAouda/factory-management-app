// Script to delete all registration codes
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../factory_management.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Get count first
db.get('SELECT COUNT(*) as count FROM registration_codes', (err, row) => {
  if (err) {
    console.error('❌ Error counting codes:', err);
    db.close();
    process.exit(1);
  }
  
  const count = row.count;
  console.log(`📊 Found ${count} registration code(s)`);
  
  if (count === 0) {
    console.log('✅ No codes to delete');
    db.close();
    process.exit(0);
  }
  
  // Delete all codes
  db.run('DELETE FROM registration_codes', (err) => {
    if (err) {
      console.error('❌ Error deleting codes:', err);
      db.close();
      process.exit(1);
    }
    
    console.log(`✅ Successfully deleted ${count} registration code(s)`);
    db.close();
    process.exit(0);
  });
});




