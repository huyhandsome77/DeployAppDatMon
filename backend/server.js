const app = require('./src/app');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./src/models');
const { startCleanupTask } = require('./src/services/reservationCleanup');
const { seedTables } = require('./src/seeders/tableSeeder');
const { seedProducts } = require('./src/seeders/productSeeder');
const { seedReservations } = require('./src/seeders/reservationSeeder');
const { seedOrders } = require('./src/seeders/orderSeeder');
const { seedAdmin } = require('./src/seeders/adminSeeder');
const { seedReviews } = require('./src/seeders/reviewSeeder');
dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to Database and sync models
connectDB();

// Đồng bộ database
sequelize.sync().then(async () => {
    console.log('Database synced successfully.');
    try {
        await seedTables();
        await seedProducts();
        await seedAdmin();
        await seedReviews();
        await seedOrders();
        await seedReservations();
    } catch (seedErr) {
        console.error('Seeder execution note:', seedErr.message);
    }

    if (!process.env.VERCEL) {
        // Khởi động dọn dẹp đặt bàn quá hạn (chỉ chạy ở local / persistent server)
        startCleanupTask();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
}).catch(err => {
    console.error('Failed to sync database:', err);
});

module.exports = app;
