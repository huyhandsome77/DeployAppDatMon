const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, optionalVerifyToken } = require('../middlewares/authMiddleware');

router.get('/my-orders', verifyToken, orderController.getMyOrders);

router.get('/', orderController.getAllOrders);
router.post('/', optionalVerifyToken, orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

router.get('/table/:tableId', orderController.getCurrentOrderByTable);
router.put('/table/:tableId/pay-all', orderController.payAllOrdersByTable);
router.put('/:id/pay', orderController.payOrder);

module.exports = router;
