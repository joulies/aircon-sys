const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "aircon_db",
  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const migrateAddOrderId = (callback) => {
  const query = `
    ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS order_id INT DEFAULT NULL,
    ADD FOREIGN KEY IF NOT EXISTS (order_id) REFERENCES orders(id) ON DELETE CASCADE
  `;

  db.query(query, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("✓ order_id column already exists in notifications table");
        if (callback) callback(true);
      } else if (err.code === 'ER_DUP_KEY_NAME') {
        console.log("✓ Foreign key already exists");
        if (callback) callback(true);
      } else {
        console.error("Error adding order_id column:", err.message);
        if (callback) callback(false);
      }
    } else {
      console.log("✓ Successfully added order_id column to notifications table");
      if (callback) callback(true);
    }
  });
};

module.exports = migrateAddOrderId;
