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

  db.query("SELECT id, order_number, payment_method, status, payment_status FROM orders ORDER BY id DESC LIMIT 10", (err, results) => {
    if (err) {
      console.error("Query error:", err);
    } else {
      console.log("=== ORDERS IN DATABASE ===");
      console.table(results);
    }
    db.end();
  });
});
