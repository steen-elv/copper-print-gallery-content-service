// tests/testDbSetup.js

const { Sequelize } = require('sequelize');
const config = require('../src/config/config.js');

// Override the configuration to use SQLite in-memory database
const testConfig = {
    ...config.test,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
};

// Create a new Sequelize instance with the test configuration
const sequelize = new Sequelize(testConfig);

// Import the models
const models = require('../src/models');

// Replace the Sequelize instance in the models
Object.values(models).forEach(model => {
    if (model.init) {
        model.init(sequelize);
    }
});

// Set up associations
Object.values(models).forEach(model => {
    if (model.associate) {
        model.associate(models);
    }
});

// Function to sync all models to the database
const syncDatabase = async () => {
    await sequelize.sync({ force: true });
};

module.exports = {
    sequelize,
    ...models,
    syncDatabase,
};