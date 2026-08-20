const { Reservation, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Tự động chuyển các đặt bàn quá hạn sang EXPIRED
 */
const cleanupExpiredReservations = async () => {
    try {
        const now = new Date();
        const expiryThreshold = new Date(now.getTime() - 30 * 60000); // 30 phút sau giờ đặt

        const [updatedCount] = await Reservation.update(
            { status: 'EXPIRED' },
            {
                where: {
                    status: 'CONFIRMED',
                    reservationTime: {
                        [Op.lt]: expiryThreshold
                    }
                }
            }
        );

        if (updatedCount > 0) {
            console.log(`[ReservationCleanup] Đã tự động hủy ${updatedCount} đặt bàn quá hạn.`);
        }
    } catch (error) {
        console.error('[ReservationCleanup] Lỗi khi dọn dẹp đặt bàn:', error);
    }
};

// Chạy mỗi 5 phút
const startCleanupTask = () => {
    setInterval(cleanupExpiredReservations, 5 * 60000);
    console.log('[ReservationCleanup] Đã khởi động tác vụ dọn dẹp tự động.');
};

module.exports = { startCleanupTask };
