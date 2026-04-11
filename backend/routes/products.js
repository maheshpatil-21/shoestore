/**
 * Product Routes — /api/products
 */

const express    = require('express');
const router     = express.Router();
const productCtrl = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public routes
router.get('/',       productCtrl.getAllProducts);    // GET  /api/products
router.get('/:id',    productCtrl.getProductById);   // GET  /api/products/:id

// Admin-protected routes
router.post('/',      authMiddleware, adminMiddleware, productCtrl.createProduct);   // POST
router.put('/:id',    authMiddleware, adminMiddleware, productCtrl.updateProduct);   // PUT
router.delete('/:id', authMiddleware, adminMiddleware, productCtrl.deleteProduct);   // DELETE

module.exports = router;
