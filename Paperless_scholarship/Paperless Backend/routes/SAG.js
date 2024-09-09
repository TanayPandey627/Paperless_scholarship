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

// Get all students
router.get('/all-students', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM students');
        res.json(rows);
    } catch (err) {
        res.status(500).json({
            message: "Error retrieving student data"
        });
    }
});

// Update the status of a student
router.put('/update-status/:id', async (req, res) => {
    const studentId = req.params.id;
    const { process_status } = req.body;

    try {
        const [result] = await pool.query('UPDATE students SET process_status = ? WHERE id = ?', [process_status, studentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json({
            message: "Student process status updated successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Error updating the status"
        });
    }
});



module.exports = router;
