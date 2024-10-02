// tests/controllers/artistController.test.js

const request = require('supertest');
const express = require('express');

jest.mock('../../src/config/database');
const sequelize = require('../../src/config/database');

const {
    Gallery,
    GalleryArtwork,
    Artwork,
    Translation
} = require('../../src/models/index');

const artistController = require('../../src/controllers/artistController');

const app = express();
app.use(express.json());
app.get('/api/v1/artist/galleries', artistController.getArtistGalleries);

describe('getArtistGalleries', () => {
    beforeAll(async () => {
        await sequelize.sync({force: true});
    });

    beforeEach(async () => {
        await Gallery.destroy({where: {}});
        await Artwork.destroy({where: {}});
        await GalleryArtwork.destroy({where: {}});
        await Translation.destroy({where: {}});
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should return galleries with correct pagination', async () => {
        const gallery1 = await Gallery.create({
            status: 'published'
        });
        const gallery2 = await Gallery.create({
            status: 'draft'
        });

        const artwork1 = await Artwork.create();
        const artwork2 = await Artwork.create();

        await GalleryArtwork.create({gallery_id: gallery1.id, artwork_id: artwork1.id, order: 1});
        await GalleryArtwork.create({gallery_id: gallery1.id, artwork_id: artwork2.id, order: 2});
        await GalleryArtwork.create({gallery_id: gallery2.id, artwork_id: artwork1.id, order: 1});

        await Translation.create({
            entity_id: gallery1.id,
            entity_type: 'Gallery',
            field_name: 'title',
            translated_content: 'Gallery 1',
            language_code: 'en'
        });
        await Translation.create({
            entity_id: gallery1.id,
            entity_type: 'Gallery',
            field_name: 'description',
            translated_content: 'Description 1',
            language_code: 'en'
        });
        await Translation.create({
            entity_id: gallery2.id,
            entity_type: 'Gallery',
            field_name: 'title',
            translated_content: 'Gallery 2',
            language_code: 'en'
        });

        const response = await request(app)
            .get('/api/v1/artist/galleries')
            .query({page: 1, limit: 10});

        expect(response.status).toBe(200);
        expect(response.body.galleries.length).toBe(2);
        expect(response.body.galleries).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: gallery1.id,
                title: 'Gallery 1',
                description: 'Description 1',
                status: 'published',
                printCount: 2,
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            }),
            expect.objectContaining({
                id: gallery2.id,
                title: 'Gallery 2',
                description: '',
                status: 'draft',
                printCount: 1,
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        ]));
        expect(response.body.totalCount).toBe(2);
        expect(response.body.currentPage).toBe(1);
        expect(response.body.totalPages).toBe(1);
    });

    it('should handle pagination correctly', async () => {
        for (let i = 1; i <= 15; i++) {
            const gallery = await Gallery.create({
                status: i % 2 === 0 ? 'published' : 'draft'
            });
            await Translation.create({
                entity_id: gallery.id,
                entity_type: 'Gallery',
                field_name: 'title',
                translated_content: `Gallery ${i}`,
                language_code: 'en'
            });
        }

        const response = await request(app)
            .get('/api/v1/artist/galleries')
            .query({page: 2, limit: 10});

        expect(response.status).toBe(200);
        expect(response.body.galleries.length).toBe(5);
        expect(response.body.totalCount).toBe(15);
        expect(response.body.currentPage).toBe(2);
        expect(response.body.totalPages).toBe(2);
    });

    it('should return empty array when there are no galleries', async () => {
        const response = await request(app)
            .get('/api/v1/artist/galleries');

        expect(response.status).toBe(200);
        expect(response.body.galleries).toEqual([]);
        expect(response.body.totalCount).toBe(0);
        expect(response.body.currentPage).toBe(1);
        expect(response.body.totalPages).toBe(0);
    });
});