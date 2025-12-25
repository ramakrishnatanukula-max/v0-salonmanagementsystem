const mysql = require('mysql2/promise');

async function addColumns() {
  const pool = mysql.createPool({
    host: '194.163.45.105',
    user: 'marketingOwner',
    password: 'M@rketing123!',
    database: 'Sap'
  });

  try {
    console.log('Adding gender to customers and relation to family_members...');

    // Add gender to customers
    try {
      await pool.query(`
        ALTER TABLE customers 
        ADD COLUMN gender ENUM('male', 'female', 'other') NULL AFTER phone
      `);
      console.log('✓ Added gender column to customers');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('  gender column already exists in customers');
      } else {
        throw e;
      }
    }

    // Add relation to family_members
    try {
      await pool.query(`
        ALTER TABLE family_members 
        ADD COLUMN relation ENUM('son', 'daughter', 'wife', 'husband', 'cousin', 'other') NOT NULL DEFAULT 'other' AFTER age_group
      `);
      console.log('✓ Added relation column to family_members');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('  relation column already exists in family_members');
      } else {
        throw e;
      }
    }

    await pool.end();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addColumns();
