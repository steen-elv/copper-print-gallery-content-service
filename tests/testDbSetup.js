// tests/testDbSetup.js

const { Sequelize } = require('sequelize');
const config = require('../src/config/database');  // Assume this exists and contains our database configurations

// Use the test configuration, but override with SQLite settings
const testConfig = {
    ...config.unittest,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
};

const sequelize = new Sequelize(testConfig);

// Import your models
const { Gallery, Artwork, Translation, Image, ArtworkMetadata } = require('../src/models');

// Initialize models
const models = {
    Gallery,
    Artwork,
    Translation,
    Image,
    ArtworkMetadata
};

Object.values(models).forEach(model => {
    model.init(model.getAttributes(), { sequelize });
});

// Set up associations
Object.values(models).forEach(model => {
    if (typeof model.associate === 'function') {
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