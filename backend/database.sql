-- Create Database
CREATE DATABASE IF NOT EXISTS aircon_db;
USE aircon_db;

-- ==========================================
-- USER SIGNUP TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_signup (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fname VARCHAR(255) NOT NULL,
  lname VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contact VARCHAR(11) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin','employee') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  otp_code VARCHAR(6) DEFAULT NULL,
  otp_expires DATETIME DEFAULT NULL
);

-- ==========================================
-- PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  num_stocks INT NOT NULL DEFAULT 0,
  image VARCHAR(255) DEFAULT NULL
);

-- ==========================================
-- CART TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_item (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES user_signup(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ==========================================
-- ORDERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
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
);

-- ==========================================
-- ORDER DETAILS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS order_details (
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
);

-- ==========================================
-- ORDER ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  model_name VARCHAR(255) DEFAULT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ==========================================
-- APPOINTMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS appointments (
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
);

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
  is_read TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_signup(id) ON DELETE CASCADE
);

-- ==========================================
-- PAYMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  amount_paid DECIMAL(12, 2) NOT NULL,
  reference_number VARCHAR(255) DEFAULT NULL,
  receipt_image VARCHAR(255) DEFAULT NULL,
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ==========================================
-- REFUND REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS refund_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL
);

-- ==========================================
-- TECHNICIAN CONFIG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS technician_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- APPOINTMENT SLOTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS appointment_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  technician_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(10) NOT NULL,
  is_available TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (technician_id) REFERENCES user_signup(id) ON DELETE CASCADE,
  UNIQUE KEY unique_slot (technician_id, appointment_date, appointment_time)
);

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Insert sample users
INSERT INTO user_signup (fname, lname, email, contact, password, role) VALUES
('Admin', 'User', 'admin@example.com', '09000000000', 'hashed_password', 'admin'),
('Team', 'A', 'team.a@vaservices.com', '09165555001', 'hashed_password', 'employee'),
('Team', 'B', 'team.b@vaservices.com', '09165555002', 'hashed_password', 'employee'),
('Team', 'C', 'team.c@vaservices.com', '09165555003', 'hashed_password', 'employee'),
('Customer', 'Test', 'customer@example.com', '09222222222', 'hashed_password', 'user');

-- Insert sample products
INSERT INTO products (product_name, brand_name, model_name, price, num_stocks, image) VALUES
('Daikin DSMART QUEEN BVA', 'Daikin', 'FTKQ_CVAR/RKQ_CVA', 34999.00, 5, '1768803031_daikin1.jpg'),
('Daikin FTF35XAV1V', 'Daikin', 'FTKQ_CVAR/RKQ_CVA', 19999.00, 5, '1768803091_daikin2.png'),
('Daikin Cora', 'Daikin', 'FTXV25WVMA Y86JGI', 20500.00, 5, '1768803171_daikin3.jpg'),
('LG Dual Cool', 'LG', 'MS12AQ.FNBPF', 24999.00, 3, '1763779554_aircon-placeholder.jpg'),
('Panasonic Econavi', 'Panasonic', 'CS-WN9WKH', 28500.00, 4, '1763779554_aircon-placeholder.jpg'),
('Split Type AC Unit', 'DAIKIN', 'FTKA25AXV1A', 15000.00, 10, '1763779554_aircon-placeholder.jpg'),
('Window Type AC Unit', 'DAIKIN', 'AKRC50U', 8500.00, 15, '1763779554_aircon-placeholder.jpg'),
('Portable AC Unit', 'KOLIN', 'KFS-530EP', 12000.00, 8, '1763779554_aircon-placeholder.jpg'),
('Inverter AC Unit', 'MIDEA', 'MSMAAU-10CRN8', 18000.00, 5, '1768803230_midea1.jpg'),
('Wall Mounted AC', 'HITACHI', 'RAK-35NHA', 16000.00, 7, '1763779554_aircon-placeholder.jpg');

-- Insert technician configuration
INSERT INTO technician_config (setting_key, setting_value, description) VALUES
('max_appointments_per_day', '2', 'Maximum number of appointments per technician per day'),
('available_time_slots', '08:00,13:00', 'Available appointment time slots (comma-separated HH:MM format)'),
('default_working_days', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', 'Default working days for technicians');
