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
  try {
    const { items, shipping, payment } = req.body;

let total_price = 0;

for (const item of items) {
  total_price += (item.price * (item.quantity || item.qty || 1));
}
    const user_id = null;

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item"
      });
    }

    // Insert order
const orderResult = await pool.query(
`INSERT INTO orders
(user_id,total_price,status,shipping_name,shipping_email,shipping_address,shipping_city,shipping_zip,shipping_country,payment_method)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
RETURNING id`,
[
  user_id,
  total_price,
  "pending",
  `${shipping?.first_name || shipping?.name || ''}`,
  shipping?.email || '',
  shipping?.address || '',
  shipping?.city || '',
  shipping?.zip || shipping?.postal || '',
  shipping?.country || '',
  payment?.method || 'card'
]
);

    const orderId = orderResult.rows[0].id;

    // Insert order items
for (const item of items) {

  const productId = item.product_id || item.productId || item.id;

let productName = "Unknown Product";

if (productId) {
  const product = await pool.query(
    "SELECT name FROM products WHERE id = $1",
    [productId]
  );

  if (product.rows.length > 0) {
    productName = product.rows[0].name;
  }
}

  const quantity = item.quantity || item.qty || 1;

  const price = parseFloat(item.price) || 0;

  await pool.query(
    `INSERT INTO order_items
    (order_id, product_id, product_name, size, quantity, unit_price)
    VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      orderId,
      productId,
      productName,
      item.size || "M",
      quantity,
      price
    ]
  );
}


    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * GET /api/orders/my-orders
 * Get orders for the logged-in user
 */
const getUserOrders = async (req, res) => {
  try {
    const result = await pool.query(
`SELECT o.*, STRING_AGG(oi.product_name, ', ') AS item_names
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = $1
GROUP BY o.id
ORDER BY o.created_at DESC`,
[req.user.id]
);

const orders = result.rows;
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

if (status) {
  query += ' WHERE status = $1';
  params.push(status);
}

query += ` ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
params.push(parseInt(limit), offset);

const result = await pool.query(query, params);
const orders = result.rows;
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
    const orderResult = await pool.query(
'SELECT * FROM orders WHERE id = $1',
[id]
);
const orders = orderResult.rows;
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });
    const itemResult = await pool.query(
'SELECT * FROM order_items WHERE order_id = $1',
[id]
);
const items = itemResult.rows;
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
    await pool.query(
'UPDATE orders SET status = $1 WHERE id = $2',
[status, id]
);
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createOrder, getUserOrders, getAllOrders, getOrderById, updateOrderStatus };
