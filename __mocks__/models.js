// __mocks__/models.js

const { TestGallery, TestArtwork, TestTranslation, TestImage } = require('../tests/testDbSetup');

module.exports = {
    Gallery: TestGallery,
    Artwork: TestArtwork,
    Translation: TestTranslation,
    Image: TestImage,
};