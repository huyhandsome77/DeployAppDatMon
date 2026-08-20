const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME || 'database_development',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false,
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL connected successfully via Sequelize.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
