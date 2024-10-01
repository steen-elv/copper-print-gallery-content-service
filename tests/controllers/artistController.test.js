// tests/controllers/artistController.test.js

const request = require('supertest');
const express = require('express');

jest.mock('../../src/config/database');
const sequelize = require('../../src/config/database');

const {
    Artist,
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
    let testArtist;

    beforeAll(async () => {
        await sequelize.sync({force: true});
    });

    beforeEach(async () => {
        await Artist.destroy({where: {}});
        await Gallery.destroy({where: {}});
        await Artwork.destroy({where: {}});
        await GalleryArtwork.destroy({where: {}});
        await Translation.destroy({where: {}});

        testArtist = await Artist.create({
            id: 1,
            keycloak_id: 'test-keycloak-id',
            username: 'testartist',
            email: 'test@example.com',
            default_language: 'en'
        });

        // app.use((req, res, next) => {
        //     req.artist = testArtist;
        //     next();
        // });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should return galleries with correct pagination', async () => {
        const gallery1 = await Gallery.create({
            id: 1,
            artist_id: testArtist.id,
            status: 'published'
        });
        const gallery2 = await Gallery.create({
            id: 2,
            artist_id: testArtist.id,
            status: 'draft',
        });

        const artwork1 = await Artwork.create({id: 1});
        const artwork2 = await Artwork.create({id: 2});

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
                printCount: 2
            }),
            expect.objectContaining({
                id: gallery2.id,
                title: 'Gallery 2',
                description: '',
                status: 'draft',
                printCount: 1
            })
        ]));
        expect(response.body.totalCount).toBe(2);
        expect(response.body.currentPage).toBe(1);
        expect(response.body.totalPages).toBe(1);
    });

    it('should handle pagination correctly', async () => {
        for (let i = 1; i <= 15; i++) {
            const gallery = await Gallery.create({
                artist_id: testArtist.id,
                status: i % 2 === 0 ? 'published' : 'draft',
                created_at: new Date(`2023-01-${i < 10 ? '0' + i : i}`),
                updated_at: new Date(`2023-01-${i < 10 ? '0' + i : i}`),
                last_indexed: new Date(`2023-01-${i < 10 ? '0' + i : i}`)
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

    it('should return empty array when artist has no galleries', async () => {
        const response = await request(app)
            .get('/api/v1/artist/galleries');

        expect(response.status).toBe(200);
        expect(response.body.galleries).toEqual([]);
        expect(response.body.totalCount).toBe(0);
        expect(response.body.currentPage).toBe(1);
        expect(response.body.totalPages).toBe(0);
    });

    it('should handle language parameter correctly', async () => {
        const gallery = await Gallery.create({
            artist_id: testArtist.id,
            status: 'published',
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-02'),
            last_indexed: new Date('2023-01-02')
        });

        await Translation.create({
            entity_id: gallery.id,
            entity_type: 'Gallery',
            field_name: 'title',
            translated_content: 'Gallery EN',
            language_code: 'en'
        });
        await Translation.create({
            entity_id: gallery.id,
            entity_type: 'Gallery',
            field_name: 'title',
            translated_content: 'Gallery DA',
            language_code: 'da'
        });

        const responseEN = await request(app)
            .get('/api/v1/artist/galleries')
            .query({language: 'en'});

        expect(responseEN.status).toBe(200);
        expect(responseEN.body.galleries[0].title).toBe('Gallery EN');

        const responseDA = await request(app)
            .get('/api/v1/artist/galleries')
            .query({language: 'da'});

        expect(responseDA.status).toBe(200);
        expect(responseDA.body.galleries[0].title).toBe('Gallery DA');
    });
});