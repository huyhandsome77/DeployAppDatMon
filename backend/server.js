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

let isInitialized = false;

const initializeDatabase = async () => {
    if (isInitialized) return;
    await connectDB();

    // Sync & Seed only when running locally or explicitly enabled via DB_SEED=true
    if (require.main === module || process.env.DB_SEED === 'true') {
        console.log('Database syncing and seeding...');
        await sequelize.sync();
        await seedProducts();
        await seedTables();
        await seedAdmin();
        await seedReviews();
        await seedOrders();
        await seedReservations();
        startCleanupTask();
    }
    isInitialized = true;
};

if (require.main === module) {
    initializeDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Local server initialization error:', err);
        process.exit(1);
    });
}

module.exports = require.main === module
    ? app
    : async (req, res, next) => {
        try {
            await initializeDatabase();
            app(req, res, next);
        } catch (err) {
            console.error('Vercel initialization error:', err);
            next(err);
        }
    };
