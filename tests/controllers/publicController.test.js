// tests/controllers/publicController.test.js

const request = require('supertest');
const express = require('express');

// Mock the models module
jest.mock('../../src/models');
const { Artwork } = require('../../src/models');

const publicController = require('../../src/controllers/publicController');

const app = express();
app.use(express.json());
app.get('/api/v1/prints', publicController.getPrints);

describe('getPrints', () => {
    it('should return prints with correct pagination', async () => {
        const mockPrints = [
            { id: 1, Translations: [{ translated_content: 'Print 1' }], Images: [{ public_url: 'url1' }] },
            { id: 2, Translations: [{ translated_content: 'Print 2' }], Images: [{ public_url: 'url2' }] }
        ];

        Artwork.findAndCountAll.mockResolvedValue({
            count: 2,
            rows: mockPrints
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

        expect(Artwork.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            limit: 10,
            offset: 0
        }));
    });

    it('should handle query parameters correctly', async () => {
        Artwork.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await request(app)
            .get('/api/v1/prints')
            .query({
                page: 2,
                limit: 20,
                language: 'da',
                galleryId: '1',
                technique: 'etching',
                year: '2023',
                plateType: 'copper',
                paperType: 'cotton'
            });

        expect(Artwork.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            limit: 20,
            offset: 20,
            where: expect.objectContaining({
                '$ArtworkMetadata.technique$': 'etching',
                '$ArtworkMetadata.year_created$': 2023,
                '$ArtworkMetadata.plate_material$': 'copper',
                '$ArtworkMetadata.paper_type$': 'cotton'
            }),
            include: expect.arrayContaining([
                expect.objectContaining({
                    model: expect.anything(),
                    where: { id: '1' }
                })
            ])
        }));
    });

    it('should handle errors', async () => {
        Artwork.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/api/v1/prints');

        expect(response.status).toBe(500);
    });
});