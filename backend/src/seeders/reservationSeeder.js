const { Reservation, RestaurantTable } = require('../models');

const seedReservations = async () => {
    try {
        const count = await Reservation.count();
        if (count === 0) {
            const now = new Date();

            // 1. Chờ duyệt (PENDING) -> Hẹn sau 15 phút
            const timePending = new Date(now.getTime() + 15 * 60000);

            // 2. Đã xác nhận (CONFIRMED) -> Hẹn sau 10 phút (Trong cửa sổ ±30p -> Nút Nhận Bàn BẬT SÁNG)
            const timeConfirmed = new Date(now.getTime() + 10 * 60000);

            // 3. Đã nhận bàn (CHECKED_IN) -> Đã vào bàn 30p trước
            const timeCheckedIn = new Date(now.getTime() - 30 * 60000);

            // 4. Đã hủy (CANCELLED)
            const timeCancelled = new Date(now.getTime() - 120 * 60000);

            const reservations = [
                {
                    id: 1,
                    table_id: 2,
                    guestName: "Trần Văn Nam",
                    guestPhone: "0912345678",
                    reservationTime: timePending,
                    numberOfGuests: 2,
                    status: 'PENDING',
                    note: 'Bàn cạnh cửa sổ thoáng mát'
                },
                {
                    id: 2,
                    table_id: 4,
                    guestName: "Nguyễn Văn A",
                    guestPhone: "0901234567",
                    reservationTime: timeConfirmed,
                    numberOfGuests: 4,
                    status: 'CONFIRMED',
                    note: 'Tiệc sinh nhật gia đình'
                },
                {
                    id: 3,
                    table_id: 1,
                    guestName: "Lê Thị Cẩm",
                    guestPhone: "0987654321",
                    reservationTime: timeCheckedIn,
                    numberOfGuests: 3,
                    status: 'CHECKED_IN',
                    note: 'Khách VIP - Giảm 10%'
                },
                {
                    id: 4,
                    table_id: 5,
                    guestName: "Phạm Hoàng Dũng",
                    guestPhone: "0933445566",
                    reservationTime: timeCancelled,
                    numberOfGuests: 6,
                    status: 'CANCELLED',
                    note: 'Khách bận đột xuất'
                }
            ];

            await Reservation.bulkCreate(reservations);
            await RestaurantTable.update({ status: 'OCCUPIED' }, { where: { id: 1 } });

            console.log('[ReservationSeeder] Đã khởi tạo 4 lịch đặt bàn mẫu.');
        }
    } catch (error) {
        console.error('[ReservationSeeder] Lỗi khi tạo đặt bàn mẫu:', error);
    }
};

module.exports = { seedReservations };
