const mysql = require('mysql2/promise'); // Import promise-based MySQL2

// Create a connection pool to manage multiple connections
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Prashant@1q2w',
    database: 'lib_sys' // Replace karna hai with the original database name
});

module.exports = pool;
