// src/config/database.js

const { Sequelize } = require('sequelize');

// Read environment variables
const {
    NODE_ENV = 'development',
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_DIALECT = 'postgres'
} = process.env;

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    logging: NODE_ENV === 'development' ? console.log : false,
    define: {
        underscored: true,
        timestamps: true
    }
});

// Test the connection
sequelize
    .authenticate()
    .then(() => {
        console.log('Database connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = sequelize;