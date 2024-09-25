// tests/controllers/publicController.test.js

const request = require('supertest');
const express = require('express');
const { sequelize, Artwork, Translation, Image, ArtworkMetadata, syncDatabase } = require('../testDbSetup');

// Mock the database configuration
jest.mock('../../src/config/database', () => ({
    sequelize: sequelize
}));

// Import the controller after mocking the database configuration
const publicController = require('../../src/controllers/publicController');

const app = express();
app.use(express.json());
app.get('/api/v1/prints', publicController.getPrints);

describe('getPrints', () => {
    beforeAll(async () => {
        await syncDatabase();
    });

    beforeEach(async () => {
        await Artwork.destroy({ where: {} });
        await Translation.destroy({ where: {} });
        await Image.destroy({ where: {} });
        await ArtworkMetadata.destroy({ where: {} });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should return prints with correct pagination', async () => {
        // Create test data
        const artwork1 = await Artwork.create({ id: 1 });
        const artwork2 = await Artwork.create({ id: 2 });

        await ArtworkMetadata.create({
            artwork_id: 1,
            technique: 'etching',
            year_created: 2023,
            plate_material: 'copper',
            paper_type: 'cotton'
        });
        await ArtworkMetadata.create({
            artwork_id: 2,
            technique: 'aquatint',
            year_created: 2022,
            plate_material: 'zinc',
            paper_type: 'washi'
        });

        await Translation.create({ entity_id: 1, entity_type: 'Artwork', field_name: 'title', translated_content: 'Print 1', language_code: 'en' });
        await Translation.create({ entity_id: 2, entity_type: 'Artwork', field_name: 'title', translated_content: 'Print 2', language_code: 'en' });

        await Image.create({
            artwork_id: 1,
            version: 'thumbnail',
            public_url: 'url1',
            original_filename: 'image1.jpg',
            storage_bucket: 'test-bucket',
            storage_path: '/path/to/image1.jpg',
            status: 'active'
        });
        await Image.create({
            artwork_id: 2,
            version: 'thumbnail',
            public_url: 'url2',
            original_filename: 'image2.jpg',
            storage_bucket: 'test-bucket',
            storage_path: '/path/to/image2.jpg',
            status: 'active'
        });

        const response = await request(app)
            .get('/api/v1/prints')
            .query({ page: 1, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            prints: [
                { id: 1, title: 'Print 1', thumbnailUrl: 'url1' },
                { id: 2, title: 'Print 2', thumbnailUrl: 'url2' }
            ],
            totalCount: 2,
            currentPage: 1,
            totalPages: 1
        });
    });

    it('should handle query parameters correctly', async () => {
        // Create test data with specific attributes
        const artwork = await TestArtwork.create({
            id: 1,
            technique: 'etching',
            year_created: 2023,
            plate_material: 'copper',
            paper_type: 'cotton'
        });
        await TestTranslation.create({ entity_id: 1, entity_type: 'Artwork', field_name: 'title', translated_content: 'Etching Print', language_code: 'en' });
        await TestImage.create({ artwork_id: 1, version: 'thumbnail', public_url: 'url1' });

        const response = await request(app)
            .get('/api/v1/prints')
            .query({
                page: 1,
                limit: 20,
                language: 'en',
                technique: 'etching',
                year: '2023',
                plateType: 'copper',
                paperType: 'cotton'
            });

        expect(response.status).toBe(200);
        expect(response.body.prints).toHaveLength(1);
        expect(response.body.prints[0]).toEqual({
            id: 1,
            title: 'Etching Print',
            thumbnailUrl: 'url1'
        });
    });

    it('should handle errors', async () => {
        // Force an error by passing an invalid query parameter
        const response = await request(app)
            .get('/api/v1/prints')
            .query({ limit: 'invalid' });

        expect(response.status).toBe(500);
    });
});