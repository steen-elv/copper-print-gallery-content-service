const request = require('supertest');
const express = require('express');
const extractJwtInfo = require('../../src/middleware/jwtMiddleware');
const jwt = require('jsonwebtoken');


jest.mock('../../src/config/database');
const sequelize = require('../../src/config/database');

const {
    Artist,
    Gallery,
    GalleryArtwork,
    Artwork,
    Translation,
    Image
} = require('../../src/models/index');

const artistController = require('../../src/controllers/artistController');

const app = express();
app.use(express.json());
// Middleware to inject keycloak_id
app.use(extractJwtInfo);
app.get('/api/v1/artist/galleries', artistController.getArtistGalleries);
app.post('/api/v1/artist/galleries', artistController.createGallery);
app.get('/api/v1/artist/galleries/:galleryId', artistController.getGallery);
app.put('/api/v1/artist/galleries/:galleryId', artistController.updateGallery);
app.get('/api/v1/artist/galleries/:galleryId/prints', artistController.getGalleryPrints);
app.put('/api/v1/artist/galleries/:galleryId/prints', artistController.updatePrintOrder);
app.post('/api/v1/artist/galleries/:galleryId/prints/:printId', artistController.addPrintToGallery);
app.delete('/api/v1/artist/galleries/:galleryId/prints/:printId', artistController.removePrintFromGallery);
app.get('/api/v1/artist/prints', artistController.getArtistPrints);

describe('Artist Controller', () => {
    let testArtist;
    let validToken;

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
            keycloak_id: 'test-keycloak-id',
            username: 'testartist',
            email: 'test@example.com',
            default_language: 'en'
        });

        validToken = jwt.sign({sub: 'test-keycloak-id'}, 'any-secret-will-do');
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('getArtistGalleries', () => {
        it('should return galleries with correct pagination', async () => {
            const gallery1 = await Gallery.create({
                artist_id: testArtist.id,
                status: 'published'
            });
            const gallery2 = await Gallery.create({
                artist_id: testArtist.id,
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
                .set('Authorization', `Bearer ${validToken}`)
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
                    artist_id: testArtist.id,
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
                .set('Authorization', `Bearer ${validToken}`)
                .query({page: 2, limit: 10});

            expect(response.status).toBe(200);
            expect(response.body.galleries.length).toBe(5);
            expect(response.body.totalCount).toBe(15);
            expect(response.body.currentPage).toBe(2);
            expect(response.body.totalPages).toBe(2);
        });

        it('should return empty array when artist has no galleries', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.galleries).toEqual([]);
            expect(response.body.totalCount).toBe(0);
            expect(response.body.currentPage).toBe(1);
            expect(response.body.totalPages).toBe(0);
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({error: 'Authorization header missing'});
        });

        it('should return galleries with correct translations for different languages', async () => {
            // Create galleries with translations
            const gallery1 = await Gallery.create({
                artist_id: testArtist.id,
                status: 'published'
            });
            const gallery2 = await Gallery.create({
                artist_id: testArtist.id,
                status: 'draft'
            });

            // English translations
            await Translation.create({
                entity_id: gallery1.id,
                entity_type: 'Gallery',
                field_name: 'title',
                translated_content: 'Summer Exhibition',
                language_code: 'en'
            });
            await Translation.create({
                entity_id: gallery1.id,
                entity_type: 'Gallery',
                field_name: 'description',
                translated_content: 'A collection of summer-themed prints',
                language_code: 'en'
            });
            await Translation.create({
                entity_id: gallery2.id,
                entity_type: 'Gallery',
                field_name: 'title',
                translated_content: 'Winter Collection',
                language_code: 'en'
            });

            // Danish translations
            await Translation.create({
                entity_id: gallery1.id,
                entity_type: 'Gallery',
                field_name: 'title',
                translated_content: 'Sommerudstilling',
                language_code: 'da'
            });
            await Translation.create({
                entity_id: gallery1.id,
                entity_type: 'Gallery',
                field_name: 'description',
                translated_content: 'En samling af sommertemaede tryk',
                language_code: 'da'
            });
            await Translation.create({
                entity_id: gallery2.id,
                entity_type: 'Gallery',
                field_name: 'title',
                translated_content: 'Vinterkollektion',
                language_code: 'da'
            });

            // Test English translations
            const responseEN = await request(app)
                .get('/api/v1/artist/galleries')
                .set('Authorization', `Bearer ${validToken}`)
                .query({language: 'en'});

            expect(responseEN.status).toBe(200);
            expect(responseEN.body.galleries).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    id: gallery1.id,
                    title: 'Summer Exhibition',
                    description: 'A collection of summer-themed prints',
                    status: 'published'
                }),
                expect.objectContaining({
                    id: gallery2.id,
                    title: 'Winter Collection',
                    description: '',
                    status: 'draft'
                })
            ]));

            // Test Danish translations
            const responseDA = await request(app)
                .get('/api/v1/artist/galleries')
                .set('Authorization', `Bearer ${validToken}`)
                .query({language: 'da'});

            expect(responseDA.status).toBe(200);
            expect(responseDA.body.galleries).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    id: gallery1.id,
                    title: 'Sommerudstilling',
                    description: 'En samling af sommertemaede tryk',
                    status: 'published'
                }),
                expect.objectContaining({
                    id: gallery2.id,
                    title: 'Vinterkollektion',
                    description: '',
                    status: 'draft'
                })
            ]));
        });
    });

    describe('createGallery', () => {

        it('should create a new gallery', async () => {
            const newGallery = {
                title: 'New Test Gallery',
                description: 'This is a test gallery',
                status: 'draft'
            };

            const response = await request(app)
                .post('/api/v1/artist/galleries')
                .set('Authorization', `Bearer ${validToken}`)
                .send(newGallery);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                title: newGallery.title,
                description: newGallery.description,
                status: newGallery.status
            });
            expect(response.body.id).toBeDefined();
            expect(response.body.createdAt).toBeDefined();
            expect(response.body.updatedAt).toBeDefined();
        });

        it('should create a gallery with default draft status if status is not provided', async () => {
            const newGallery = {
                title: 'Test Gallery Without Status'
            };

            const response = await request(app)
                .post('/api/v1/artist/galleries')
                .set('Authorization', `Bearer ${validToken}`)
                .send(newGallery);

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('draft');
        });

        it('should create a new gallery with default language', async () => {
            const newGallery = {
                title: 'New Test Gallery',
                description: 'This is a test gallery',
                status: 'draft'
            };

            const response = await request(app)
                .post('/api/v1/artist/galleries')
                .set('Authorization', `Bearer ${validToken}`)
                .send(newGallery);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                title: newGallery.title,
                description: newGallery.description,
                status: newGallery.status
            });
        });

        it('should create a new gallery with specified language', async () => {
            const newGallery = {
                title: 'Ny Testgalleri',
                description: 'Dette er et testgalleri',
                status: 'draft'
            };

            const response = await request(app)
                .post('/api/v1/artist/galleries')
                .set('Authorization', `Bearer ${validToken}`)
                .query({language: 'da'})
                .send(newGallery);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                title: newGallery.title,
                description: newGallery.description,
                status: newGallery.status
            });
        });
    });

    describe('getGallery', () => {
        it('should return gallery details for the authenticated artist', async () => {
            const gallery = await Gallery.create({
                artist_id: testArtist.id,
                status: 'published'
            });

            await Translation.create({
                entity_id: gallery.id,
                entity_type: 'Gallery',
                field_name: 'title',
                translated_content: 'Test Gallery',
                language_code: 'en'
            });

            await Translation.create({
                entity_id: gallery.id,
                entity_type: 'Gallery',
                field_name: 'description',
                translated_content: 'This is a test gallery',
                language_code: 'en'
            });

            const artwork = await Artwork.create();
            await GalleryArtwork.create({gallery_id: gallery.id, artwork_id: artwork.id, order: 1});

            const response = await request(app)
                .get(`/api/v1/artist/galleries/${gallery.id}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                id: gallery.id,
                title: 'Test Gallery',
                description: 'This is a test gallery',
                status: 'published',
                printCount: 1,
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            });
        });

        it('should return 404 if gallery is not found', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries/99999')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({error: 'Gallery not found'});
        });

        it('should return 404 if gallery belongs to another artist', async () => {
            const otherArtist = await Artist.create({
                keycloak_id: 'other-artist-id',
                username: 'otherartist',
                email: 'other@example.com',
                default_language: 'en'
            });

            const gallery = await Gallery.create({
                artist_id: otherArtist.id,
                status: 'published'
            });

            const response = await request(app)
                .get(`/api/v1/artist/galleries/${gallery.id}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({error: 'Gallery not found'});
        });
    });

    describe('Authentication', () => {
        it('should return 400 if an invalid token format is provided', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries')
                .set('Authorization', 'InvalidToken');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({error: 'Invalid token format'});
        });

        it('should return 400 if the token is invalid', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries')
                .set('Authorization', 'Bearer invalidtoken');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({error: 'Invalid token'});
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({error: 'Authorization header missing'});
        });
    });

    describe('updateGallery', () => {
        let testGallery;

        beforeEach(async () => {
            testGallery = await Gallery.create({
                artist_id: testArtist.id,
                status: 'draft'
            });

            await Translation.create({
                entity_id: testGallery.id,
                entity_type: 'Gallery',
                field_name: 'title',
                translated_content: 'Original Title',
                language_code: 'en'
            });

            await Translation.create({
                entity_id: testGallery.id,
                entity_type: 'Gallery',
                field_name: 'description',
                translated_content: 'Original Description',
                language_code: 'en'
            });
        });

        it('should update gallery details', async () => {
            const updatedDetails = {
                title: 'Updated Title',
                description: 'Updated Description',
                status: 'published'
            };

            const response = await request(app)
                .put(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send(updatedDetails);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                id: testGallery.id,
                title: updatedDetails.title,
                description: updatedDetails.description,
                status: updatedDetails.status
            });

            // Verify the database was actually updated
            const updatedGallery = await Gallery.findByPk(testGallery.id, {
                include: [{
                    model: Translation,
                    where: {language_code: 'en'},
                    required: false
                }]
            });

            expect(updatedGallery.status).toBe(updatedDetails.status);
            const titleTranslation = updatedGallery.Translations.find(t => t.field_name === 'title');
            const descriptionTranslation = updatedGallery.Translations.find(t => t.field_name === 'description');

            expect(titleTranslation?.translated_content).toBe(updatedDetails.title);
            expect(descriptionTranslation?.translated_content).toBe(updatedDetails.description);
        });

        it('should return 404 if gallery is not found', async () => {
            const response = await request(app)
                .put('/api/v1/artist/galleries/99999')
                .set('Authorization', `Bearer ${validToken}`)
                .send({title: 'New Title'});

            expect(response.status).toBe(404);
            expect(response.body).toEqual({error: 'Gallery not found'});
        });

        it('should only update provided fields', async () => {
            const response = await request(app)
                .put(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({title: 'New Title'});

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('New Title');
            expect(response.body.description).toBe('Original Description');
            expect(response.body.status).toBe('draft');
        });

        it('should handle different languages', async () => {
            await request(app)
                .put(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .query({language: 'da'})
                .send({title: 'Dansk Titel', description: 'Dansk Beskrivelse'});

            const responseEn = await request(app)
                .get(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .query({language: 'en'});

            const responseDa = await request(app)
                .get(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .query({language: 'da'});

            expect(responseEn.body.title).toBe('Original Title');
            expect(responseDa.body.title).toBe('Dansk Titel');
        });

        it('should update gallery details with default language', async () => {
            const updatedDetails = {
                title: 'Updated Title',
                description: 'Updated Description',
                status: 'published'
            };

            const response = await request(app)
                .put(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send(updatedDetails);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject(updatedDetails);
        });

        it('should update gallery details with specified language', async () => {
            const updatedDetails = {
                title: 'Opdateret Titel',
                description: 'Opdateret Beskrivelse',
                status: 'published'
            };

            const response = await request(app)
                .put(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .query({language: 'da'})
                .send(updatedDetails);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject(updatedDetails);

            // Verify that English translation remains unchanged
            const englishResponse = await request(app)
                .get(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .query({language: 'en'});

            expect(englishResponse.body.title).toBe('Original Title');
            expect(englishResponse.body.description).toBe('Original Description');
        });
    });

    describe('getGalleryPrints', () => {
        let testGallery;
        let testArtworks;

        beforeEach(async () => {
            testGallery = await Gallery.create({
                artist_id: testArtist.id,
                status: 'published'
            });

            testArtworks = await Promise.all([
                Artwork.create(),
                Artwork.create(),
                Artwork.create()
            ]);

            await Promise.all([
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[0].id, order: 2}),
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[1].id, order: 1}),
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[2].id, order: 3})
            ]);

            await Promise.all(testArtworks.map((artwork, index) =>
                Translation.create({
                    entity_id: artwork.id,
                    entity_type: 'Artwork',
                    field_name: 'title',
                    translated_content: `Artwork ${index + 1}`,
                    language_code: 'en'
                })
            ));

            await Promise.all(testArtworks.map((artwork, index) =>
                Image.create({
                    artwork_id: artwork.id,
                    original_filename: `original_artwork_${index + 1}.jpg`,
                    storage_bucket: 'test-bucket',
                    storage_path: `/artworks/${artwork.id}/thumbnail.jpg`,
                    public_url: `https://cdn.example.com/thumbnails/artwork_${index + 1}.jpg`,
                    width: 200,
                    height: 200,
                    format: 'image/jpeg',
                    file_size: 1024 * 10, // 10KB
                    version: 'thumbnail',
                    status: 'processed'
                })
            ));
        });

        it('should return prints for a gallery with correct order and thumbnail URLs', async () => {
            const response = await request(app)
                .get(`/api/v1/artist/galleries/${testGallery.id}/prints`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.prints).toHaveLength(3);
            expect(response.body.prints[0]).toMatchObject({
                title: 'Artwork 2',
                order: 1,
                thumbnailUrl: 'https://cdn.example.com/thumbnails/artwork_2.jpg'
            });
            expect(response.body.prints[1]).toMatchObject({
                title: 'Artwork 1',
                order: 2,
                thumbnailUrl: 'https://cdn.example.com/thumbnails/artwork_1.jpg'
            });
            expect(response.body.prints[2]).toMatchObject({
                title: 'Artwork 3',
                order: 3,
                thumbnailUrl: 'https://cdn.example.com/thumbnails/artwork_3.jpg'
            });
        });

        it('should handle pagination correctly', async () => {
            const response = await request(app)
                .get(`/api/v1/artist/galleries/${testGallery.id}/prints`)
                .query({page: 1, limit: 2})
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.prints).toHaveLength(2);
            expect(response.body.totalCount).toBe(3);
            expect(response.body.currentPage).toBe(1);
            expect(response.body.totalPages).toBe(2);

            // Check the content of the first page
            expect(response.body.prints[0].title).toBe('Artwork 2');
            expect(response.body.prints[1].title).toBe('Artwork 1');

            // Check the second page
            const secondPageResponse = await request(app)
                .get(`/api/v1/artist/galleries/${testGallery.id}/prints`)
                .query({page: 2, limit: 2})
                .set('Authorization', `Bearer ${validToken}`);

            expect(secondPageResponse.status).toBe(200);
            expect(secondPageResponse.body.prints).toHaveLength(1);
            expect(secondPageResponse.body.prints[0].title).toBe('Artwork 3');
        });

        it('should return 404 if gallery is not found', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries/99999/prints')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({error: 'Gallery not found'});
        });

        it('should return 404 if gallery belongs to another artist', async () => {
            const otherArtist = await Artist.create({
                keycloak_id: 'other-artist-id',
                username: 'otherartist',
                email: 'other@example.com',
                default_language: 'en'
            });

            const otherGallery = await Gallery.create({
                artist_id: otherArtist.id,
                status: 'published'
            });

            const response = await request(app)
                .get(`/api/v1/artist/galleries/${otherGallery.id}/prints`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({error: 'Gallery not found'});
        });
    });

    describe('updatePrintOrder', () => {
        let testGallery;
        let testArtworks;

        beforeEach(async () => {
            testGallery = await Gallery.create({
                artist_id: testArtist.id,
                status: 'published'
            });

            testArtworks = await Promise.all([
                Artwork.create(),
                Artwork.create(),
                Artwork.create()
            ]);

            await Promise.all([
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[0].id, order: 1}),
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[1].id, order: 2}),
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[2].id, order: 3})
            ]);
        });

        it('should update print order successfully', async () => {
            const newOrder = [
                {printId: testArtworks[2].id, newOrder: 1},
                {printId: testArtworks[0].id, newOrder: 2},
                {printId: testArtworks[1].id, newOrder: 3}
            ];

            const response = await request(app)
                .put(`/api/v1/artist/galleries/${testGallery.id}/prints`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({printOrders: newOrder});

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Print order updated successfully');

            // Verify the new order
            const updatedGallery = await Gallery.findOne({
                where: {id: testGallery.id},
                include: [{
                    model: Artwork,
                    through: {attributes: ['order']}
                }],
                order: [[Artwork, GalleryArtwork, 'order', 'ASC']]
            });

            expect(updatedGallery.Artworks[0].id).toBe(testArtworks[2].id);
            expect(updatedGallery.Artworks[1].id).toBe(testArtworks[0].id);
            expect(updatedGallery.Artworks[2].id).toBe(testArtworks[1].id);
        });

        it('should return 404 if gallery is not found', async () => {
            const response = await request(app)
                .put('/api/v1/artist/galleries/99999/prints')
                .set('Authorization', `Bearer ${validToken}`)
                .send({printOrders: []});

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Gallery not found');
        });

        it('should return 400 if a print does not belong to the gallery', async () => {
            const invalidArtwork = await Artwork.create();
            const newOrder = [
                {printId: invalidArtwork.id, newOrder: 1},
                {printId: testArtworks[0].id, newOrder: 2}
            ];

            const response = await request(app)
                .put(`/api/v1/artist/galleries/${testGallery.id}/prints`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({printOrders: newOrder});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(`Print with ID ${invalidArtwork.id} does not belong to this gallery`);
        });
    });

    describe('addPrintToGallery', () => {
        let testGallery;
        let testArtworks;
        let newArtwork;

        beforeEach(async () => {
            testGallery = await Gallery.create({
                artist_id: testArtist.id,
                status: 'published'
            });

            testArtworks = await Promise.all([
                Artwork.create(),
                Artwork.create(),
                Artwork.create()
            ]);

            await Promise.all([
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[0].id, order: 1}),
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[1].id, order: 2}),
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[2].id, order: 3})
            ]);

            newArtwork = await Artwork.create();
        });

        it('should add a print to the gallery successfully', async () => {
            const response = await request(app)
                .post(`/api/v1/artist/galleries/${testGallery.id}/prints/${newArtwork.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({order: 2});

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Print added to gallery successfully');

            // Verify the new order
            const updatedGallery = await Gallery.findOne({
                where: {id: testGallery.id},
                include: [{
                    model: Artwork,
                    through: {attributes: ['order']}
                }],
                order: [[Artwork, GalleryArtwork, 'order', 'ASC']]
            });

            expect(updatedGallery.Artworks).toHaveLength(4);
            expect(updatedGallery.Artworks[0].id).toBe(testArtworks[0].id);
            expect(updatedGallery.Artworks[1].id).toBe(newArtwork.id);
            expect(updatedGallery.Artworks[2].id).toBe(testArtworks[1].id);
            expect(updatedGallery.Artworks[3].id).toBe(testArtworks[2].id);
        });

        it('should add a print to the end if no order is specified', async () => {
            const response = await request(app)
                .post(`/api/v1/artist/galleries/${testGallery.id}/prints/${newArtwork.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(response.status).toBe(201);

            const updatedGallery = await Gallery.findOne({
                where: {id: testGallery.id},
                include: [{
                    model: Artwork,
                    through: {attributes: ['order']}
                }],
                order: [[Artwork, GalleryArtwork, 'order', 'ASC']]
            });

            expect(updatedGallery.Artworks).toHaveLength(4);
            expect(updatedGallery.Artworks[3].id).toBe(newArtwork.id);
            expect(updatedGallery.Artworks[3].GalleryArtwork.order).toBe(4);
        });

        it('should return 404 if gallery is not found', async () => {
            const response = await request(app)
                .post(`/api/v1/artist/galleries/99999/prints/${newArtwork.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({order: 1});

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Gallery not found');
        });

        it('should return 404 if print is not found', async () => {
            const response = await request(app)
                .post(`/api/v1/artist/galleries/${testGallery.id}/prints/99999`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({order: 1});

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Print not found');
        });

        it('should return 409 if print already exists in the gallery', async () => {
            const response = await request(app)
                .post(`/api/v1/artist/galleries/${testGallery.id}/prints/${testArtworks[0].id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({order: 1});

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Print already exists in the gallery');
        });
    });

    describe('removePrintFromGallery', () => {
        let testGallery;
        let testArtworks;

        beforeEach(async () => {
            testGallery = await Gallery.create({
                artist_id: testArtist.id,
                status: 'published'
            });

            testArtworks = await Promise.all([
                Artwork.create(),
                Artwork.create(),
                Artwork.create()
            ]);

            await Promise.all([
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[0].id, order: 1}),
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[1].id, order: 2}),
                GalleryArtwork.create({gallery_id: testGallery.id, artwork_id: testArtworks[2].id, order: 3})
            ]);
        });

        it('should remove a print from the gallery successfully', async () => {
            const response = await request(app)
                .delete(`/api/v1/artist/galleries/${testGallery.id}/prints/${testArtworks[1].id}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(204);

            // Verify the new order
            const updatedGallery = await Gallery.findOne({
                where: {id: testGallery.id},
                include: [{
                    model: Artwork,
                    through: {attributes: ['order']}
                }],
                order: [[Artwork, GalleryArtwork, 'order', 'ASC']]
            });

            expect(updatedGallery.Artworks).toHaveLength(2);
            expect(updatedGallery.Artworks[0].id).toBe(testArtworks[0].id);
            expect(updatedGallery.Artworks[0].GalleryArtwork.order).toBe(1);
            expect(updatedGallery.Artworks[1].id).toBe(testArtworks[2].id);
            expect(updatedGallery.Artworks[1].GalleryArtwork.order).toBe(2);
        });

        it('should return 404 if gallery is not found', async () => {
            const response = await request(app)
                .delete(`/api/v1/artist/galleries/99999/prints/${testArtworks[0].id}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Gallery not found');
        });

        it('should return 404 if print is not found in the gallery', async () => {
            const nonExistentArtwork = await Artwork.create();
            const response = await request(app)
                .delete(`/api/v1/artist/galleries/${testGallery.id}/prints/${nonExistentArtwork.id}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Print not found in the gallery');
        });

        it('should not allow removal from a gallery owned by another artist', async () => {
            const otherArtist = await Artist.create({
                keycloak_id: 'other-artist-id',
                username: 'otherartist',
                email: 'other@example.com',
                default_language: 'en'
            });

            const otherGallery = await Gallery.create({
                artist_id: otherArtist.id,
                status: 'published'
            });

            const response = await request(app)
                .delete(`/api/v1/artist/galleries/${otherGallery.id}/prints/${testArtworks[0].id}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Gallery not found');
        });
    });

    describe('getArtistPrints', () => {
        let artworks;

        beforeEach(async () => {
            await Artwork.destroy({ where: {} });
            await Translation.destroy({ where: {} });
            await Image.destroy({ where: {} });

            artworks = [];
            for (let i = 0; i < 3; i++) {
                const artwork = await Artwork.create({
                    artist_id: testArtist.id,
                    technique: i % 2 === 0 ? 'Etching' : 'Aquatint',
                    plate_type: i % 2 === 0 ? 'Copper' : 'Zinc',
                    year: 2023 - i,
                    paper_type: i % 2 === 0 ? 'Cotton' : 'Rice',
                    status: i % 2 === 0 ? 'published' : 'draft'
                });
                artworks.push(artwork);

                await Translation.create({
                    entity_id: artwork.id,
                    entity_type: 'Artwork',
                    field_name: 'title',
                    translated_content: `Artwork ${artwork.id} Title`,
                    language_code: 'en'
                });
                await Translation.create({
                    entity_id: artwork.id,
                    entity_type: 'Artwork',
                    field_name: 'description',
                    translated_content: `Artwork ${artwork.id} Description`,
                    language_code: 'en'
                });
                await Image.create({
                    artwork_id: artwork.id,
                    original_filename: `original_${artwork.id}.jpg`,
                    storage_bucket: 'test-bucket',
                    storage_path: `/artworks/${artwork.id}/thumbnail.jpg`,
                    public_url: `https://example.com/thumbnail_${artwork.id}.jpg`,
                    width: 200,
                    height: 200,
                    format: 'image/jpeg',
                    file_size: 1024 * 10, // 10KB
                    version: 'thumbnail',
                    status: 'processed'
                });

                // Add a small delay to ensure distinct createdAt timestamps
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        });

        it('should return all prints for the authenticated artist', async () => {
            const response = await request(app)
                .get('/api/v1/artist/prints')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.prints).toHaveLength(artworks.length);
            expect(response.body.totalCount).toBe(artworks.length);
            expect(response.body.currentPage).toBe(1);
            expect(response.body.totalPages).toBe(1);

            // The prints should be ordered by created_at DESC, so the last created artwork should be first
            const lastCreatedArtwork = artworks[artworks.length - 1];
            expect(response.body.prints[0]).toMatchObject({
                id: lastCreatedArtwork.id,
                title: `Artwork ${lastCreatedArtwork.id} Title`,
                description: `Artwork ${lastCreatedArtwork.id} Description`,
                technique: lastCreatedArtwork.technique,
                plateType: lastCreatedArtwork.plate_type,
                year: lastCreatedArtwork.year,
                paperType: lastCreatedArtwork.paper_type,
                status: lastCreatedArtwork.status,
                thumbnailUrl: `https://example.com/thumbnail_${lastCreatedArtwork.id}.jpg`
            });
        });

        it('should handle pagination correctly', async () => {
            const response = await request(app)
                .get('/api/v1/artist/prints')
                .query({page: 1, limit: 2})
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.prints).toHaveLength(2);
            expect(response.body.totalCount).toBe(3);
            expect(response.body.currentPage).toBe(1);
            expect(response.body.totalPages).toBe(2);
        });

        it('should filter prints correctly', async () => {
            const response = await request(app)
                .get('/api/v1/artist/prints')
                .query({technique: 'Aquatint', year: 2022})
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.prints).toHaveLength(1);
            expect(response.body.prints[0].technique).toBe('Aquatint');
            expect(response.body.prints[0].year).toBe(2022);
        });

        it('should return 404 if artist is not found', async () => {
            const invalidToken = jwt.sign({sub: 'invalid-id'}, 'test-secret');
            const response = await request(app)
                .get('/api/v1/artist/prints')
                .set('Authorization', `Bearer ${invalidToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Artist not found');
        });
    });
});

