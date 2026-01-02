import { dbRun, dbGet, dbAll } from '../src/database/db';

const clearTestData = async () => {
  console.log('🧹 Clearing all test data...\n');

  try {
    // Get admin user ID
    const admin = await dbGet("SELECT id FROM users WHERE username = 'admin'");
    if (!admin) {
      console.error('❌ Admin user not found.');
      return;
    }

    // Disable foreign keys temporarily
    await dbRun('PRAGMA foreign_keys = OFF');

    try {
      // Delete all product deliveries
      const deliveries = await dbAll('SELECT COUNT(*) as count FROM product_deliveries');
      await dbRun('DELETE FROM product_deliveries');
      console.log(`   ✓ Deleted ${deliveries[0]?.count || 0} product deliveries`);

      // Delete all task updates
      const taskUpdates = await dbAll('SELECT COUNT(*) as count FROM task_updates');
      await dbRun('DELETE FROM task_updates');
      console.log(`   ✓ Deleted ${taskUpdates[0]?.count || 0} task updates`);

      // Delete all tasks
      const tasks = await dbAll('SELECT COUNT(*) as count FROM tasks');
      await dbRun('DELETE FROM tasks');
      console.log(`   ✓ Deleted ${tasks[0]?.count || 0} tasks`);

      // Delete all report attachments
      const reportAttachments = await dbAll('SELECT COUNT(*) as count FROM report_attachments');
      await dbRun('DELETE FROM report_attachments');
      console.log(`   ✓ Deleted ${reportAttachments[0]?.count || 0} report attachments`);

      // Delete all reports
      const reports = await dbAll('SELECT COUNT(*) as count FROM reports');
      await dbRun('DELETE FROM reports');
      console.log(`   ✓ Deleted ${reports[0]?.count || 0} reports`);

      // Delete all products (except if they're referenced, but we cleared deliveries)
      const products = await dbAll('SELECT COUNT(*) as count FROM products');
      await dbRun('DELETE FROM products');
      console.log(`   ✓ Deleted ${products[0]?.count || 0} products`);

      // Delete all groups (except if users are assigned)
      const groups = await dbAll('SELECT COUNT(*) as count FROM groups');
      // First, unassign users from groups
      await dbRun('UPDATE users SET group_id = NULL WHERE group_id IS NOT NULL');
      await dbRun('DELETE FROM groups');
      console.log(`   ✓ Deleted ${groups[0]?.count || 0} groups`);

      // Delete all users except admin
      const allUsers = await dbAll("SELECT id, username FROM users WHERE username != 'admin'");
      for (const user of allUsers) {
        await dbRun('DELETE FROM users WHERE id = ?', [user.id]);
      }
      console.log(`   ✓ Deleted ${allUsers.length} users (kept admin)`);

      // Delete all departments except Production (system department)
      const depts = await dbAll("SELECT id, name FROM departments WHERE LOWER(name) != 'production'");
      // First, unassign users from these departments
      for (const dept of depts) {
        await dbRun('UPDATE users SET department_id = NULL WHERE department_id = ?', [dept.id]);
      }
      await dbRun("DELETE FROM departments WHERE LOWER(name) != 'production'");
      console.log(`   ✓ Deleted ${depts.length} departments (kept Production)`);

      // Delete all registration codes
      const regCodes = await dbAll('SELECT COUNT(*) as count FROM registration_codes');
      await dbRun('DELETE FROM registration_codes');
      console.log(`   ✓ Deleted ${regCodes[0]?.count || 0} registration codes`);

      // Delete all notifications
      const notifications = await dbAll('SELECT COUNT(*) as count FROM notifications');
      await dbRun('DELETE FROM notifications');
      console.log(`   ✓ Deleted ${notifications[0]?.count || 0} notifications`);

      // Delete all analytics cache
      const analyticsCache = await dbAll('SELECT COUNT(*) as count FROM analytics_cache');
      await dbRun('DELETE FROM analytics_cache');
      console.log(`   ✓ Deleted ${analyticsCache[0]?.count || 0} analytics cache entries`);

      // Delete all delivery drops
      const deliveryDrops = await dbAll('SELECT COUNT(*) as count FROM delivery_drops');
      await dbRun('DELETE FROM delivery_drops');
      console.log(`   ✓ Deleted ${deliveryDrops[0]?.count || 0} delivery drops`);

      // Delete all delivery drop causes
      const dropCauses = await dbAll('SELECT COUNT(*) as count FROM delivery_drop_causes');
      await dbRun('DELETE FROM delivery_drop_causes');
      console.log(`   ✓ Deleted ${dropCauses[0]?.count || 0} delivery drop causes`);

      // Delete all group performance metrics
      const groupMetrics = await dbAll('SELECT COUNT(*) as count FROM group_performance_metrics');
      await dbRun('DELETE FROM group_performance_metrics');
      console.log(`   ✓ Deleted ${groupMetrics[0]?.count || 0} group performance metrics`);

      // Re-enable foreign keys
      await dbRun('PRAGMA foreign_keys = ON');

      console.log('\n✅ All test data cleared successfully!');
      console.log('   - Admin user preserved');
      console.log('   - Production department preserved');
      console.log('\n');

    } catch (error: any) {
      await dbRun('PRAGMA foreign_keys = ON');
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Error clearing test data:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  clearTestData()
    .then(() => {
      console.log('✅ Clear complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Clear failed:', error);
      process.exit(1);
    });
}

export default clearTestData;


