// tests/controllers/publicController.test.js

const request = require('supertest');
const express = require('express');

// Use the manual mock for the database configuration
jest.mock('../../src/config/database');

// Import the mocked sequelize instance
const sequelize = require('../../src/config/database');

// Import models after mocking the database
const {
    Artist,
    Gallery,
    GalleryArtwork,
    Artwork,
    Translation,
    Image,
    ArtworkMetadata
} = require('../../src/models/index');

// Import the controller
const publicController = require('../../src/controllers/publicController');

const app = express();
app.use(express.json());
app.get('/api/v1/galleries/:galleryId/prints', publicController.getPrints);

describe('getPrints', () => {
    beforeAll(async () => {
        await sequelize.sync({force: true});
    });

    beforeEach(async () => {
        await Artwork.destroy({where: {}});
        await Translation.destroy({where: {}});
        await Image.destroy({where: {}});
        await ArtworkMetadata.destroy({where: {}});
        await Artist.destroy({where: {}});
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should return prints with correct pagination', async () => {
        // Create an artist first
        const artist = await Artist.create({
            keycloak_id: 'kc123',
            username: 'testartist',
            email: 'test@example.com',
            default_language: 'en'
        });

        const gallery = await Gallery.create({id: 1, artist_id: artist.id})

        // Create test data
        const artwork1 = await Artwork.create({id: 1});
        const artwork2 = await Artwork.create({id: 2});

        await GalleryArtwork.create({id: 1, gallery_id: gallery.id, artwork_id: artwork1.id, order: 1});
        await GalleryArtwork.create({id: 2, gallery_id: gallery.id, artwork_id: artwork2.id, order: 2});

        await ArtworkMetadata.create({
            artwork_id: 1,
            artist_name: 'test artist',
            technique: 'etching',
            year_created: 2023,
            plate_material: 'copper',
            paper_type: 'cotton'
        });
        await ArtworkMetadata.create({
            artwork_id: 2,
            artist_name: 'test artist',
            technique: 'aquatint',
            year_created: 2022,
            plate_material: 'zinc',
            paper_type: 'washi'
        });

        await Translation.create({
            entity_id: 1,
            entity_type: 'Artwork',
            field_name: 'title',
            translated_content: 'Print 1',
            language_code: 'en'
        });
        await Translation.create({
            entity_id: 2,
            entity_type: 'Artwork',
            field_name: 'title',
            translated_content: 'Print 2',
            language_code: 'en'
        });

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
            .get('/api/v1/galleries/1/prints')
            .query({page: 1, limit: 10});

        expect(response.status).toBe(200);
        expect(response.body.prints.length).toBe(2);
        expect(response.body.prints).toEqual(expect.arrayContaining([
            {id: 1, title: 'Print 1', thumbnailUrl: 'url1'},
            {id: 2, title: 'Print 2', thumbnailUrl: 'url2'}
        ]));
        expect(response.body.totalCount).toEqual(2);
        expect(response.body.currentPage).toEqual(1);
        expect(response.body.totalPages).toEqual(1);
    });

    it('should handle query parameters correctly', async () => {
        // Create an artist first
        const artist = await Artist.create({
            keycloak_id: 'kc123',
            username: 'testartist',
            email: 'test@example.com',
            default_language: 'en'
        });

        const gallery = await Gallery.create({id: 1, artist_id: artist.id})

        // Create test data with specific attributes
        const artwork = await Artwork.create({
            id: 1
        });
        await ArtworkMetadata.create({
            artwork_id: 1,
            artist_name: 'test artist',
            technique: 'etching',
            year_created: 2023,
            plate_material: 'copper',
            paper_type: 'cotton'
        });
        await Translation.create({
            entity_id: 1,
            entity_type: 'Artwork',
            field_name: 'title',
            translated_content: 'Etching Print',
            language_code: 'en'
        });
        await Image.create({
            artwork_id: 1,
            version: 'thumbnail',
            public_url: 'url1',
            original_filename: 'image1.jpg',
            storage_bucket: 'test-bucket',
            storage_path: '/path/to/image1.jpg',
            status: 'active'
        });

        // Create another artwork that doesn't match the query parameters
        const artwork2 = await Artwork.create({
            id: 2
        });
        await ArtworkMetadata.create({
            artwork_id: 2,
            artist_name: 'test artist 2',
            technique: 'aquatint',
            year_created: 2022,
            plate_material: 'zinc',
            paper_type: 'washi'
        });
        await Translation.create({
            entity_id: 2,
            entity_type: 'Artwork',
            field_name: 'title',
            translated_content: 'Aquatint Print',
            language_code: 'en'
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

        await GalleryArtwork.create({id: 1, gallery_id: gallery.id, artwork_id: artwork.id, order: 1});
        await GalleryArtwork.create({id: 2, gallery_id: gallery.id, artwork_id: artwork2.id, order: 2});


        const response = await request(app)
            .get('/api/v1/galleries/1/prints')
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
        expect(response.body.totalCount).toBe(1);
    });

    it('should handle pagination correctly', async () => {
        const artist = await Artist.create({
            keycloak_id: 'kc123',
            username: 'testartist',
            email: 'test@example.com',
            default_language: 'en'
        });

        const gallery = await Gallery.create({id: 1, artist_id: artist.id})

        // Create 15 prints
        for (let i = 1; i <= 15; i++) {
            const artwork = await Artwork.create({id: i});
            await GalleryArtwork.create({
                id: 1,
                gallery_id: gallery.id,
                artwork_id: artwork.id,
                order: i
            });
            await ArtworkMetadata.create({
                artwork_id: i,
                artist_name: 'test artist',
                technique: 'etching',
                year_created: 2023,
                plate_material: 'copper',
                paper_type: 'cotton'
            });
            await Translation.create({
                entity_id: i,
                entity_type: 'Artwork',
                field_name: 'title',
                translated_content: `Print ${i}`,
                language_code: 'en'
            });
            await Image.create({
                artwork_id: i,
                version: 'thumbnail',
                public_url: `url${i}`,
                original_filename: `image${i}.jpg`,
                storage_bucket: 'test-bucket',
                storage_path: `/path/to/image${i}.jpg`,
                status: 'active'
            });
        }

        const response = await request(app)
            .get('/api/v1/galleries/1/prints')
            .query({page: 2, limit: 10});

        expect(response.status).toBe(200);
        expect(response.body.prints).toHaveLength(5);
        expect(response.body.currentPage).toBe(2);
        expect(response.body.totalPages).toBe(2);
        expect(response.body.totalCount).toBe(15);
    });

    it('should return empty array when no prints are available', async () => {
        const response = await request(app)
            .get('/api/v1/galleries/1/prints');

        expect(response.status).toBe(200);
        expect(response.body.prints).toEqual([]);
        expect(response.body.totalCount).toBe(0);
        expect(response.body.currentPage).toBe(1);
        expect(response.body.totalPages).toBe(0);
    });

    it('should handle language parameter correctly', async () => {
        const artist = await Artist.create({
            keycloak_id: 'kc123',
            username: 'testartist',
            email: 'test@example.com',
            default_language: 'en'
        });
        const gallery = await Gallery.create({id: 1, artist_id: artist.id})
        const artwork = await Artwork.create({id: 1});
        await GalleryArtwork.create({
            id: 1,
            gallery_id: gallery.id,
            artwork_id: artwork.id,
            order: 1
        });
        await ArtworkMetadata.create({
            artwork_id: 1,
            artist_name: 'test artist',
            technique: 'etching',
            year_created: 2023,
            plate_material: 'copper',
            paper_type: 'cotton'
        });
        await Translation.create({
            entity_id: 1,
            entity_type: 'Artwork',
            field_name: 'title',
            translated_content: 'Print EN',
            language_code: 'en'
        });
        await Translation.create({
            entity_id: 1,
            entity_type: 'Artwork',
            field_name: 'title',
            translated_content: 'Print DA',
            language_code: 'da'
        });
        await Image.create({
            artwork_id: 1,
            version: 'thumbnail',
            public_url: 'url1',
            original_filename: 'image1.jpg',
            storage_bucket: 'test-bucket',
            storage_path: '/path/to/image1.jpg',
            status: 'active'
        });

        const responseEN = await request(app)
            .get('/api/v1/galleries/1/prints')
            .query({language: 'en'});

        expect(responseEN.status).toBe(200);
        expect(responseEN.body.prints[0].title).toBe('Print EN');

        const responseDA = await request(app)
            .get('/api/v1/galleries/1/prints')
            .query({language: 'da'});

        expect(responseDA.status).toBe(200);
        expect(responseDA.body.prints[0].title).toBe('Print DA');
    });
});