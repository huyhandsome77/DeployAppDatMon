const { Review, User } = require('../models');
const { Op } = require('sequelize');

exports.getAllReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, date } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            whereClause.created_at = {
                [Op.between]: [startDate, endDate]
            };
        }

        const { count, rows } = await Review.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'user',
                attributes: ['fullName', 'phone']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            reviews: rows
        });
    } catch (error) {
        next(error);
    }
};

exports.createReview = async (req, res, next) => {
    try {
        const { user_id, phone, dish_name, content, rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Số sao không hợp lệ (1-5)" });
        }

        const newReview = await Review.create({
            user_id,
            phone,
            dish_name,
            content,
            rating
        });

        res.status(201).json({
            message: "Cảm ơn bạn đã gửi đánh giá!",
            review: newReview
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const review = await Review.findByPk(id);

        if (!review) {
            return res.status(404).json({ message: "Không tìm thấy đánh giá" });
        }

        await review.destroy();
        res.json({ message: "Đã xóa đánh giá thành công" });
    } catch (error) {
        next(error);
    }
};
