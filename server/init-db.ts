import { sql as sqlite } from './db';

export async function initializeDatabase() {
  console.log('🔧 Initializing SQLite database...');

  try {
    // Create branches table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);

    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'employee',
        position TEXT NOT NULL,
        hourly_rate TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        blockchain_verified INTEGER DEFAULT 0,
        blockchain_hash TEXT,
        verified_at INTEGER,
        created_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      )
    `);

    // Migrate existing users table to add blockchain verification columns if they don't exist
    try {
      sqlite.exec(`ALTER TABLE users ADD COLUMN blockchain_verified INTEGER DEFAULT 0`);
      console.log('✅ Added blockchain_verified column to users table');
    } catch (error: any) {
      // Column already exists or other error - ignore if it's a duplicate column error
      if (!error.message.includes('duplicate column name')) {
        console.log('ℹ️  blockchain_verified column already exists or migration not needed');
      }
    }

    try {
      sqlite.exec(`ALTER TABLE users ADD COLUMN blockchain_hash TEXT`);
      console.log('✅ Added blockchain_hash column to users table');
    } catch (error: any) {
      if (!error.message.includes('duplicate column name')) {
        console.log('ℹ️  blockchain_hash column already exists or migration not needed');
      }
    }

    try {
      sqlite.exec(`ALTER TABLE users ADD COLUMN verified_at INTEGER`);
      console.log('✅ Added verified_at column to users table');
    } catch (error: any) {
      if (!error.message.includes('duplicate column name')) {
        console.log('ℹ️  verified_at column already exists or migration not needed');
      }
    }

    // Create shifts table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        position TEXT NOT NULL,
        is_recurring INTEGER DEFAULT 0,
        recurring_pattern TEXT,
        status TEXT DEFAULT 'scheduled',
        actual_start_time INTEGER,
        actual_end_time INTEGER,
        created_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      )
    `);

    // Create shift_trades table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS shift_trades (
        id TEXT PRIMARY KEY,
        shift_id TEXT NOT NULL,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        urgency TEXT DEFAULT 'normal',
        notes TEXT,
        requested_at INTEGER DEFAULT (unixepoch()),
        approved_at INTEGER,
        approved_by TEXT,
        FOREIGN KEY (shift_id) REFERENCES shifts(id),
        FOREIGN KEY (from_user_id) REFERENCES users(id),
        FOREIGN KEY (to_user_id) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // Create payroll_periods table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS payroll_periods (
        id TEXT PRIMARY KEY,
        branch_id TEXT NOT NULL,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        status TEXT DEFAULT 'open',
        total_hours TEXT,
        total_pay TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      )
    `);

    // Create payroll_entries table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS payroll_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        payroll_period_id TEXT NOT NULL,
        total_hours TEXT NOT NULL,
        regular_hours TEXT NOT NULL,
        overtime_hours TEXT DEFAULT '0',
        gross_pay TEXT NOT NULL,
        deductions TEXT DEFAULT '0',
        net_pay TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        blockchain_hash TEXT,
        block_number INTEGER,
        transaction_hash TEXT,
        verified INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id)
      )
    `);

    // Create approvals table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        request_id TEXT NOT NULL,
        requested_by TEXT NOT NULL,
        approved_by TEXT,
        status TEXT DEFAULT 'pending',
        reason TEXT,
        request_data TEXT,
        requested_at INTEGER DEFAULT (unixepoch()),
        responded_at INTEGER,
        FOREIGN KEY (requested_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // Create time_off_requests table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS time_off_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        type TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        requested_at INTEGER DEFAULT (unixepoch()),
        approved_at INTEGER,
        approved_by TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // Create notifications table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        data TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create setup_status table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS setup_status (
        id TEXT PRIMARY KEY,
        is_setup_complete INTEGER DEFAULT 0,
        setup_completed_at INTEGER
      )
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

