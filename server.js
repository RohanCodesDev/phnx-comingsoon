const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err.stack);
    } else {
        console.log('Connected to database successfully');
        release();
    }
});

// Create table if it doesn't exist
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS interested_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        whatsapp VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

pool.query(createTableQuery)
    .then(() => console.log('Table ready'))
    .catch(err => console.error('Error creating table:', err));

// API endpoint to save interested user
app.post('/api/interested', async (req, res) => {
    console.log('Received POST request:', req.body);
    const { email, whatsapp } = req.body;

    if (!email) {
        console.log('Email missing');
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
        });
    }

    try {
        console.log('Attempting to insert:', { email, whatsapp });
        const result = await pool.query(
            'INSERT INTO interested_users (email, whatsapp) VALUES ($1, $2) RETURNING *',
            [email, whatsapp]
        );
        
        console.log('Insert successful:', result.rows[0]);
        res.json({ 
            success: true, 
            message: 'Thank you for your interest!',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            console.log('Duplicate email:', email);
            res.status(409).json({ 
                success: false, 
                message: 'This email is already registered' 
            });
        } else {
            console.error('Database error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'An error occurred. Please try again.' 
            });
        }
    }
});

// Get all interested users (optional, for admin purposes)
app.get('/api/interested', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, whatsapp, created_at FROM interested_users ORDER BY created_at DESC'
        );
        res.json({ 
            success: true, 
            data: result.rows 
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching data' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
