const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const JWT_SECRET = "your_jwt_secret_key_change_in_production";

// Configure Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "your-email@gmail.com",
    pass: process.env.GMAIL_PASSWORD || "your-app-password"
  }
});

// Test email connection
transporter.verify((err, success) => {
  if (err) {
    console.warn("⚠ Email service not configured. OTP emails will not be sent. Set GMAIL_USER and GMAIL_PASSWORD in .env");
  } else {
    console.log("✓ Email service configured successfully");
  }
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // put your MySQL password if needed
  database: "aircon_db"
});

// Test DB
db.connect(err => {
  if (err) {
    console.error("MySQL Connection Error:", err.message);
    process.exit(1);
  }
  console.log("✓ Connected to MySQL database");
});

// ==========================================
// MIDDLEWARE
// ==========================================

// Middleware to authenticate token and extract userId
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// SIGNUP
app.post("/auth/signup", async (req, res) => {
  const { fname, lname, email, contact, password } = req.body;

  if (!fname || !lname || !email || !contact || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Check if email already exists
  db.query("SELECT id FROM user_signup WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = "INSERT INTO user_signup (fname, lname, email, contact, password) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [fname, lname, email, contact, hashedPassword], (err, result) => {
      if (err) {
        console.error("Error during signup:", err);
        return res.status(500).json({ success: false, message: "Failed to create account" });
      }

      // Create JWT token
      const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        success: true,
        message: "Account created successfully",
        token,
        user: {
          id: result.insertId,
          fname,
          lname,
          email,
          contact
        }
      });
    });
  });
});

// LOGIN
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }

  db.query("SELECT * FROM user_signup WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const user = results[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        contact: user.contact,
        role: user.role
      }
    });
  });
});

// VERIFY TOKEN
app.post("/auth/verify", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// REQUEST OTP
app.post("/auth/request-otp", (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ success: false, message: "User ID and email required" });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP to database
  db.query(
    "UPDATE user_signup SET otp_code = ?, otp_expires = ? WHERE id = ?",
    [otp, expiresAt, userId],
    async (err) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Failed to generate OTP" });
      }

      // Send OTP via email
      const mailOptions = {
        from: process.env.GMAIL_USER || "your-email@gmail.com",
        to: email,
        subject: "Your OTP Verification Code",
        html: `
          <h2>Email Verification</h2>
          <p>Your OTP verification code is:</p>
          <h1 style="color: #1e90ff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Email sending error:", err);
          return res.status(500).json({ success: false, message: "Failed to send OTP email" });
        }

        res.json({
          success: true,
          message: "OTP sent to your email",
          expiresIn: 600
        });
      });
    }
  );
});

// VERIFY OTP
app.post("/auth/verify-otp", (req, res) => {
  const { userId, email, otp } = req.body;

  if (!userId || !email || !otp) {
    return res.status(400).json({ success: false, message: "User ID, email, and OTP required" });
  }

  db.query(
    "SELECT id, fname, lname, email, contact, role, otp_code, otp_expires FROM user_signup WHERE id = ? AND email = ?",
    [userId, email],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(400).json({ success: false, message: "User not found" });
      }

      const user = results[0];
      const now = new Date();

      // Check if OTP expired
      if (!user.otp_code || new Date(user.otp_expires) < now) {
        return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
      }

      // Check if OTP matches
      if (user.otp_code !== otp) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      // Clear OTP from database
      db.query(
        "UPDATE user_signup SET otp_code = NULL, otp_expires = NULL WHERE id = ?",
        [userId],
        (err) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Failed to verify OTP" });
          }

          // Generate final JWT token
          const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });

          res.json({
            success: true,
            message: "OTP verified successfully",
            token,
            user: {
              id: user.id,
              fname: user.fname,
              lname: user.lname,
              email: user.email,
              contact: user.contact,
              role: user.role
            }
          });
        }
      );
    }
  );
});

// ==========================================
// PRODUCTS ENDPOINTS
// ==========================================

// GET all products
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
    res.json(results);
  });
});

// GET product by ID
app.get("/products/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error fetching product:", err);
      return res.status(500).json({ error: "Failed to fetch product" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(results[0]);
  });
});

// CREATE product (Admin)
app.post("/products", upload.single('image'), (req, res) => {
  const { product_name, brand_name, model_name, price, num_stocks } = req.body;
  
  if (!product_name || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Use uploaded filename if available, otherwise use default
  const imageName = req.file ? req.file.filename : 'default.jpg';

  const query = "INSERT INTO products (product_name, brand_name, model_name, price, num_stocks, image) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(query, [product_name, brand_name, model_name, price, num_stocks || 0, imageName], (err, result) => {
    if (err) {
      console.error("Error creating product:", err);
      return res.status(500).json({ error: "Failed to create product" });
    }
    res.json({ 
      success: true,
      id: result.insertId, 
      product_name, 
      brand_name, 
      model_name, 
      price, 
      num_stocks,
      image: imageName
    });
  });
});

// UPDATE product
app.put("/products/:id", upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { product_name, brand_name, model_name, price, num_stocks } = req.body;
  
  // If new image uploaded, use it; otherwise keep the existing one
  if (req.file) {
    const query = "UPDATE products SET product_name=?, brand_name=?, model_name=?, price=?, num_stocks=?, image=? WHERE id=?";
    db.query(query, [product_name, brand_name, model_name, price, num_stocks, req.file.filename, id], (err) => {
      if (err) {
        console.error("Error updating product:", err);
        return res.status(500).json({ error: "Failed to update product" });
      }
      res.json({ success: true, message: "Product updated" });
    });
  } else {
    const query = "UPDATE products SET product_name=?, brand_name=?, model_name=?, price=?, num_stocks=? WHERE id=?";
    db.query(query, [product_name, brand_name, model_name, price, num_stocks, id], (err) => {
      if (err) {
        console.error("Error updating product:", err);
        return res.status(500).json({ error: "Failed to update product" });
      }
      res.json({ success: true, message: "Product updated" });
    });
  }
});

// DELETE product
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE id=?", [id], (err) => {
    if (err) {
      console.error("Error deleting product:", err);
      return res.status(500).json({ error: "Failed to delete product" });
    }
    res.json({ success: true, message: "Product deleted" });
  });
});

// ==========================================
// CART ENDPOINTS
// ==========================================

// GET cart count
app.get("/cart/count", authenticateToken, (req, res) => {
  // For now, return 0 - would need user session to be fully implemented
  const userId = req.userId;
  db.query("SELECT SUM(quantity) as total FROM cart WHERE user_id = ?", [userId], (err, results) => {
    if (err) {
      console.error("Error getting cart count:", err);
      return res.json({ total: 0 });
    }
    res.json({ total: results[0]?.total || 0 });
  });
});

// ADD to cart
app.post("/cart/add", authenticateToken, (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.userId;

  console.log(`[CART ADD] User ${userId} adding ${quantity} of product ${product_id}`);

  if (!product_id || !quantity) {
    return res.status(400).json({ success: false, message: "Missing product_id or quantity" });
  }

  if (quantity <= 0) {
    return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
  }

  // Check if product exists and has stock
  db.query("SELECT id, num_stocks FROM products WHERE id = ?", [product_id], (err, results) => {
    if (err) {
      console.error('[CART ADD] Database error:', err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const availableStock = results[0].num_stocks;
    console.log(`[CART ADD] Product ${product_id} has ${availableStock} in stock`);

    // Check if item already in cart
    db.query("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?", [userId, product_id], (err, cartItems) => {
      if (err) {
        console.error('[CART ADD] Database error checking cart:', err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      const currentQtyInCart = cartItems.length > 0 ? cartItems[0].quantity : 0;
      const totalQuantity = currentQtyInCart + quantity;
      
      console.log(`[CART ADD] Current in cart: ${currentQtyInCart}, Adding: ${quantity}, Total would be: ${totalQuantity}`);

      // Check if total quantity exceeds available stock
      if (totalQuantity > availableStock) {
        console.log(`[CART ADD] REJECTED - Total ${totalQuantity} exceeds stock ${availableStock}`);
        return res.status(400).json({ 
          success: false, 
          message: `Cannot add ${quantity} items. Stock available: ${availableStock}, Currently in cart: ${currentQtyInCart}. Maximum you can add: ${Math.max(0, availableStock - currentQtyInCart)}` 
        });
      }

      if (cartItems.length > 0) {
        // Update quantity
        console.log(`[CART ADD] Updating cart item: ${cartItems[0].id} to quantity ${totalQuantity}`);
        db.query("UPDATE cart SET quantity = ? WHERE id = ?", [totalQuantity, cartItems[0].id], (err) => {
          if (err) {
            console.error('[CART ADD] Error updating cart:', err);
            return res.status(500).json({ success: false, message: "Failed to update cart" });
          }
          console.log(`[CART ADD] SUCCESS - Cart updated`);
          res.json({ success: true, message: "Added to cart" });
        });
      } else {
        // Insert new cart item
        console.log(`[CART ADD] Inserting new cart item with quantity ${quantity}`);
        db.query("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)", [userId, product_id, quantity], (err) => {
          if (err) {
            console.error('[CART ADD] Error adding to cart:', err);
            return res.status(500).json({ success: false, message: "Failed to add to cart" });
          }
          console.log(`[CART ADD] SUCCESS - New item added to cart`);
          res.json({ success: true, message: "Added to cart" });
        });
      }
    });
  });
});

// GET cart items
app.get("/cart", authenticateToken, (req, res) => {
  const userId = req.userId;
  db.query(
    `SELECT c.id, c.product_id, c.quantity, p.product_name, p.brand_name, p.model_name, p.price, p.image, p.num_stocks
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error fetching cart:", err);
        return res.json({ items: [] });
      }
      res.json({ items: results });
    }
  );
});

// UPDATE cart item quantity
app.put("/cart/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  console.log(`[CART UPDATE] Cart ID ${id}: requested quantity ${quantity}`);

  if (!quantity || quantity <= 0) {
    console.log(`[CART UPDATE] Invalid quantity: ${quantity}`);
    return res.status(400).json({ success: false, message: "Invalid quantity" });
  }

  // Get the cart item to find the product
  db.query("SELECT product_id FROM cart WHERE id = ?", [id], (err, cartResults) => {
    if (err || cartResults.length === 0) {
      console.log(`[CART UPDATE] Cart item not found`);
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    const productId = cartResults[0].product_id;
    console.log(`[CART UPDATE] Product ID: ${productId}`);

    // Check available stock for the product
    db.query("SELECT num_stocks FROM products WHERE id = ?", [productId], (err, productResults) => {
      if (err || productResults.length === 0) {
        console.log(`[CART UPDATE] Product not found`);
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      const availableStock = productResults[0].num_stocks;
      console.log(`[CART UPDATE] Available stock: ${availableStock}, Requested: ${quantity}`);

      // Check if requested quantity exceeds available stock
      if (quantity > availableStock) {
        console.log(`[CART UPDATE] REJECTED - Quantity ${quantity} exceeds stock ${availableStock}`);
        return res.status(400).json({ 
          success: false, 
          message: `Only ${availableStock} item(s) available in stock. Cannot update quantity to ${quantity}.` 
        });
      }

      console.log(`[CART UPDATE] Updating cart item to quantity ${quantity}`);
      // Update cart with validated quantity
      db.query("UPDATE cart SET quantity = ? WHERE id = ?", [quantity, id], (err) => {
        if (err) {
          console.error("[CART UPDATE] Error updating cart:", err);
          return res.status(500).json({ success: false, message: "Failed to update cart" });
        }
        console.log(`[CART UPDATE] SUCCESS - Updated to quantity ${quantity}`);
        res.json({ success: true, message: "Cart updated" });
      });
    });
  });
});

// DELETE cart item
app.delete("/cart/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM cart WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Error deleting cart item:", err);
      return res.status(500).json({ success: false, message: "Failed to remove item" });
    }
    res.json({ success: true, message: "Item removed from cart" });
  });
});

// ==========================================
// APPOINTMENTS ENDPOINTS
// ==========================================

// CREATE appointment
app.post("/appointments", authenticateToken, (req, res) => {
  const { appointment_date, appointment_time } = req.body;
  const userId = req.userId;

  console.log(`[APPOINTMENT] Creating appointment for user ${userId}: ${appointment_date} ${appointment_time}`);

  if (!appointment_date || !appointment_time) {
    return res.status(400).json({ success: false, message: "Missing appointment_date or appointment_time" });
  }

  // Validate cart before creating appointment
  db.query(
    `SELECT c.id, c.product_id, c.quantity, p.num_stocks
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [userId],
    (err, cartItems) => {
      if (err) {
        console.error('[APPOINTMENT] Error checking cart:', err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      // Check if any items exceed stock
      const invalidItems = cartItems.filter(item => item.quantity > item.num_stocks);
      if (invalidItems.length > 0) {
        const errorMsg = `Cannot create appointment. Cart contains items that exceed available stock: ${invalidItems
          .map(item => `Product ${item.product_id}: ${item.quantity} requested but only ${item.num_stocks} available`)
          .join('; ')}`;
        console.warn('[APPOINTMENT] Appointment blocked - cart exceeds stock:', invalidItems);
        return res.status(400).json({ success: false, message: errorMsg });
      }

      if (cartItems.length === 0) {
        console.warn('[APPOINTMENT] Appointment blocked - cart is empty');
        return res.status(400).json({ success: false, message: "Cannot create appointment. Your cart is empty." });
      }

      console.log(`[APPOINTMENT] Cart validation passed. Creating appointment...`);
      db.query(
        "INSERT INTO appointments (user_id, appointment_date, appointment_time) VALUES (?, ?, ?)",
        [userId, appointment_date, appointment_time],
        (err, result) => {
          if (err) {
            console.error('[APPOINTMENT] Error creating appointment:', err);
            return res.status(500).json({ success: false, message: "Failed to create appointment" });
          }
          console.log(`[APPOINTMENT] Appointment created successfully with ID ${result.insertId}`);
          res.json({ success: true, id: result.insertId, appointment_date, appointment_time });
        }
      );
    }
  );
});

// GET appointments for user
app.get("/appointments", authenticateToken, (req, res) => {
  const userId = req.userId;
  db.query("SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC", [userId], (err, results) => {
    if (err) {
      console.error("Error fetching appointments:", err);
      return res.json({ appointments: [] });
    }
    res.json({ appointments: results });
  });
});

// ASSIGN EMPLOYEE TO APPOINTMENT (ADMIN)
app.put("/appointments/:id/assign", (req, res) => {
  const appointmentId = req.params.id;
  const { assigned_to } = req.body;

  if (!assigned_to) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  db.query(
    "UPDATE appointments SET assigned_employee_id = ? WHERE id = ?",
    [assigned_to, appointmentId],
    (err, result) => {
      if (err) {
        console.error("Error assigning employee:", err);
        return res.status(500).json({ error: "Failed to assign employee" });
      }

      res.json({ 
        success: true, 
        message: "Employee assigned successfully",
        appointmentId: appointmentId,
        assigned_to: assigned_to
      });
    }
  );
});

// ==========================================
// ORDERS ENDPOINTS
// ==========================================

// CREATE order (from checkout)
app.post("/checkout", authenticateToken, upload.single('receipt_file'), (req, res) => {
  const userId = req.userId;
  const { room_size, capacity, property_type, house, province, city, barangay, zip, payment_method } = req.body;

  if (!payment_method) {
    return res.status(400).json({ success: false, message: "Missing payment method" });
  }

  // Get cart items and calculate total
  db.query(
    `SELECT c.product_id, c.quantity, p.price, p.product_name, p.model_name FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [userId],
    (err, cartItems) => {
      if (err || cartItems.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }

      let subtotal = 0;
      cartItems.forEach(item => {
        subtotal += item.price * item.quantity;
      });

      const installationFee = 500; // Fixed fee
      const totalAmount = subtotal + installationFee;

      // Determine payment status based on payment method
      const paymentStatus = payment_method === 'cod' ? 'Unpaid' : 'Paid';

      // Create order with new schema
      db.query(
        "INSERT INTO orders (user_id, total_amount, installation_fee, payment_method, status, payment_status) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, subtotal, installationFee, payment_method, 'Pending', paymentStatus],
        (err, orderResult) => {
          if (err) {
            console.error("Error creating order:", err);
            return res.status(500).json({ success: false, message: "Failed to create order" });
          }

          const orderId = orderResult.insertId;

          // Add order items
          const orderItemsPromises = cartItems.map(item => {
            return new Promise((resolve) => {
              db.query(
                "INSERT INTO order_items (order_id, product_id, product_name, model_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)",
                [orderId, item.product_id, item.product_name, item.model_name, item.quantity, item.price],
                (err) => {
                  resolve();
                }
              );
            });
          });

          Promise.all(orderItemsPromises).then(() => {
            // Insert order details
            db.query(
              "INSERT INTO order_details (order_id, house, city, barangay, province, zip, room_size, capacity, property_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [orderId, house, city, barangay, province, zip, room_size, capacity, property_type],
              (err) => {
                if (err) console.error("Error saving order details:", err);
              }
            );

            // Update product stocks
            cartItems.forEach(item => {
              db.query(
                "UPDATE products SET num_stocks = num_stocks - ? WHERE id = ?",
                [item.quantity, item.product_id],
                (err) => {
                  if (err) console.error("Error updating stock:", err);
                }
              );
            });

            // Clear cart
            db.query("DELETE FROM cart WHERE user_id = ?", [userId], (err) => {
              if (err) console.error("Error clearing cart:", err);

              // Add notification
              const message = payment_method === 'cod' ? 'Order placed successfully! Awaiting payment.' : 'Order placed and paid successfully!';
              db.query(
                "INSERT INTO notifications (user_id, message, notification_type) VALUES (?, ?, ?)",
                [userId, message, 'success'],
                (err) => {
                  if (err) console.error("Error creating notification:", err);
                }
              );

              res.json({
                success: true,
                orderId,
                totalAmount,
                paymentStatus,
                message: "Order created successfully"
              });
            });
          });
        }
      );
    }
  );
});

// GET all orders for user
app.get("/orders", authenticateToken, (req, res) => {
  const userId = req.userId;
  db.query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error fetching orders:", err);
        return res.json({ orders: [] });
      }
      res.json({ orders: results });
    }
  );
});

// GET order details
app.get("/orders/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  db.query(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?",
    [id, userId],
    (err, orders) => {
      if (err || orders.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orders[0];

      // Get order items
      db.query(
        `SELECT oi.*, p.product_name, p.brand_name, p.model_name, p.image 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: "Failed to fetch order items" });
          }

          // Get appointment if exists
          db.query(
            "SELECT * FROM appointments WHERE order_id = ? LIMIT 1",
            [id],
            (err, appointments) => {
              if (err) {
                appointments = null;
              }

              res.json({
                order: {
                  ...order,
                  items: items,
                  appointment: appointments ? appointments[0] : null
                }
              });
            }
          );
        }
      );
    }
  );
});

// CANCEL order
app.post("/orders/:id/cancel", authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  // Check if order exists and belongs to user
  db.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, userId], (err, orders) => {
    if (err || orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orders[0];

    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: "Only pending orders can be cancelled" });
    }

    // Get order items to restore stock
    db.query("SELECT * FROM order_items WHERE order_id = ?", [id], (err, items) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch order items" });
      }

      // Restore stock for each item
      items.forEach(item => {
        db.query(
          "UPDATE products SET num_stocks = num_stocks + ? WHERE id = ?",
          [item.quantity, item.product_id],
          (err) => {
            if (err) console.error("Error restoring stock:", err);
          }
        );
      });

      // Update order status
      db.query("UPDATE orders SET status = ? WHERE id = ?", ['cancelled', id], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Failed to cancel order" });
        }

        // Add notification
        db.query(
          "INSERT INTO notifications (user_id, message, notification_type) VALUES (?, ?, ?)",
          [userId, 'Order cancelled successfully. Amount refunded.', 'cancellation'],
          (err) => {
            if (err) console.error("Error creating notification:", err);
          }
        );

        res.json({ success: true, message: "Order cancelled and stock restored" });
      });
    });
  });
});

// REQUEST REFUND
app.post("/orders/:id/refund", authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const { reason } = req.body;

  // Check if order exists
  db.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, userId], (err, orders) => {
    if (err || orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orders[0];

    // Only accept refunds for online payments
    if (order.payment_method === 'cod') {
      return res.status(400).json({ success: false, message: "Refunds not available for COD orders" });
    }

    // Only pending payment orders
    if (order.payment_status !== 'completed') {
      return res.status(400).json({ success: false, message: "Cannot refund this order" });
    }

    // Update order status to refund_requested
    db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      ['refund_requested', id],
      (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Failed to process refund request" });
        }

        // Add notification
        db.query(
          "INSERT INTO notifications (user_id, message, notification_type) VALUES (?, ?, ?)",
          [userId, `Refund request submitted. We'll process it within 3-5 business days.`, 'refund_request'],
          (err) => {
            if (err) console.error("Error creating notification:", err);
          }
        );

        res.json({
          success: true,
          message: "Refund request submitted successfully. You'll be refunded within 3-5 business days."
        });
      }
    );
  });
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET all users (admin)
app.get("/admin/users", (req, res) => {
  db.query("SELECT id, fname, lname, email, contact, created_at FROM user_signup ORDER BY created_at DESC", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(results);
  });
});

// GET all products (admin)
app.get("/admin/products", (req, res) => {
  db.query("SELECT * FROM products ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
    res.json(results);
  });
});

// GET all orders (admin)
app.get("/admin/orders", (req, res) => {
  db.query(
    `SELECT o.id, o.user_id, o.total_amount, o.installation_fee, o.payment_method, o.status, o.payment_status, o.created_at,
            u.fname, u.lname, u.email
     FROM orders o
     JOIN user_signup u ON o.user_id = u.id
     ORDER BY o.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching orders:", err);
        return res.status(500).json({ error: "Failed to fetch orders" });
      }
      res.json(results);
    }
  );
});

// GET all appointments (admin)
app.get("/admin/appointments", (req, res) => {
  db.query(
    `SELECT a.id, a.user_id, a.appointment_date, a.appointment_time, a.created_at,
            u.fname, u.lname, u.email, u.contact
     FROM appointments a
     JOIN user_signup u ON a.user_id = u.id
     ORDER BY a.appointment_date DESC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching appointments:", err);
        return res.status(500).json({ error: "Failed to fetch appointments" });
      }
      res.json(results);
    }
  );
});

// GET dashboard stats (admin)
app.get("/admin/stats", (req, res) => {
  // Total Orders
  db.query("SELECT COUNT(*) as count FROM orders", (err, orderCount) => {
    // Total Earnings (Paid orders only)
    db.query("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE payment_status = 'Paid' AND status = 'Completed'", (err, revenue) => {
      // Pending Appointments
      db.query("SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= CURDATE()", (err, appointmentCount) => {
        // Pending Refunds
        db.query("SELECT COUNT(*) as count FROM refund_requests WHERE status = 'Pending'", (err, pendingRefunds) => {
          const stats = {
            totalOrders: orderCount?.[0]?.count || 0,
            totalEarnings: revenue?.[0]?.revenue || 0,
            pendingAppointments: appointmentCount?.[0]?.count || 0,
            pendingRefunds: pendingRefunds?.[0]?.count || 0
          };
          res.json(stats);
        });
      });
    });
  });
});

// GET low stock products (admin)
app.get("/admin/low-stock-products", (req, res) => {
  db.query("SELECT id, product_name, num_stocks FROM products WHERE num_stocks <= 3 ORDER BY num_stocks ASC", (err, results) => {
    if (err) {
      console.error("Error fetching low stock products:", err);
      return res.status(500).json({ error: "Failed to fetch low stock products" });
    }
    res.json(results);
  });
});

// GET pending refund requests (admin)
app.get("/admin/refund-requests", (req, res) => {
  db.query(
    `SELECT r.id, r.order_id, r.amount, r.reason, r.status, r.created_at, u.fname, u.lname
     FROM refund_requests r
     JOIN user_signup u ON r.user_id = u.id
     ORDER BY r.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching refund requests:", err);
        return res.status(500).json({ error: "Failed to fetch refund requests" });
      }
      res.json(results);
    }
  );
});

// GET order analytics (admin)
app.get("/admin/order-analytics", (req, res) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Orders this month
  db.query(
    `SELECT COUNT(*) as count FROM orders 
     WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?`,
    [currentMonth, currentYear],
    (err, ordersThisMonth) => {
      // Revenue this month
      db.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
         WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND payment_status = 'Paid'`,
        [currentMonth, currentYear],
        (err, revenueThisMonth) => {
          // Average order value
          db.query(
            `SELECT COALESCE(AVG(total_amount), 0) as average FROM orders 
             WHERE payment_status = 'Paid'`,
            (err, avgOrderValue) => {
              // Completion rate
              db.query(
                `SELECT 
                  COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
                  COUNT(*) as total
                 FROM orders`,
                (err, completionData) => {
                  const completed = completionData?.[0]?.completed || 0;
                  const total = completionData?.[0]?.total || 0;
                  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

                  const analytics = {
                    totalOrdersThisMonth: ordersThisMonth?.[0]?.count || 0,
                    totalRevenueThisMonth: revenueThisMonth?.[0]?.total || 0,
                    averageOrderValue: Math.round(avgOrderValue?.[0]?.average || 0),
                    completionRate: completionRate
                  };
                  res.json(analytics);
                }
              );
            }
          );
        }
      );
    }
  );
});

// GET employees (admin)
app.get("/admin/employees", (req, res) => {
  db.query(
    `SELECT id, fname, lname, email, contact, password, 'Employee' as position, created_at 
     FROM user_signup 
     WHERE role = 'employee' 
     ORDER BY created_at ASC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching employees:", err);
        return res.status(500).json({ error: "Failed to fetch employees" });
      }
      res.json(results);
    }
  );
});

// Add new employee
app.post("/admin/add-employee", (req, res) => {
  const { fname, lname, email, contact, password } = req.body;

  // Validation
  if (!fname || !lname || !email || !contact || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Check if email already exists
  db.query(
    "SELECT id FROM user_signup WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("Error checking email:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: "Email already exists" });
      }

      // Insert new employee
      db.query(
        "INSERT INTO user_signup (fname, lname, email, contact, password, role) VALUES (?, ?, ?, ?, ?, 'employee')",
        [fname, lname, email, contact, password],
        (err, result) => {
          if (err) {
            console.error("Error adding employee:", err);
            return res.status(500).json({ error: "Failed to add employee" });
          }

          // Return the newly created employee
          const newEmployee = {
            id: result.insertId,
            fname,
            lname,
            email,
            contact,
            password,
            position: "Employee",
            created_at: new Date().toISOString()
          };

          res.status(201).json({ 
            success: true,
            message: "Employee added successfully",
            employee: newEmployee
          });
        }
      );
    }
  );
});

// Start server
app.listen(5000, () => {
  console.log("✓ Backend server running on port 5000");
  console.log("✓ API endpoints ready");
});