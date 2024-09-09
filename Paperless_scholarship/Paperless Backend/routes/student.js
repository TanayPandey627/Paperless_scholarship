const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Multer setup for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); // Directory where files will be stored
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Naming the file
    }
});

const upload = multer({ storage: storage });

// Creating a MySQL connection
const pool = mysql.createPool({
    host: 'localhost',
    port:3306,
    user: 'root',
    password: 'Prashant@1q2w',
    database: 'paperless',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// JWT Secret Key
const JWT_SECRET = 'your_jwt_secret_key';

// Registration route
router.post('/register', async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if email already exists
        const [rows] = await pool.query('SELECT * FROM students WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new student into the database
        await pool.query('INSERT INTO students (firstname, lastname, email, password) VALUES (?, ?, ?, ?)', 
            [firstname, lastname, email, hashedPassword]);

        res.status(201).json({ message: 'Registration successful!' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.', error: err });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find the user by email
        const [rows] = await pool.query('SELECT * FROM students WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful!', token });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.', error: err });
    }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ message: 'No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token.' });

        req.user = user;
        next();
    });
};

// Query to get all students (requires authentication)
router.get('/all-students', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM students');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving students', error: err });
    }
});

// Query to get student by ID (requires authentication)
router.get('/:id', authenticateToken, async (req, res) => {
    const studentId = req.params.id;
    try {
        const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving student data', error: err });
    }
});

// Logic to add a new student with file upload (requires authentication)
router.post('/add-student', authenticateToken, upload.single('file'), async (req, res) => {
    const { name, email, scholarship } = req.body;
    const filePath = req.file ? req.file.path : null;

    try {
        const [result] = await pool.query(
            'INSERT INTO students (name, email, scholarship, file_path) VALUES (?, ?, ?, ?)',
            [name, email, scholarship, filePath]
        );
        res.status(201).json({ message: 'Student added successfully', id: result.insertId, filePath });
    } catch (err) {
        res.status(500).json({ message: 'Error adding student', error: err });
    }
});

// Logic to update student information (excluding file for now) (requires authentication)
router.put('/:id', authenticateToken, async (req, res) => {
    const studentId = req.params.id;
    const { name, email, scholarship } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE students SET name = ?, email = ?, scholarship = ? WHERE id = ?',
            [name, email, scholarship, studentId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'Student updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating student', error: err });
    }
});

// Logic to update student file (requires authentication)
router.put('/upload-file/:id', authenticateToken, upload.single('file'), async (req, res) => {
    const studentId = req.params.id;
    const filePath = req.file ? req.file.path : null;

    try {
        const [result] = await pool.query(
            'UPDATE students SET file_path = ? WHERE id = ?',
            [filePath, studentId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'File uploaded and student record updated successfully', filePath });
    } catch (err) {
        res.status(500).json({ message: 'Error uploading file', error: err });
    }
});

// Delete a student (requires authentication)
router.delete('/:id', authenticateToken, async (req, res) => {
    const studentId = req.params.id;
    try {
        const [result] = await pool.query('DELETE FROM students WHERE id = ?', [studentId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting student', error: err });
    }
});

module.exports = router;

