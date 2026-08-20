const path = require('path');
const { Sequelize } = require('sequelize');

// Explicitly require dialect modules so Vercel bundler includes them and passes them to Sequelize
let mysql2, pg;
try { mysql2 = require('mysql2'); } catch (e) {}
try { pg = require('pg'); } catch (e) {}

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const dialect = process.env.DB_DIALECT || 'mysql';
const isProduction = process.env.NODE_ENV === 'production';
const selectedDialectModule = dialect === 'postgres' ? pg : mysql2;

const sequelize = new Sequelize(
    process.env.DB_NAME || 'database_development',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || (dialect === 'postgres' ? 5432 : 3306),
        dialect: dialect,
        dialectModule: selectedDialectModule, // <-- Dòng này giải quyết triệt để lỗi "Please install mysql2 package manually"
        dialectOptions: isProduction && (dialect === 'postgres' || process.env.DB_SSL === 'true') ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
        logging: false,
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`Database connected successfully via Sequelize (${dialect}).`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
