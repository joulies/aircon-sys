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

const initializeDatabase = (callback) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS user_signup (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fname VARCHAR(255) NOT NULL,
      lname VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      contact VARCHAR(11) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('user','admin','employee') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      otp_code VARCHAR(6) DEFAULT NULL,
      otp_expires DATETIME DEFAULT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      brand_name VARCHAR(255) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      model_name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      num_stocks INT NOT NULL DEFAULT 0,
      image VARCHAR(255) DEFAULT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_cart_item (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES user_signup(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      appointment_id INT DEFAULT NULL,
      order_number VARCHAR(50) UNIQUE DEFAULT NULL,
      total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      installation_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      downpayment_amount DECIMAL(12, 2) DEFAULT 0.00,
      balance_due DECIMAL(12, 2) DEFAULT 0.00,
      payment_method VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      payment_status VARCHAR(50) DEFAULT 'Unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      fully_paid_date DATETIME DEFAULT NULL,
      proof_file VARCHAR(255) DEFAULT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS order_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      house VARCHAR(255) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      barangay VARCHAR(150) DEFAULT NULL,
      province VARCHAR(100) DEFAULT NULL,
      zip VARCHAR(20) DEFAULT NULL,
      room_size VARCHAR(50) DEFAULT NULL,
      capacity VARCHAR(50) DEFAULT NULL,
      property_type VARCHAR(20) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      model_name VARCHAR(255) DEFAULT NULL,
      quantity INT NOT NULL DEFAULT 1,
      price DECIMAL(12, 2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_number VARCHAR(50) UNIQUE DEFAULT NULL,
      order_id VARCHAR(100) DEFAULT NULL,
      user_id INT NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time VARCHAR(10) NOT NULL,
      assigned_employee_id INT DEFAULT NULL,
      completion_status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_datetime (user_id, appointment_date, appointment_time),
      FOREIGN KEY (user_id) REFERENCES user_signup(id) ON DELETE CASCADE,
      KEY idx_employee_date (assigned_employee_id, appointment_date)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
      is_read TINYINT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_signup(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      amount_paid DECIMAL(12, 2) NOT NULL,
      reference_number VARCHAR(255) DEFAULT NULL,
      receipt_image VARCHAR(255) DEFAULT NULL,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS refund_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      user_id INT NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      payment_method VARCHAR(50) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS technician_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS appointment_slots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      technician_id INT NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time VARCHAR(10) NOT NULL,
      is_available TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES user_signup(id) ON DELETE CASCADE,
      UNIQUE KEY unique_slot (technician_id, appointment_date, appointment_time)
    )`
  ];

  let completed = 0;
  const errors = [];

  queries.forEach((query, index) => {
    db.query(query, (err) => {
      if (err) {
        console.error(`Error executing query ${index + 1}:`, err.message);
        errors.push(err);
      } else {
        console.log(`✓ Query ${index + 1} executed successfully`);
      }

      completed++;
      if (completed === queries.length) {
        if (errors.length === 0) {
          console.log("✓ Database initialization complete");
        } else {
          console.error(`⚠ Database initialization completed with ${errors.length} error(s)`);
        }
        if (callback) callback(errors.length === 0);
      }
    });
  });
};

module.exports = initializeDatabase;
