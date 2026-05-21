const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

// Create connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "aircon_db"
});

db.connect(err => {
  if (err) {
    console.error("MySQL Connection Error:", err.message);
    process.exit(1);
  }
  console.log("✓ Connected to MySQL database");

  // Generate password hash
  const plainPassword = "admin123"; // Change this to your desired password
  const saltRounds = 10;

  bcrypt.hash(plainPassword, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      process.exit(1);
    }

    console.log(`\n✓ Password hashed successfully`);
    console.log(`Plain password: ${plainPassword}`);
    console.log(`Hashed password: ${hashedPassword}\n`);

    // Update admin user with hashed password
    db.query(
      "UPDATE user_signup SET password = ? WHERE email = ? AND role = 'admin'",
      [hashedPassword, 'admin@example.com'],
      (err, result) => {
        if (err) {
          console.error("Error updating password:", err);
          db.end();
          process.exit(1);
        }

        if (result.affectedRows > 0) {
          console.log("✓ Admin password updated successfully!");
          console.log(`\nAdmin Login Credentials:`);
          console.log(`Email: admin@example.com`);
          console.log(`Password: ${plainPassword}\n`);
        } else {
          console.log("⚠ No admin user found to update");
        }

        db.end();
      }
    );
  });
});
