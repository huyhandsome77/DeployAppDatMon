const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
