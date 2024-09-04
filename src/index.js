// src/index.js

const express = require('express');
const cors = require('cors');
const winston = require('winston');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const galleryRoutes = require('./routes/galleryRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
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
app.use('/api/galleries', galleryRoutes);
app.use('/api/artworks', artworkRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Database connection and server start
sequelize.sync({ force: false }) // Set force to true to drop and recreate tables on every app start
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