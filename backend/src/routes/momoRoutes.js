const express = require('express');
const router = express.Router();
const momoController = require('../controllers/momoController');

// App gọi để lấy link thanh toán
router.post('/create', momoController.createMomoPayment);

// MoMo gọi về để thông báo kết quả (IPN)
router.post('/callback', momoController.momoCallback);

module.exports = router;
