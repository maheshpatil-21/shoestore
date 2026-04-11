/**
 * Database Configuration
 * Uses mysql2 with connection pooling
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool (more efficient than single connections)
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'shoestore',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           'Z',
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.log('⚠️  Running in demo mode without database');
  }
})();

module.exports = pool;
