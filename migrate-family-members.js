const mysql = require('mysql2/promise');

async function runMigration() {
  const pool = mysql.createPool({
    host: '194.163.45.105',
    user: 'marketingOwner',
    password: 'M@rketing123!',
    database: 'Sap'
  });

  try {
    console.log('Starting family members migration...');

    // First, check the customers table structure
    const [customers] = await pool.query('DESCRIBE customers');
    const idColumn = customers.find(col => col.Field === 'id');
    console.log('Customers ID column type:', idColumn.Type);

    // Drop foreign key constraint from appointments if it exists
    try {
      await pool.query(`
        ALTER TABLE appointments
        DROP FOREIGN KEY fk_appointment_family_member
      `);
      console.log('✓ Dropped foreign key constraint from appointments');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  Foreign key constraint does not exist');
      } else {
        console.log('  Could not drop constraint:', err.message);
      }
    }

    // Drop existing table if it exists with wrong structure
    await pool.query('DROP TABLE IF EXISTS family_members');
    console.log('✓ Dropped existing family_members table (if any)');

    // 1. Create family_members table WITHOUT foreign key first
    await pool.query(`
      CREATE TABLE family_members (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        customer_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(255) NOT NULL,
        gender ENUM('male', 'female', 'other') NOT NULL,
        age INT,
        age_group ENUM('kid', 'adult', 'men', 'women') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customer (customer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Created family_members table');

    // 2. Add foreign key constraint separately
    try {
      await pool.query(`
        ALTER TABLE family_members
        ADD CONSTRAINT fk_family_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      `);
      console.log('✓ Added foreign key constraint');
    } catch (err) {
      if (err.code === 'ER_FK_DUP_NAME' || err.message.includes('already exists')) {
        console.log('  Foreign key already exists');
      } else {
        throw err;
      }
    }

    // 2. Add index on customers phone if not exists
    try {
      await pool.query(`
        CREATE INDEX idx_phone ON customers(phone)
      `);
      console.log('✓ Added index on customers.phone');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('  Index on phone already exists');
      } else {
        console.log('  Could not add index:', err.message);
      }
    }

    // 3. Add family_member_id to appointments table
    try {
      await pool.query(`
        ALTER TABLE appointments
        ADD COLUMN family_member_id BIGINT UNSIGNED NULL
      `);
      console.log('✓ Added family_member_id column to appointments');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  family_member_id column already exists');
      } else {
        throw err;
      }
    }

    // 4. Add is_for_self column
    try {
      await pool.query(`
        ALTER TABLE appointments
        ADD COLUMN is_for_self BOOLEAN DEFAULT 1
      `);
      console.log('✓ Added is_for_self column to appointments');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  is_for_self column already exists');
      } else {
        throw err;
      }
    }

    // 5. Add foreign key constraint for appointments
    try {
      await pool.query(`
        ALTER TABLE appointments
        ADD CONSTRAINT fk_appointment_family_member
        FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL
      `);
      console.log('✓ Added foreign key constraint to appointments');
    } catch (err) {
      if (err.code === 'ER_FK_DUP_NAME' || err.message.includes('already exists')) {
        console.log('  Foreign key already exists');
      } else {
        console.log('  Could not add foreign key:', err.message);
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
