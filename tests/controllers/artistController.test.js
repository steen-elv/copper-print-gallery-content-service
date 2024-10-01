// tests/controllers/artistController.test.js

const request = require('supertest');
const express = require('express');
const { Artist, Gallery, Artwork, GalleryArtwork } = require('../../src/models');
const artistController = require('../../src/controllers/artistController');

// Mock the database
jest.mock('../../src/config/database');
const sequelize = require('../../src/config/database');

const app = express();
app.use(express.json());
app.get('/api/v1/artist/galleries', artistController.getArtistGalleries);

describe('getArtistGalleries', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    beforeEach(async () => {
        await Artist.destroy({ where: {} });
        await Gallery.destroy({ where: {} });
        await Artwork.destroy({ where: {} });
        await GalleryArtwork.destroy({ where: {} });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should return galleries for the authenticated artist', async () => {
        // Create test artist
        const artist = await Artist.create({
            keycloak_id: 'test-keycloak-id',
            username: 'testartist',
            email: 'test@example.com',
            default_language: 'en'
        });

        // Create test galleries
        const gallery1 = await Gallery.create({
            artist_id: artist.id,
            title: 'Gallery 1',
            description: 'Description 1',
            status: 'published'
        });

        const gallery2 = await Gallery.create({
            artist_id: artist.id,
            title: 'Gallery 2',
            description: 'Description 2',
            status: 'draft'
        });

        // Create test artworks and associate with galleries
        const artwork1 = await Artwork.create({});
        const artwork2 = await Artwork.create({});

        await GalleryArtwork.create({ gallery_id: gallery1.id, artwork_id: artwork1.id, order: 1 });
        await GalleryArtwork.create({ gallery_id: gallery1.id, artwork_id: artwork2.id, order: 2 });
        await GalleryArtwork.create({ gallery_id: gallery2.id, artwork_id: artwork1.id, order: 1 });

        // Mock authenticated artist
        app.use((req, res, next) => {
            req.artist = artist;
            next();
        });

        const response = await request(app)
            .get('/api/v1/artist/galleries')
            .query({ page: 1, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.galleries).toHaveLength(2);
        expect(response.body.galleries[0]).toEqual(expect.objectContaining({
            id: gallery1.id,
            title: 'Gallery 1',
            description: 'Description 1',
            status: 'published',
            printCount: 2
        }));
        expect(response.body.galleries[1]).toEqual(expect.objectContaining({
            id: gallery2.id,
            title: 'Gallery 2',
            description: 'Description 2',
            status: 'draft',
            printCount: 1
        }));
        expect(response.body.totalCount).toBe(2);
        expect(response.body.currentPage).toBe(1);
        expect(response.body.totalPages).toBe(1);
    });

    it('should handle pagination correctly', async () => {
        const artist = await Artist.create({
            keycloak_id: 'test-keycloak-id',
            username: 'testartist',
            email: 'test@example.com',
            default_language: 'en'
        });

        // Create 15 galleries
        for (let i = 1; i <= 15; i++) {
            await Gallery.create({
                artist_id: artist.id,
                title: `Gallery ${i}`,
                description: `Description ${i}`,
                status: i % 2 === 0 ? 'published' : 'draft'
            });
        }

        app.use((req, res, next) => {
            req.artist = artist;
            next();
        });

        const response = await request(app)
            .get('/api/v1/artist/galleries')
            .query({ page: 2, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.galleries).toHaveLength(5);
        expect(response.body.totalCount).toBe(15);
        expect(response.body.currentPage).toBe(2);
        expect(response.body.totalPages).toBe(2);
    });

    it('should return empty array when artist has no galleries', async () => {
        const artist = await Artist.create({
            keycloak_id: 'test-keycloak-id',
            username: 'testartist',
            email: 'test@example.com',
            default_language: 'en'
        });

        app.use((req, res, next) => {
            req.artist = artist;
            next();
        });

        const response = await request(app)
            .get('/api/v1/artist/galleries');

        expect(response.status).toBe(200);
        expect(response.body.galleries).toEqual([]);
        expect(response.body.totalCount).toBe(0);
        expect(response.body.currentPage).toBe(1);
        expect(response.body.totalPages).toBe(0);
    });
});