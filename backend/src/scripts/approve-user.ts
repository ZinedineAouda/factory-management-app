// Script to approve a user by username
// Usage: npx ts-node src/scripts/approve-user.ts <username>

import { initDatabase, dbRun, dbGet } from '../database/db';
import path from 'path';

const approveUser = async (username: string) => {
  try {
    // Initialize database
    await initDatabase();
    
    // Check if user exists
    const user = await dbGet('SELECT id, username, status FROM users WHERE username = ?', [username]);
    
    if (!user) {
      console.error(`❌ User "${username}" not found`);
      process.exit(1);
    }
    
    if (user.status === 'active') {
      console.log(`ℹ️  User "${username}" is already approved (status: active)`);
      return;
    }
    
    // Approve the user
    await dbRun(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['active', user.id]
    );
    
    console.log(`✅ User "${username}" has been approved and can now log in!`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Previous status: ${user.status}`);
    console.log(`   New status: active`);
    
  } catch (error: any) {
    console.error('❌ Error approving user:', error.message);
    process.exit(1);
  }
};

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('❌ Usage: npx ts-node src/scripts/approve-user.ts <username>');
  console.error('   Example: npx ts-node src/scripts/approve-user.ts test');
  process.exit(1);
}

approveUser(username).then(() => {
  process.exit(0);
});

