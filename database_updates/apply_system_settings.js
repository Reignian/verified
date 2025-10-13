// fileName: apply_system_settings.js
// Script to apply system settings database updates

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Database configuration - update these values as needed
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'verified_db'
};

const connection = mysql.createConnection(dbConfig);

const sqlFile = path.join(__dirname, 'system_settings.sql');

console.log('Applying system settings database updates...');

// Read and execute SQL file
fs.readFile(sqlFile, 'utf8', (err, sql) => {
  if (err) {
    console.error('Error reading SQL file:', err);
    process.exit(1);
  }

  // Split SQL commands by semicolon and execute each
  const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
  
  let completed = 0;
  
  commands.forEach((command, index) => {
    connection.query(command.trim(), (err, results) => {
      if (err) {
        console.error(`Error executing command ${index + 1}:`, err.message);
      } else {
        console.log(`✓ Command ${index + 1} executed successfully`);
      }
      
      completed++;
      if (completed === commands.length) {
        console.log('\n✅ System settings database updates completed!');
        console.log('📧 Default reply email set to: gerby.hallasgo@gmail.com');
        console.log('⚙️  You can now configure these settings in the Admin panel');
        connection.end();
      }
    });
  });
});

connection.on('error', (err) => {
  console.error('Database connection error:', err);
  process.exit(1);
});
