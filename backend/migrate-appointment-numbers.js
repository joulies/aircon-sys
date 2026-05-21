const mysql = require("mysql2");

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

  // Get all appointments without appointment_number
  db.query("SELECT id, created_at FROM appointments WHERE appointment_number IS NULL", (err, appointments) => {
    if (err) {
      console.error("Error fetching appointments:", err);
      db.end();
      process.exit(1);
    }

    if (appointments.length === 0) {
      console.log("✓ All appointments already have appointment numbers!");
      db.end();
      process.exit(0);
    }

    console.log(`Found ${appointments.length} appointments to update...`);

    let updated = 0;

    appointments.forEach((apt) => {
      const date = new Date(apt.created_at);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const datePart = `${day}${month}${year}`;

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const appointmentNumber = `APMT-${datePart}-${randomPart}`;

      db.query("UPDATE appointments SET appointment_number = ? WHERE id = ?", [appointmentNumber, apt.id], (err) => {
        if (err) {
          console.error(`Error updating appointment ${apt.id}:`, err);
        } else {
          updated++;
          console.log(`Updated appointment #${apt.id} → ${appointmentNumber}`);
        }

        if (updated === appointments.length) {
          console.log(`\n✓ Successfully updated ${updated} appointments with appointment numbers!`);
          db.end();
          process.exit(0);
        }
      });
    });
  });
});
