import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "194.163.45.105",
  user: process.env.MYSQL_USER || "marketingOwner",
  password: process.env.MYSQL_PASSWORD || "M@rketing123!",
  database: process.env.MYSQL_DATABASE || "Sap",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
});

async function debug() {
  try {
    console.log("Testing database connection...");
    
    // Test connection
    const connection = await pool.getConnection();
    console.log("✓ Database connected!");
    connection.release();
    
    // Check users table
    const [users] = await pool.query("SELECT * FROM users LIMIT 10");
    console.log("\nUsers in database:");
    console.log(JSON.stringify(users, null, 2));
    
    if (users.length === 0) {
      console.log("\n⚠ No users found! Please create a user first via the signup API.");
      console.log("\nExample: Create an admin user with mobile: +919999999999, password: password123");
    }
    
    // Test login with first user if exists
    if (users.length > 0) {
      const user = users[0];
      console.log("\nTesting login with user:", {
        mobile: user.mobile,
        role: user.role,
        password: user.password ? "[HIDDEN]" : "NO_PASSWORD",
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

debug();
