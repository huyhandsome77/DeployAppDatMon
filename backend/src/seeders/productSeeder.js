const { Product, Category } = require('../models');

const seedProducts = async () => {
    try {
        const count = await Product.count();
        if (count === 0) {
            // Tạo Category mẫu
            const category = await Category.create({
                name: "Sushi đặc biệt",
                description: "Các món sushi cao cấp"
            });

            const products = [
                {
                    name: "Sushi Cá Hồi",
                    description: "Sushi cá hồi tươi sống",
                    price: 150000,
                    category_id: category.id,
                    status: 'AVAILABLE'
                },
                {
                    name: "Sashimi Tổng Hợp",
                    description: "Nhiều loại cá tươi",
                    price: 450000,
                    category_id: category.id,
                    status: 'AVAILABLE'
                },
                {
                    name: "Mì Ramen Thịt Heo",
                    description: "Ramen truyền thống",
                    price: 120000,
                    category_id: category.id,
                    status: 'AVAILABLE'
                }
            ];

            await Product.bulkCreate(products);
            console.log('[Seeder] Đã tạo sản phẩm mẫu.');
        }
    } catch (error) {
        console.error('[Seeder] Lỗi khi tạo sản phẩm mẫu:', error);
    }
};

module.exports = { seedProducts };
