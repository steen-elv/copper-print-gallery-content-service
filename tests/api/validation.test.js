// tests/api/validation.test.js

const request = require('supertest');
const app = require('../../src/app'); // Import your actual Express app

// Mock the controllers
jest.mock('../../src/controllers/publicController', () => ({
    getGalleries: jest.fn(),
    getGallery: jest.fn(),
    getPrints: jest.fn(),
    getPrint: jest.fn()
}));

const publicController = require('../../src/controllers/publicController');

describe('API Validation and Error Handling', () => {
    describe('GET /api/v1/prints', () => {
        it('should return 400 for invalid query parameters', async () => {
            const response = await request(app)
                .get('/api/v1/prints')
                .query({ page: 'invalid', limit: 'invalid' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
            expect(response.body.error.code).toBe('BAD_REQUEST');
            expect(response.body.error.message).toContain('page');
        });

        it('should return 200 for valid query parameters', async () => {
            publicController.getPrints.mockResolvedValue({
                prints: [],
                totalCount: 0,
                currentPage: 1,
                totalPages: 0
            });

            const response = await request(app)
                .get('/api/v1/prints')
                .query({ page: 1, limit: 20 });

            console.log(response);
            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/v1/prints/:printId', () => {
        it('should return 400 for invalid printId', async () => {
            const response = await request(app)
                .get('/api/v1/prints/invalid');

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
            expect(response.body.error.code).toBe('BAD_REQUEST');
            expect(response.body.error.message).toContain('printId');
        });

        it('should return 404 for non-existent printId', async () => {
            publicController.getPrint.mockRejectedValue({
                status: 404,
                code: 'NOT_FOUND',
                message: 'Print not found'
            });

            const response = await request(app)
                .get('/api/v1/prints/999');

            expect(response.status).toBe(404);
            expect(response.body.error).toBeDefined();
            expect(response.body.error.code).toBe('NOT_FOUND');
            expect(response.body.error.message).toBe('Print not found');
        });
    });

    // Add more test cases for other endpoints...
});