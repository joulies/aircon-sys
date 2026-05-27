const mysql = require('mysql2');

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

  // Update appointments to 'cancelled' where their associated order is cancelled
  const fixQuery = `
    UPDATE appointments a
    INNER JOIN orders o ON a.order_id = o.id
    SET a.completion_status = 'cancelled'
    WHERE o.status = 'cancelled' AND a.completion_status != 'cancelled'
  `;

  db.query(fixQuery, (err, result) => {
    if (err) {
      console.error('Error fixing appointments:', err);
      db.end();
      process.exit(1);
    }

    console.log('✓ Successfully updated appointments');
    console.log(`  Rows affected: ${result.affectedRows}`);

    // Verify the fix
    db.query(
      `SELECT COUNT(*) as count FROM appointments a
       INNER JOIN orders o ON a.order_id = o.id
       WHERE o.status = 'cancelled' AND a.completion_status = 'cancelled'`,
      (err, results) => {
        if (err) {
          console.error('Error verifying:', err);
        } else {
          console.log(`✓ Verification: ${results[0].count} cancelled appointments confirmed`);
        }
        db.end();
      }
    );
  });
});
