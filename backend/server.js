/**
 * ShoeStore Backend — server.js
 * Express.js REST API
 */

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const dotenv     = require('dotenv');
const path       = require('path');

// Load environment variables
dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet({ contentSecurityPolicy: false })); // Security headers
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Request logging

// Serve frontend static files (optional — if you want one server)
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// ROUTES
// ============================================

const productRoutes  = require('./routes/products');
const userRoutes     = require('./routes/users');
const orderRoutes    = require('./routes/orders');
const adminRoutes    = require('./routes/admin');

app.use('/api/products', productRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/admin',    adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ShoeStore API is running', timestamp: new Date().toISOString() });
});

// ============================================
// 404 & ERROR HANDLING
// ============================================

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`✅ ShoeStore API running at http://localhost:${PORT}`);
  console.log(`📚 Endpoints: /api/products | /api/users | /api/orders | /api/admin`);
});

module.exports = app;
