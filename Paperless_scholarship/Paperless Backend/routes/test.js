// Import the required modules
const express = require('express');
const mysql = require('mysql2');
const port = 3000;


// Initialize the Express app
const app = express();
app.use(express.json());
// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',     
  port:3306, 
  user: 'root',
  password: 'Prashant@1q2w', 
  database: 'lib_sys'  
});

// Route to test database connection
app.get('/test-db', (req, res) => {
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database: ' + err.stack);
      return res.status(500).json({ message: 'Database connection failed', error: err });
    }
    console.log('Connected to the database');
    res.json({ message: 'Successfully connected to the database' });

    // Close the connection
    connection.end();
  });
});

// Start the server on port 4000 (or whatever port you want)

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
