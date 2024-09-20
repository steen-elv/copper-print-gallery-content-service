// tests/setup.js

const { mockDeep } = require('jest-mock-extended');

// Mock Sequelize models
jest.mock('../src/models', () => ({
    Gallery: mockDeep(),
    Artwork: mockDeep(),
    Translation: mockDeep(),
    Image: mockDeep()
}));

// Mock the logger to prevent console output during tests
jest.mock('../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn()
}));

// Clean up mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});