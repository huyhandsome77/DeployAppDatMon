const app = require('../backend/src/app');
const { connectDB, sequelize } = require('../backend/src/models');

let dbInitPromise = null;

const initDB = async () => {
    try {
        await connectDB();
        await sequelize.sync();
        console.log('[Vercel Serverless] Database connected and synced successfully.');
    } catch (err) {
        console.error('[Vercel Serverless] DB initialization warning:', err.message);
    }
};

module.exports = async (req, res) => {
    if (!dbInitPromise) {
        dbInitPromise = initDB();
    }
    await dbInitPromise;
    return app(req, res);
};
