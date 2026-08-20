const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/my-reservations', verifyToken, reservationController.getMyReservations);

router.post('/', reservationController.createReservation);
router.get('/', reservationController.getAllReservations);
router.put('/:id/confirm', reservationController.confirmReservation);
router.put('/:id/status', reservationController.updateReservationStatus);
router.put('/:id/check-in', reservationController.checkIn);
router.put('/:id/cancel', reservationController.cancelReservation);

module.exports = router;
