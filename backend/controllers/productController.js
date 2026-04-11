/**
 * Product Controller
 * Handles all product CRUD operations
 */

const pool = require('../config/database');

// Mock data fallback when DB is not available
const MOCK_PRODUCTS = [
  { id: 1, name: 'AeroStride Pro', category: 'Running', price: 129.99, original_price: 159.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', rating: 4.8, review_count: 124, badge: 'Best Seller', stock: 15, description: 'Premium running shoes engineered for maximum performance.' },
  { id: 2, name: 'UrbanWalker Classic', category: 'Casual', price: 89.99, original_price: null, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600', rating: 4.5, review_count: 89, badge: 'New', stock: 22, description: 'Timeless casual sneakers for everyday wear.' },
  { id: 3, name: 'SportFlex Elite', category: 'Training', price: 109.99, original_price: 139.99, image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', rating: 4.6, review_count: 67, badge: 'Sale', stock: 8, description: 'Built for high-intensity training sessions.' },
  { id: 4, name: 'CloudStep Loafer', category: 'Formal', price: 149.99, original_price: null, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600', rating: 4.9, review_count: 45, badge: null, stock: 12, description: 'Sophisticated loafers for the modern professional.' },
  { id: 5, name: 'TrailBlazer X', category: 'Hiking', price: 169.99, original_price: 199.99, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', rating: 4.7, review_count: 203, badge: 'Sale', stock: 5, description: 'Conquer any terrain with TrailBlazer X.' },
  { id: 6, name: 'SlimFit Canvas', category: 'Casual', price: 59.99, original_price: null, image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600', rating: 4.3, review_count: 156, badge: 'New', stock: 30, description: 'Lightweight canvas sneakers with a slim profile.' },
  { id: 7, name: 'MaxCush Runner', category: 'Running', price: 139.99, original_price: 169.99, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', rating: 4.6, review_count: 88, badge: 'Sale', stock: 18, description: 'Maximum cushioning for long-distance runners.' },
  { id: 8, name: 'Street Court Hi', category: 'Basketball', price: 119.99, original_price: null, image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600', rating: 4.4, review_count: 72, badge: null, stock: 14, description: 'High-top basketball shoes with ankle support.' },
];

/**
 * GET /api/products
 * Returns all products with optional filters
 */
const getAllProducts = async (req, res) => {
  try {
    const { category, min_price, max_price, sort, search } = req.query;
    let query = 'SELECT * FROM products WHERE is_active = 1';
    const params = [];

    if (category)  { query += ' AND category = ?';              params.push(category); }
    if (min_price) { query += ' AND price >= ?';                params.push(parseFloat(min_price)); }
    if (max_price) { query += ' AND price <= ?';                params.push(parseFloat(max_price)); }
    if (search)    { query += ' AND name LIKE ?';               params.push(`%${search}%`); }

    switch (sort) {
      case 'price-asc':  query += ' ORDER BY price ASC';   break;
      case 'price-desc': query += ' ORDER BY price DESC';  break;
      case 'rating':     query += ' ORDER BY rating DESC'; break;
      case 'name':       query += ' ORDER BY name ASC';    break;
      default:           query += ' ORDER BY created_at DESC';
    }

    const [products] = await pool.query(query, params);
    res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    console.error('getAllProducts error:', err.message);
    // Fallback to mock data
    res.json({ success: true, data: MOCK_PRODUCTS, count: MOCK_PRODUCTS.length, source: 'mock' });
  }
};

/**
 * GET /api/products/:id
 * Returns a single product by ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    const mock = MOCK_PRODUCTS.find(p => p.id === parseInt(req.params.id));
    if (mock) return res.json({ success: true, data: mock, source: 'mock' });
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/products
 * Creates a new product (admin only)
 */
const createProduct = async (req, res) => {
  try {
    const { name, category, price, original_price, description, image, stock, badge } = req.body;
    if (!name || !category || !price) {
      return res.status(400).json({ success: false, message: 'Name, category, and price are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO products (name, category, price, original_price, description, image, stock, badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, category, parseFloat(price), original_price || null, description, image, stock || 0, badge || null]
    );
    res.status(201).json({ success: true, message: 'Product created', data: { id: result.insertId, ...req.body } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/products/:id
 * Updates an existing product (admin only)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, original_price, description, image, stock, badge, is_active } = req.body;
    await pool.query(
      'UPDATE products SET name=?, category=?, price=?, original_price=?, description=?, image=?, stock=?, badge=?, is_active=? WHERE id=?',
      [name, category, price, original_price, description, image, stock, badge, is_active ?? 1, id]
    );
    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/products/:id
 * Soft-deletes a product (admin only)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
