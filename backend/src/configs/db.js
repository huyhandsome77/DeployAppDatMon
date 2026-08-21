const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');

// Load environment variables from all possible .env locations
const envPaths = [
    path.join(__dirname, '..', '..', '.env'),       // backend/.env
    path.join(__dirname, '..', '..', '..', '.env'), // root/.env
    path.join(process.cwd(), '.env'),               // cwd/.env
    path.join(process.cwd(), 'backend', '.env')     // cwd/backend/.env
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    }
}
dotenv.config();

let sequelize;

if (process.env.DATABASE_URL) {
    const isPostgres = process.env.DATABASE_URL.startsWith('postgres');
    console.log(`[DB Config] Using DATABASE_URL -> Dialect: ${isPostgres ? 'PostgreSQL (Supabase)' : 'MySQL'}`);
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: isPostgres ? 'postgres' : 'mysql',
        logging: false,
        dialectOptions: isPostgres ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    const dialect = process.env.DB_DIALECT || 'mysql';
    const isPostgres = dialect === 'postgres' || dialect === 'postgresql';
    console.log(`[DB Config] Using individual DB params -> Host: ${process.env.DB_HOST || '127.0.0.1'}, Dialect: ${dialect}`);
    sequelize = new Sequelize(
        process.env.DB_NAME || 'database_development',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || (isPostgres ? 5432 : 3306),
            dialect: isPostgres ? 'postgres' : 'mysql',
            logging: false,
            dialectOptions: (process.env.DB_SSL === 'true' || isPostgres) ? {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            } : {},
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        }
    );
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`✅ [Database] Connected successfully via Sequelize (${sequelize.getDialect() === 'postgres' ? 'Supabase PostgreSQL' : 'MySQL'}).`);
    } catch (error) {
        console.error('❌ [Database] Unable to connect to the database:', error.message);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
};

module.exports = { sequelize, connectDB };
