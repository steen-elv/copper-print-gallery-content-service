// tests/testDbSetup.js

const { Sequelize } = require('sequelize');
const {
    Gallery,
    Artwork,
    Translation,
    Image,
    ArtworkMetadata,
    // Import any other models you have
} = require('../src/models');

const sequelize = new Sequelize('sqlite::memory:', { logging: false });

// Initialize models
Object.values(sequelize.models).forEach(model => {
    if (typeof model.associate === 'function') {
        model.associate(sequelize.models);
    }
});

// Function to sync all models to the database
const syncDatabase = async () => {
    await sequelize.sync({ force: true });
};

module.exports = {
    sequelize,
    Gallery,
    Artwork,
    Translation,
    Image,
    ArtworkMetadata,
    // Export any other models you have
    syncDatabase,
};