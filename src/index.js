// src/index.js

const express = require('express');
const cors = require('cors');
const winston = require('winston');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const publicRoutes = require('./routes/publicRoutes');
const artistRoutes = require('./routes/artistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sequelize = require('./config/database');

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/v1', publicRoutes);
app.use('/api/v1', artistRoutes); // Note: This will need authentication middleware
app.use('/api/v1', adminRoutes);  // Note: This will need authentication middleware

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Database connection and server start
sequelize.sync({ force: false })
    .then(() => {
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info('Database connected successfully');
        });
    })
    .catch((error) => {
        logger.error('Unable to connect to the database:', error);
    });

module.exports = app; // for testing