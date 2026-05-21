const mysql = require("mysql2");
const crypto = require("crypto");

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

  console.log("Connected to MySQL database");

  // Get all orders without order_number
  db.query("SELECT id, created_at FROM orders WHERE order_number IS NULL", (err, orders) => {
    if (err) {
      console.error("Error fetching orders:", err);
      db.end();
      process.exit(1);
    }

    if (orders.length === 0) {
      console.log("✓ All orders already have order numbers!");
      db.end();
      process.exit(0);
    }

    console.log(`Found ${orders.length} orders to update...`);

    let updated = 0;

    orders.forEach((order) => {
      const date = new Date(order.created_at);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const datePart = `${day}${month}${year}`;

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const orderNumber = `ORD-${datePart}-${randomPart}`;

      db.query("UPDATE orders SET order_number = ? WHERE id = ?", [orderNumber, order.id], (err) => {
        if (err) {
          console.error(`Error updating order ${order.id}:`, err);
        } else {
          updated++;
          console.log(`Updated order #${order.id} → ${orderNumber}`);
        }

        if (updated === orders.length) {
          console.log(`\n✓ Successfully updated ${updated} orders with order numbers!`);
          db.end();
          process.exit(0);
        }
      });
    });
  });
});
