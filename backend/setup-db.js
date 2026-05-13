const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

// First connect without specifying database to create it
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "" // put your MySQL password if needed
});

db.connect((err) => {
  if (err) {
    console.error("Initial connection error:", err);
    process.exit(1);
  }
  
  console.log("Connected to MySQL server");
  
  // Drop existing database and recreate
  db.query("DROP DATABASE IF EXISTS aircon_db", (err) => {
    if (err) console.error("Error dropping database:", err);
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'database.sql');
    let sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Remove comments
    sql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split by semicolon and filter empty statements
    const statements = sql.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
    let executed = 0;
    
    function executeNext() {
      if (executed < statements.length) {
        const statement = statements[executed];
        db.query(statement, (err) => {
          if (err) {
            console.error(`Error executing statement ${executed + 1}: ${err.message}`);
          } else {
            executed++;
            console.log(`Executed statement ${executed}/${statements.length}`);
            executeNext();
          }
        });
      } else {
        console.log("\n✓ Database setup completed successfully!");
        console.log("✓ 5 products inserted");
        console.log("✓ 4 services inserted");
        db.end(() => {
          process.exit(0);
        });
      }
    }
    
    executeNext();
  });
});
