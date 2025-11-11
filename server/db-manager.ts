import { sql as sqlite, dbPath } from './db';
import * as readline from 'readline';
import * as fs from 'fs';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Prompt user for database choice
 */
export async function promptDatabaseChoice(): Promise<'fresh' | 'continue' | 'sample'> {
  // Check if database file exists
  const dbExists = fs.existsSync(dbPath);

  if (!dbExists) {
    console.log('\n📊 No existing database found. Creating a new database...\n');
    return 'fresh';
  }

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(70));
    console.log('🗄️  DATABASE STARTUP OPTIONS');
    console.log('='.repeat(70));
    console.log('\n📊 Existing database found at:', dbPath);
    console.log('\nChoose an option:');
    console.log('  [1] Continue with existing database (keep all data)');
    console.log('  [2] Start fresh (delete all data and reset)');
    console.log('  [3] Load sample data (showcase features with demo data)');
    console.log('\n' + '='.repeat(70));

    rl.question('\nEnter your choice (1, 2, or 3): ', (answer) => {
      rl.close();

      const choice = answer.trim();

      if (choice === '2') {
        console.log('\n⚠️  WARNING: This will delete ALL existing data!');
        const confirmRl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        confirmRl.question('Are you sure? Type "yes" to confirm: ', (confirm) => {
          confirmRl.close();

          if (confirm.trim().toLowerCase() === 'yes') {
            console.log('\n🗑️  Deleting existing database...');
            resolve('fresh');
          } else {
            console.log('\n✅ Cancelled. Continuing with existing database...');
            resolve('continue');
          }
        });
      } else if (choice === '3') {
        console.log('\n⚠️  WARNING: This will delete ALL existing data and load sample data!');
        const confirmRl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        confirmRl.question('Are you sure? Type "yes" to confirm: ', (confirm) => {
          confirmRl.close();

          if (confirm.trim().toLowerCase() === 'yes') {
            console.log('\n📦 Loading sample data...');
            resolve('sample');
          } else {
            console.log('\n✅ Cancelled. Continuing with existing database...');
            resolve('continue');
          }
        });
      } else {
        console.log('\n✅ Continuing with existing database...');
        resolve('continue');
      }
    });
  });
}

/**
 * Delete the database file
 * Note: After calling this, the database connection will be closed.
 * A new connection will be created when the database is initialized again.
 */
export function deleteDatabaseFile(): void {
  try {
    if (fs.existsSync(dbPath)) {
      // Close the database connection first
      try {
        sqlite.close();
        console.log('🔌 Database connection closed');
      } catch (e) {
        // Ignore if already closed
        console.log('⚠️  Database connection was already closed');
      }

      // Wait a bit for file locks to be released
      const startTime = Date.now();
      let deleted = false;

      while (!deleted && Date.now() - startTime < 3000) {
        try {
          fs.unlinkSync(dbPath);
          deleted = true;
          console.log('✅ Database file deleted successfully');
        } catch (e: any) {
          if (e.code === 'EBUSY' || e.code === 'EACCES') {
            // File is still locked, wait a bit and retry
            const now = Date.now();
            while (Date.now() - now < 100) {
              // Busy wait for 100ms
            }
          } else {
            throw e;
          }
        }
      }

      if (!deleted) {
        throw new Error('Failed to delete database file after multiple attempts');
      }
    }
  } catch (error) {
    console.error('❌ Error deleting database file:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export function getDatabaseStats(): any {
  try {
    const stats: any = {
      exists: fs.existsSync(dbPath),
      path: dbPath,
    };

    if (stats.exists) {
      const fileStats = fs.statSync(dbPath);
      stats.size = fileStats.size;
      stats.sizeFormatted = formatBytes(fileStats.size);
      stats.created = fileStats.birthtime;
      stats.modified = fileStats.mtime;

      // Get table counts
      try {
        const tables = [
          'users',
          'branches',
          'shifts',
          'shift_trades',
          'payroll_periods',
          'payroll_entries',
          'approvals',
          'time_off_requests',
          'notifications'
        ];

        stats.tables = {};
        for (const table of tables) {
          try {
            const result = sqlite.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
            stats.tables[table] = result.count;
          } catch (e) {
            stats.tables[table] = 'N/A';
          }
        }
      } catch (e) {
        console.error('Error getting table counts:', e);
      }
    }

    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Display database statistics
 */
export function displayDatabaseStats(): void {
  const stats = getDatabaseStats();

  console.log('\n' + '='.repeat(70));
  console.log('📊 DATABASE STATISTICS');
  console.log('='.repeat(70));

  if (!stats.exists) {
    console.log('\n❌ Database does not exist');
    return;
  }

  console.log(`\n📁 File: ${stats.path}`);
  console.log(`📏 Size: ${stats.sizeFormatted}`);
  console.log(`📅 Created: ${stats.created}`);
  console.log(`🔄 Modified: ${stats.modified}`);

  if (stats.tables) {
    console.log('\n📋 Table Records:');
    for (const [table, count] of Object.entries(stats.tables)) {
      console.log(`   ${table.padEnd(20)} : ${count}`);
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Load sample data into the database
 */
export async function loadSampleData(): Promise<void> {
  try {
    console.log('\n📦 Loading sample data...\n');

    // Hash password for all users (password123)
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Mark setup as complete first
    const setupId = 'setup-status-1';
    sqlite.prepare(`
      INSERT INTO setup_status (id, is_setup_complete, setup_completed_at)
      VALUES (?, ?, ?)
    `).run(setupId, 1, Math.floor(Date.now() / 1000));

    // Sample branch
    const branchId = 'branch-sample-1';
    sqlite.prepare(`
      INSERT INTO branches (id, name, address, phone, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(branchId, 'Downtown Cafe', '123 Main St, Downtown', '(555) 123-4567', 1, Math.floor(Date.now() / 1000));

    // Sample manager (auto-verified on blockchain)
    const managerId = 'user-manager-1';
    const managerData = `${managerId}-Sarah-Johnson-sarah@thecafe.com-Store Manager`;
    const managerHash = crypto.createHash('sha256').update(managerData).digest('hex');

    sqlite.prepare(`
      INSERT INTO users (id, username, password, first_name, last_name, email, role, position, hourly_rate, branch_id, is_active, blockchain_verified, blockchain_hash, verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(managerId, 'sarah', hashedPassword, 'Sarah', 'Johnson', 'sarah@thecafe.com', 'manager', 'Store Manager', '25.00', branchId, 1, 1, managerHash, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000));

    // Sample employees
    const employees = [
      { id: 'user-emp-1', username: 'john', name: 'John', lastName: 'Smith', email: 'john@thecafe.com', position: 'Barista', rate: '15.00' },
      { id: 'user-emp-2', username: 'jane', name: 'Jane', lastName: 'Doe', email: 'jane@thecafe.com', position: 'Cashier', rate: '14.50' },
      { id: 'user-emp-3', username: 'mike', name: 'Mike', lastName: 'Wilson', email: 'mike@thecafe.com', position: 'Chef', rate: '18.00' },
      { id: 'user-emp-4', username: 'emma', name: 'Emma', lastName: 'Brown', email: 'emma@thecafe.com', position: 'Barista', rate: '15.50' },
    ];

    for (const emp of employees) {
      sqlite.prepare(`
        INSERT INTO users (id, username, password, first_name, last_name, email, role, position, hourly_rate, branch_id, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(emp.id, emp.username, hashedPassword, emp.name, emp.lastName, emp.email, 'employee', emp.position, emp.rate, branchId, 1, Math.floor(Date.now() / 1000));
    }

    // Sample shifts for this week
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let i = 0; i < 7; i++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(shiftDate.getDate() + i);

      // Skip Sundays
      if (shiftDate.getDay() === 0) continue;

      for (let empIdx = 0; empIdx < employees.length; empIdx++) {
        const shiftId = `shift-${i}-${empIdx}`;
        const startTime = new Date(shiftDate);
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date(shiftDate);
        endTime.setHours(17, 0, 0, 0);

        sqlite.prepare(`
          INSERT INTO shifts (id, user_id, branch_id, start_time, end_time, position, is_recurring, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          shiftId,
          employees[empIdx].id,
          branchId,
          Math.floor(startTime.getTime() / 1000),
          Math.floor(endTime.getTime() / 1000),
          employees[empIdx].position,
          0,
          'scheduled',
          Math.floor(Date.now() / 1000)
        );
      }
    }

    // Sample payroll period
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - periodStart.getDay() + 1); // Start of week
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6); // End of week

    const periodId = 'period-sample-1';
    sqlite.prepare(`
      INSERT INTO payroll_periods (id, branch_id, start_date, end_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      periodId,
      branchId,
      Math.floor(periodStart.getTime() / 1000),
      Math.floor(periodEnd.getTime() / 1000),
      'open',
      Math.floor(Date.now() / 1000)
    );

    console.log('✅ Sample data loaded successfully!\n');
    console.log('📋 Sample Data Created:');
    console.log('   • 1 Branch: Downtown Cafe');
    console.log('   • 1 Manager: sarah (password: password123)');
    console.log('   • 4 Employees: john, jane, mike, emma (password: password123)');
    console.log('   • 24 Shifts for this week');
    console.log('   • 1 Open Payroll Period\n');
    console.log('🎯 You can now:');
    console.log('   1. Login as manager (sarah) to manage employees');
    console.log('   2. Create and process payroll');
    console.log('   3. Clock in/out employees');
    console.log('   4. View payroll entries and send payslips\n');
  } catch (error) {
    console.error('❌ Error loading sample data:', error);
    throw error;
  }
}

