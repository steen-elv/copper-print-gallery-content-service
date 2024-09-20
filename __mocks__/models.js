// __mocks__/models.js

const mockArtwork = {
    findAndCountAll: jest.fn()
};

const mockGallery = {
    findOne: jest.fn()
};

const mockTranslation = {};
const mockImage = {};

module.exports = {
    Artwork: mockArtwork,
    Gallery: mockGallery,
    Translation: mockTranslation,
    Image: mockImage
};