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

async function testLogin() {
  try {
    console.log("Testing login flow...\n");
    
    // Test different mobile formats
    const testCases = [
      { mobile: "6303012453", password: "Admin.123", description: "Plain 10 digits" },
      { mobile: "+916303012453", password: "Admin.123", description: "With +91 prefix" },
    ];

    for (const testCase of testCases) {
      console.log(`\n--- Test: ${testCase.description} ---`);
      console.log(`Mobile: ${testCase.mobile}`);
      
      const [users] = await pool.query(
        "SELECT mobile, password, role FROM users WHERE mobile = ?",
        [testCase.mobile]
      );

      if (users.length === 0) {
        console.log("❌ User not found");
      } else {
        const user = users[0];
        console.log(`✓ User found: ${user.mobile} (${user.role})`);
        
        if (user.password === testCase.password) {
          console.log(`✓ Password matches`);
        } else {
          console.log(`❌ Password mismatch`);
          console.log(`  Expected: "${testCase.password}"`);
          console.log(`  DB has: "${user.password}"`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

testLogin();
