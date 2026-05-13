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
  console.log('✓ Connected to MySQL database');

  // First, delete the old technician entry if it exists
  db.query("DELETE FROM user_signup WHERE fname='Technician' AND lname='One'", (err, result) => {
    if (err) {
      console.error('Error deleting old employee:', err);
      db.end();
      process.exit(1);
    }
    console.log('✓ Cleaned up old employee records');

    // Insert the three new team employees
    const employees = [
      { fname: 'Team', lname: 'A', email: 'team.a@vaservices.com', contact: '09165555001' },
      { fname: 'Team', lname: 'B', email: 'team.b@vaservices.com', contact: '09165555002' },
      { fname: 'Team', lname: 'C', email: 'team.c@vaservices.com', contact: '09165555003' }
    ];

    const insertQuery = "INSERT INTO user_signup (fname, lname, email, contact, password, role) VALUES ?";
    const values = employees.map(emp => [emp.fname, emp.lname, emp.email, emp.contact, 'hashed_password', 'employee']);

    db.query(insertQuery, [values], (err, result) => {
      if (err) {
        console.error('Error inserting employees:', err);
        db.end();
        process.exit(1);
      }
      console.log('✓ Successfully added 3 employees: Team A, Team B, Team C');
      console.log(`  Rows affected: ${result.affectedRows}`);
      
      // Verify the employees were added
      db.query("SELECT id, fname, lname, email, contact, role FROM user_signup WHERE role='employee'", (err, results) => {
        if (err) {
          console.error('Error verifying employees:', err);
        } else {
          console.log('\n✓ Current employees in database:');
          results.forEach(emp => {
            console.log(`  #${emp.id} - ${emp.fname} ${emp.lname} (${emp.email})`);
          });
        }
        db.end();
        process.exit(0);
      });
    });
  });
});
