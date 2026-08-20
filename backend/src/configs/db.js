const path = require('path');
const { Sequelize } = require('sequelize');

// Explicitly require dialect modules so Vercel bundler includes them and passes them to Sequelize
let mysql2, pg;
try { mysql2 = require('mysql2'); } catch (e) {}
try { pg = require('pg'); } catch (e) {}

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const databaseUrl = process.env.DATABASE_URL;
const configuredDialect = process.env.DB_DIALECT?.toLowerCase();
const isSupabaseHost = /supabase\.(co|com)/i.test(process.env.DB_HOST || '');
const dialect = databaseUrl || isSupabaseHost
    ? 'postgres'
    : (configuredDialect || 'mysql');
const isLocalhost = !databaseUrl && (process.env.DB_HOST === '127.0.0.1' || process.env.DB_HOST === 'localhost');
const useSsl = dialect === 'postgres' && (!isLocalhost || process.env.DB_SSL === 'true');

const sequelizeOptions = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || process.env.PORT_DB || (dialect === 'postgres' ? 5432 : 3306),
        dialect: dialect,
        dialectModule: selectedDialectModule,
        dialectOptions: useSsl ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        logging: false,
    };

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, sequelizeOptions)
    : new Sequelize(
        process.env.DB_NAME || 'database_development',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        sequelizeOptions
    );

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`Database connected successfully via Sequelize (${dialect}).`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};

module.exports = { sequelize, connectDB };
