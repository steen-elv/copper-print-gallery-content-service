// src/index.js

const app = require('./app');
const sequelize = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

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