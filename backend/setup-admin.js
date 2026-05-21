const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Configuration
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin_123"; // Change this to your desired password

// Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "aircon_db"
});

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }

  console.log("✓ Connected to MySQL database");
  console.log(`Setting up admin account with email: ${ADMIN_EMAIL}`);

  // Hash the password
  bcrypt.hash(ADMIN_PASSWORD, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      db.end();
      process.exit(1);
    }

    // Update admin password in database
    db.query(
      "UPDATE user_signup SET password = ? WHERE email = ? AND role = 'admin'",
      [hashedPassword, ADMIN_EMAIL],
      (err, result) => {
        if (err) {
          console.error("Error updating admin password:", err);
          db.end();
          process.exit(1);
        }

        if (result.affectedRows === 0) {
          console.error("✗ Admin user not found. Please run setup-db.js first.");
          db.end();
          process.exit(1);
        }

        console.log("✓ Admin password updated successfully!");
        console.log(`\n📋 Admin Login Credentials:`);
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log(`\n✓ Admin can now login without OTP verification`);

        db.end(() => {
          process.exit(0);
        });
      }
    );
  });
});
