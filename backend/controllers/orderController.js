/**
 * Order Controller
 * Handles order creation and retrieval
 */

const pool = require('../config/database');

/**
 * POST /api/orders
 * Create a new order
 */
const createOrder = async (req, res) => {
  const conn = await pool.getConnection().catch(() => null);
  try {
    const { items, total_price, shipping, payment } = req.body;
    const user_id = req.user?.id || null;

    if (!items || !items.length)
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });

    if (conn) {
      await conn.beginTransaction();

      // Insert order
      const [orderResult] = await conn.query(
        'INSERT INTO orders (user_id, total_price, status, shipping_name, shipping_email, shipping_address, shipping_city, shipping_zip, shipping_country, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          user_id,
          parseFloat(total_price),
          'pending',
          `${shipping?.first_name || ''} ${shipping?.last_name || ''}`.trim(),
          shipping?.email || '',
          shipping?.address || '',
          shipping?.city || '',
          shipping?.zip || '',
          shipping?.country || '',
          payment?.method || 'card',
        ]
      );

      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of items) {

  const productId   = item.product_id || item.id;
  const productName = item.product_name || item.name;
  const quantity    = item.quantity || item.qty;

  await conn.query(
    'INSERT INTO order_items (order_id, product_id, product_name, size, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)',
    [orderId, productId, productName, item.size || 'M', quantity, parseFloat(item.price)]
  );

  await conn.query(
    'UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
    [quantity, productId]
  );
}

      await conn.commit();
      res.status(201).json({ success: true, message: 'Order placed successfully', orderId, data: { id: orderId, status: 'pending' } });
    } else {
      // Demo fallback when DB is offline
      const demoOrderId = `SS-${Date.now()}`;
      res.status(201).json({ success: true, message: 'Order placed (demo mode)', orderId: demoOrderId, data: { id: demoOrderId, status: 'pending' } });
    }
  } catch (err) {
    if (conn) await conn.rollback().catch(() => {});
    console.error('createOrder error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * GET /api/orders/my-orders
 * Get orders for the logged-in user
 */
const getUserOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, GROUP_CONCAT(oi.product_name SEPARATOR ', ') AS item_names
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: orders });
  } catch (err) {
    res.json({ success: true, data: [], message: 'Demo mode' });
  }
};

/**
 * GET /api/orders
 * Get all orders (admin only)
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = 'SELECT * FROM orders';
    const params = [];
    if (status) { query += ' WHERE status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const [orders] = await pool.query(query, params);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.json({ success: true, data: [], message: 'Demo mode' });
  }
};

/**
 * GET /api/orders/:id
 * Get a specific order with its items
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    res.json({ success: true, data: { ...orders[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/orders/:id/status
 * Update order status (admin only)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createOrder, getUserOrders, getAllOrders, getOrderById, updateOrderStatus };
