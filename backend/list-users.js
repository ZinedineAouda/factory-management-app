const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'factory_management.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT id, email, role, department_id, created_at, is_active FROM users ORDER BY created_at DESC', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('\n📋 All Users in Database:\n');
  console.log('Total users:', rows.length);
  console.log('═'.repeat(80));
  
  if (rows.length === 0) {
    console.log('\nNo users found in database.\n');
    db.close();
    return;
  }
  
  rows.forEach((user, index) => {
    console.log(`\n${index + 1}. Email: ${user.email}`);
    console.log(`   Role: ${user.role.toUpperCase()}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Department: ${user.department_id || 'None'}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Active: ${user.is_active === 1 ? 'Yes' : 'No'}`);
    console.log('   ' + '─'.repeat(70));
  });
  
  console.log('\n');
  db.close();
});

