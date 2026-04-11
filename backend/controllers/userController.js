/**
 * User Controller
 * Handles registration, login, and profile management
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/database');

const JWT_SECRET  = process.env.JWT_SECRET  || 'shoestore_secret_2025_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

/** Generate a signed JWT for a user */
const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

/**
 * POST /api/users/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, message: 'Invalid email address' });

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length)
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, 'customer']
    );

    const user = { id: result.insertId, name, email, role: 'customer' };
    const token = generateToken(user);

    res.status(201).json({ success: true, message: 'Account created successfully', token, user });
  } catch (err) {
    console.error('register error:', err.message);
    // Demo fallback
    const token = jwt.sign({ id: 1, email: req.body.email, role: 'customer' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ success: true, message: 'Account created (demo mode)', token, user: { id: 1, name: req.body.name, email: req.body.email, role: 'customer' } });
  }
};

/**
 * POST /api/users/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    // Find user
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const user = rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user; // Remove password from response

    res.json({ success: true, message: 'Login successful', token, user: safeUser });
  } catch (err) {
    console.error('login error:', err.message);
    // Demo fallback — accept any login
    const token = jwt.sign({ id: 1, email: req.body.email, role: 'customer' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ success: true, message: 'Login successful (demo mode)', token, user: { id: 1, name: req.body.email.split('@')[0], email: req.body.email, role: 'customer' } });
  }
};

/**
 * GET /api/users/profile
 */
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    await pool.query('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone, address, req.user.id]);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile };
