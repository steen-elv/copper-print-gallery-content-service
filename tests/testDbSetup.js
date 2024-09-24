// tests/testDbSetup.js

const { Sequelize, DataTypes } = require('sequelize');
const GalleryModel = require('../src/models/gallery');
const ArtworkModel = require('../src/models/artwork');
const TranslationModel = require('../src/models/translation');
const ImageModel = require('../src/models/image');
const ArtworkMetadataModel = require('../src/models/artworkMetadata');

const sequelize = new Sequelize('sqlite::memory:', {
    logging: false
});

// Initialize models
const Gallery = GalleryModel(sequelize, DataTypes);
const Artwork = ArtworkModel(sequelize, DataTypes);
const Translation = TranslationModel(sequelize, DataTypes);
const Image = ImageModel(sequelize, DataTypes);
const ArtworkMetadata = ArtworkMetadataModel(sequelize, DataTypes);

// Set up associations
if (Gallery.associate) Gallery.associate({ Artwork });
if (Artwork.associate) Artwork.associate({ Gallery, Translation, Image, ArtworkMetadata });
if (Translation.associate) Translation.associate({ Artwork });
if (Image.associate) Image.associate({ Artwork });
if (ArtworkMetadata.associate) ArtworkMetadata.associate({ Artwork });

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
    syncDatabase,
};