const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'aircon_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }

  console.log('Connected to database');

  // Alter the appointments table to add 'cancelled' to the completion_status enum
  const alterQuery = `
    ALTER TABLE appointments
    MODIFY completion_status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending'
  `;

  db.query(alterQuery, (err) => {
    if (err) {
      console.error('Error altering table:', err);
      db.end();
      process.exit(1);
    }

    console.log('✓ Successfully updated appointments table - added "cancelled" to completion_status enum');
    db.end();
    process.exit(0);
  });
});
