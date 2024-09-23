// tests/testDbSetup.js

const { Sequelize } = require('sequelize');
const GalleryModel = require('../src/models/gallery');
const ArtworkModel = require('../src/models/artwork');
const TranslationModel = require('../src/models/translation');
const ImageModel = require('../src/models/image');

const sequelize = new Sequelize('sqlite::memory:', { logging: false });

// Initialize models
const TestGallery = GalleryModel;
const TestArtwork = ArtworkModel;
const TestTranslation = TranslationModel;
const TestImage = ImageModel;

// Initialize the models with the test database
TestGallery.init(TestGallery.rawAttributes, { sequelize });
TestArtwork.init(TestArtwork.rawAttributes, { sequelize });
TestTranslation.init(TestTranslation.rawAttributes, { sequelize });
TestImage.init(TestImage.rawAttributes, { sequelize });

// Set up associations
TestGallery.belongsToMany(TestArtwork, { through: 'GalleryArtwork' });
TestArtwork.belongsToMany(TestGallery, { through: 'GalleryArtwork' });
TestArtwork.hasMany(TestTranslation, {
    foreignKey: 'entity_id',
    constraints: false,
    scope: { entity_type: 'Artwork' }
});
TestArtwork.hasMany(TestImage, { foreignKey: 'artwork_id' });

// Function to sync all models to the database
const syncDatabase = async () => {
    await sequelize.sync({ force: true });
};

module.exports = {
    sequelize,
    TestGallery,
    TestArtwork,
    TestTranslation,
    TestImage,
    syncDatabase,
};