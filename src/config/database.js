// src/config/database.js

const {Sequelize} = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // set to console.log to see the raw SQL queries
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const test = {
    sequelize: new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false, // set to console.log to see the raw SQL queries
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    })

};

const unittest = {
    sequelize: new Sequelize({
        dialect: 'sqlite',
        logging: false // set to console.log to see the raw SQL queries
    })

};

module.exports = {
    test,
    unittest,
    sequelize

}
