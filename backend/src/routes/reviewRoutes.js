const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Admin lấy danh sách đánh giá
router.get('/', reviewController.getAllReviews);

// Gửi đánh giá mới
router.post('/', reviewController.createReview);

// Admin xóa đánh giá
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
