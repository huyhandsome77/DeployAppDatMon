const { Reservation, RestaurantTable, User, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.createReservation = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { guestName, guestPhone, reservationTime, numberOfGuests, note, user_id } = req.body;

        const startTime = new Date(reservationTime);
        const durationHours = 2;
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

        const overlappingReservations = await Reservation.findAll({
            where: {
                status: { [Op.in]: ['CONFIRMED', 'CHECKED_IN'] },
                [Op.and]: [
                    {
                        reservationTime: {
                            [Op.lt]: endTime
                        }
                    },
                    sequelize.where(
                        sequelize.fn('DATE_ADD', sequelize.col('reservationTime'), sequelize.literal(`INTERVAL ${durationHours} HOUR`)),
                        { [Op.gt]: startTime }
                    )
                ]
            },
            attributes: ['table_id'],
            transaction: t
        });

        const occupiedTableIds = overlappingReservations.map(r => r.table_id);

        const availableTable = await RestaurantTable.findOne({
            where: {
                capacity: { [Op.gte]: numberOfGuests },
                id: { [Op.notIn]: occupiedTableIds.length > 0 ? occupiedTableIds : [-1] },
                status: { [Op.ne]: 'CLEANING' }
            },
            order: [['capacity', 'ASC']],
            transaction: t
        });

        if (!availableTable) {
            await t.rollback();
            return res.status(400).json({
                message: "Rất tiếc, hiện tại không còn bàn trống phù hợp với số lượng khách và khung giờ bạn yêu cầu. Vui lòng chọn khung giờ khác!"
            });
        }

        const reservation = await Reservation.create({
            table_id: availableTable.id,
            user_id: user_id || null,
            guestName,
            guestPhone,
            reservationTime: startTime,
            numberOfGuests,
            note,
            status: 'PENDING'
        }, { transaction: t });

        await t.commit();
        res.status(201).json({
            message: "Đặt bàn thành công",
            data: {
                ...reservation.toJSON(),
                tableNumber: availableTable.tableNumber
            }
        });
    } catch (error) {
        await t.rollback();
        console.error("Create Reservation Error:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi đặt bàn", error: error.message });
    }
};

exports.checkIn = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const reservation = await Reservation.findByPk(id);

        if (!reservation) {
            await t.rollback();
            return res.status(404).json({ message: "Không tìm thấy thông tin đặt bàn" });
        }

        const status = String(reservation.status || '').toUpperCase();
        if (status !== 'CONFIRMED' && status !== 'PENDING') {
            await t.rollback();
            return res.status(400).json({ message: "Trạng thái đặt bàn không hợp lệ để nhận bàn" });
        }

        // Logic check: Only allow check-in within 30 mins before or 30 mins after reservationTime
        const now = new Date();
        const resTime = new Date(reservation.reservationTime);
        const diffMins = (now - resTime) / 60000;

        if (diffMins < -30 || diffMins > 30) {
            await t.rollback();
            return res.status(400).json({
                message: "Chỉ có thể nhấn nhận bàn trong khoảng 30 phút trước hoặc 30 phút sau giờ đặt bàn!"
            });
        }

        reservation.status = 'CHECKED_IN';
        await reservation.save({ transaction: t });

        await RestaurantTable.update(
            { status: 'OCCUPIED' },
            { where: { id: reservation.table_id }, transaction: t }
        );

        await t.commit();
        res.json({ message: "Xác nhận nhận bàn thành công" });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.cancelReservation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findByPk(id);

        if (!reservation) {
            return res.status(404).json({ message: "Không tìm thấy thông tin đặt bàn" });
        }

        const status = String(reservation.status || '').toUpperCase();
        if (status !== 'PENDING' && status !== 'CONFIRMED') {
            return res.status(400).json({
                message: "Chỉ có thể hủy lịch đặt bàn ở trạng thái 'Chờ duyệt' (PENDING) hoặc 'Đã xác nhận' (CONFIRMED)!"
            });
        }

        reservation.status = 'CANCELLED';
        await reservation.save();

        res.json({ message: "Đã hủy đặt bàn thành công" });
    } catch (error) {
        next(error);
    }
};

exports.confirmReservation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findByPk(id);

        if (!reservation) {
            return res.status(404).json({ message: "Không tìm thấy thông tin đặt bàn" });
        }

        const status = String(reservation.status || '').toUpperCase();
        if (status !== 'PENDING') {
            return res.status(400).json({
                message: "Chỉ có thể xác nhận lịch đặt bàn ở trạng thái 'Chờ duyệt' (PENDING)!"
            });
        }

        reservation.status = 'CONFIRMED';
        await reservation.save();

        res.json({ message: "Xác nhận đặt bàn thành công", data: reservation });
    } catch (error) {
        next(error);
    }
};

exports.updateReservationStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const reservation = await Reservation.findByPk(id);

        if (!reservation) {
            return res.status(404).json({ message: "Không tìm thấy thông tin đặt bàn" });
        }

        reservation.status = String(status).toUpperCase();
        await reservation.save();

        res.json({ message: "Cập nhật trạng thái đặt bàn thành công", data: reservation });
    } catch (error) {
        next(error);
    }
};

exports.getMyReservations = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const reservations = await Reservation.findAll({
            where: { user_id: userId },
            include: [{ model: RestaurantTable, as: 'table' }],
            order: [['reservationTime', 'DESC']]
        });
        res.json(reservations);
    } catch (error) {
        next(error);
    }
};

exports.getAllReservations = async (req, res, next) => {
    try {
        const reservations = await Reservation.findAll({
            include: [{ model: RestaurantTable, as: 'table' }, { model: User, as: 'User' }],
            order: [['reservationTime', 'ASC']]
        });
        res.json(reservations);
    } catch (error) {
        next(error);
    }
};
