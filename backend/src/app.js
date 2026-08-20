const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

const fs = require('fs');

const resolveDir = (dirName) => {
    const candidates = [
        path.join(__dirname, '..', dirName),
        path.join(__dirname, '..', '..', dirName)
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return candidates[0];
};

const customerDir = resolveDir('customer');
const adminDir = resolveDir('admin');
const uploadsDir = resolveDir('uploads');
const docsDir = resolveDir('docs');

// Static Folder for Uploads
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Modern Interactive API Documentation Portal
app.use('/docs', express.static(docsDir, { etag: false, maxAge: 0, setHeaders: (res) => { res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));
app.get('/docs', (req, res) => {
    res.sendFile(path.join(docsDir, 'index.html'));
});

// Swagger UI & Specification
const swaggerUiOptions = {
    explorer: true,
    customSiteTitle: 'AppDatMon API Docs',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js'
    ]
};

app.use('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/admin', express.static(adminDir, { etag: false, maxAge: 0, setHeaders: (res) => { res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));
app.get('/admin', (req, res) => {
    res.sendFile(path.join(adminDir, 'index.html'));
});
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminDir, 'index.html'));
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const pointRoutes = require('./routes/pointRoutes');
const statRoutes = require('./routes/statRoutes');
const payosRoutes = require('./routes/payosRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/payos', payosRoutes);

// Customer Static files
app.use(express.static(customerDir, { etag: false, maxAge: 0, setHeaders: (res) => { res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));
app.use('/customer', express.static(customerDir, { etag: false, maxAge: 0, setHeaders: (res) => { res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));

// Customer Root route: Serve customer login.html by default (which auto-redirects if already logged in)
app.get('/', (req, res) => {
    res.sendFile(path.join(customerDir, 'login.html'));
});

app.get('/customer', (req, res) => {
    res.sendFile(path.join(customerDir, 'login.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        statusCode: statusCode,
        message: err.message
    });
});

module.exports = app;

