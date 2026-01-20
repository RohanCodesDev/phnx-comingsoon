const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Create table if it doesn't exist
const initDatabase = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS interested_users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            whatsapp VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    try {
        await pool.query(createTableQuery);
        console.log('Table ready');
    } catch (err) {
        console.error('Error creating table:', err);
    }
};

// Initialize database on first load
initDatabase();

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle GET request - fetch all interested users
    if (req.method === 'GET') {
        try {
            const result = await pool.query(
                'SELECT id, email, whatsapp, created_at FROM interested_users ORDER BY created_at DESC'
            );
            res.status(200).json({ 
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
        return;
    }

    // Handle POST request - save interested user
    if (req.method === 'POST') {
        const { email, whatsapp } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        try {
            const result = await pool.query(
                'INSERT INTO interested_users (email, whatsapp) VALUES ($1, $2) RETURNING *',
                [email, whatsapp]
            );
            
            res.status(200).json({ 
                success: true, 
                message: 'Thank you for your interest!',
                data: result.rows[0]
            });
        } catch (error) {
            if (error.code === '23505') { // Unique violation
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
        return;
    }

    // Method not allowed
    res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
    });
};
