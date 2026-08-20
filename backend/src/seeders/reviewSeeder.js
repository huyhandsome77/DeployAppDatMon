const { Review, User } = require('../models');

const seedReviews = async () => {
    try {
        const count = await Review.count();
        if (count === 0) {
            const customerUser = await User.findOne({ where: { role: 'CUSTOMER' } });
            const userId = customerUser ? customerUser.id : null;

            const reviews = [
                {
                    user_id: userId,
                    phone: "0901234567",
                    dish_name: "Sushi Cá Hồi",
                    content: "Cá hồi rất tươi ngọt, cơm dẻo ngon chuẩn vị Nhật. Sẽ ủng hộ nhà hàng nhiều!",
                    rating: 5,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2)
                },
                {
                    user_id: userId,
                    phone: "0987654321",
                    dish_name: "Mì Ramen Thịt Heo",
                    content: "Nước dùng đậm đà thơm ngon, thịt chashu mềm tan trong miệng. Rất hài lòng!",
                    rating: 5,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5)
                },
                {
                    user_id: userId,
                    phone: "0912345678",
                    dish_name: "Sashimi Tổng Hợp",
                    content: "Hải sản tươi ngon trình bày đẹp mắt. Nhân viên phục vụ nhiệt tình lịch sự.",
                    rating: 5,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12)
                },
                {
                    user_id: userId,
                    phone: "0933445566",
                    dish_name: "Bò Wagyu Nướng Sốt Nhật",
                    content: "Thịt bò nướng vừa chín tới, sốt ngon tuy nhiên hơi ít rau ăn kèm.",
                    rating: 4,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24)
                },
                {
                    user_id: userId,
                    phone: "0977889900",
                    dish_name: "Lẩu Thái Hải Sản",
                    content: "Vị lẩu chua cay vừa miệng, tôm mực tươi bơi tại bể. Giá cả hợp lý.",
                    rating: 4,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36)
                },
                {
                    user_id: userId,
                    phone: "0944556677",
                    dish_name: "Trà Đào Cam Sả",
                    content: "Nước uống mát lạnh ngòn ngọt thơm sả. Giải nhiệt tuyệt vời!",
                    rating: 5,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48)
                },
                {
                    user_id: userId,
                    phone: "0966778899",
                    dish_name: "Cơm Chiên Hải Sản",
                    content: "Cơm hạt tơi xốp nhiều hải sản, không bị dầu mỡ. Đóng gói mang về rất sạch sẽ.",
                    rating: 4,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72)
                },
                {
                    user_id: userId,
                    phone: "0922334455",
                    dish_name: "Bánh Xèo Nhật Okonomiyaki",
                    content: "Bánh giòn rụm sốt mayonnaise béo ngậy. Ăn lúc nóng rất ngon!",
                    rating: 5,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96)
                }
            ];

            await Review.bulkCreate(reviews);
            console.log('[ReviewSeeder] Đã tạo thành công 8 đánh giá mẫu.');
        } else {
            console.log(`[ReviewSeeder] Đã có ${count} đánh giá trong database.`);
        }
    } catch (error) {
        console.error('[ReviewSeeder] Lỗi khi tạo dữ liệu đánh giá mẫu:', error);
    }
};

module.exports = { seedReviews };
