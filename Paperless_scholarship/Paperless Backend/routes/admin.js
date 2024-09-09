const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Prashant@1q2w',
    database: 'paperless',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// Register administrator (SAG or Finance)
router.post('/register-admin', async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body; // Role is either 'SAG' or 'Finance'

    // Validate input fields
    if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if the administrator already exists
        const [existingUser] = await pool.query('SELECT * FROM administrators WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Administrator already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new admin into the database
        await pool.query(
            'INSERT INTO administrators (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [firstName, lastName, email, hashedPassword, role]
        );

        res.status(201).json({ message: 'Administrator registered successfully' });
    } catch (err) {
        console.error('Error while registering:', err); // Log the actual error for debugging
        res.status(500).json({
            message: 'Server error while registering administrator',
            error: err.message
        });
    }
});

// Login administrator (SAG or Finance)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Check if the admin exists
        const [user] = await pool.query('SELECT * FROM administrators WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user[0].id, role: user[0].role }, 'your_jwt_secret', { expiresIn: '1h' });

        res.status(200).json({ token, role: user[0].role });
    } catch (err) {
        console.error('Error while logging in:', err); // Log the actual error for debugging
        res.status(500).json({
            message: 'Server error while logging in',
            error: err.message
        });
    }
});

module.exports = router;
