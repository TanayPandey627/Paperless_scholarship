const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken } = require('../middleware/authMiddleware'); // Ensure this is correct

// Creating a connection with the database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Prashant@1q2w',
    database: 'paperless',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// Route to get all students whose process is completed by SAG Bureau
router.get('/all-students', authenticateToken, async (req, res) => { // Use authenticateToken correctly here
    try {
        const [rows] = await pool.query('SELECT * FROM students WHERE process_status = "Verified"');
        res.json(rows);
    } catch (err) {
        res.status(500).json({
            message: 'Error retrieving student data',
            error: err
        });
    }
});

// Route to update the payment status for a student
router.put('/update-payment-status/:id', authenticateToken, async (req, res) => { // Also use authenticateToken here
    const studentId = req.params.id;
    const { payment_status } = req.body;

    try {
        const [result] = await pool.query('UPDATE students SET payment_status = ? WHERE id = ?', [payment_status, studentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Student not found'
            });
        }

        res.json({
            message: 'Student payment status updated successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error updating payment status',
            error: err
        });
    }
});

module.exports = router;
