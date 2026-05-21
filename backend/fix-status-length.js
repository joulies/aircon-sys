const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "aircon_db"
});

db.connect(err => {
  if (err) {
    console.error("Connection error:", err.message);
    process.exit(1);
  }

  // Step 1: Alter column to VARCHAR(50)
  console.log("Step 1: Expanding status column from VARCHAR(30) to VARCHAR(50)...");
  db.query("ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Pending'", (err) => {
    if (err) {
      console.error("Error altering column:", err);
      db.end();
      process.exit(1);
    }
    console.log("✓ Column expanded successfully");

    // Step 2: Fix truncated status values
    console.log("\nStep 2: Fixing truncated status values...");
    db.query(
      "UPDATE orders SET status = 'Half Paid - Awaiting Confirmation' WHERE status = 'Half Paid - Awaiting Confirmat'",
      (err, results) => {
        if (err) {
          console.error("Error updating statuses:", err);
        } else {
          console.log(`✓ Updated ${results.affectedRows} rows`);
        }

        // Step 3: Verify the fix
        console.log("\nStep 3: Verifying the fix...");
        db.query("SELECT id, order_number, payment_method, status FROM orders WHERE status = 'Half Paid - Awaiting Confirmation'", (err, results) => {
          if (err) {
            console.error("Error verifying:", err);
          } else {
            console.log(`✓ Found ${results.length} orders with correct status:`);
            console.table(results);
          }
          db.end();
        });
      }
    );
  });
});
