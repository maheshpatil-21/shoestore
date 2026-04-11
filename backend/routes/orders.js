/**
 * Order Routes — /api/orders
 */

const express    = require('express');
const router     = express.Router();
const orderCtrl  = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// User routes (protected)
router.post('/',          orderCtrl.createOrder);    // POST /api/orders
router.get('/my-orders', authMiddleware, orderCtrl.getUserOrders);  // GET  my orders

// Admin routes
router.get('/',          authMiddleware, adminMiddleware, orderCtrl.getAllOrders);
router.get('/:id',       authMiddleware, orderCtrl.getOrderById);
router.put('/:id/status',authMiddleware, adminMiddleware, orderCtrl.updateOrderStatus);

module.exports = router;
