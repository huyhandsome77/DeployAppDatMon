const express = require('express');
const router = express.Router();
const payosController = require('../controllers/payosController');

// Debug PayOS
router.get('/debug', payosController.debugPayOS);

// App gọi để lấy link thanh toán
router.post('/create-payment-link', payosController.createPaymentLink);

// Kiểm tra trạng thái đơn hàng (Fallback)
router.get('/order-status/:orderId', payosController.checkOrderStatus);

// PayOS gọi về thông báo kết quả (IPN)
router.post('/webhook', payosController.payosWebhook);

// Trang thông báo hiển thị trên trình duyệt sau khi thanh toán
// ĐẢM BẢO ĐƯỜNG DẪN KHỚP VỚI RETURN_URL ĐÃ GỬI LÊN PAYOS
router.get('/payment-success', payosController.paymentSuccess);
router.get('/payment-cancel', payosController.paymentCancel);

module.exports = router;
