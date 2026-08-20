const bcrypt = require("bcryptjs");
const { User } = require("../models");

const seedAdmin = async () => {
    try {
        const admin = await User.findOne({
            where: {
                username: "admin"
            }
        });

        if (admin) {
            console.log("[AdminSeeder] Admin đã tồn tại.");
            return;
        }

        const hashedPassword = await bcrypt.hash("123", 10);

        await User.create({
            fullName: "Administrator",
            email: "admin@example.com",
            phone: "0900000000",
            username: "admin",
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE",
            points: 0
        });

        console.log("[AdminSeeder] Tạo tài khoản Admin thành công.");
    } catch (err) {
        console.error("[AdminSeeder]", err);
    }
};

module.exports = {
    seedAdmin
};