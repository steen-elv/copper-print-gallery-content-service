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
    Translation
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

        validToken = jwt.sign({ sub: 'test-keycloak-id' }, 'any-secret-will-do');
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

        it('should return 400 if title is missing', async () => {
            const response = await request(app)
                .post('/api/v1/artist/galleries')
                .set('Authorization', `Bearer ${validToken}`)
                .send({description: 'Test description'});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({error: 'Title is required'});
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
            await GalleryArtwork.create({ gallery_id: gallery.id, artwork_id: artwork.id, order: 1 });

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
            expect(response.body).toEqual({ error: 'Gallery not found' });
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
            expect(response.body).toEqual({ error: 'Gallery not found' });
        });
    });
    describe('Authentication', () => {
        it('should return 400 if an invalid token format is provided', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries')
                .set('Authorization', 'InvalidToken');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Invalid token format' });
        });

        it('should return 400 if the token is invalid', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries')
                .set('Authorization', 'Bearer invalidtoken');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Invalid token' });
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/artist/galleries');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: 'Authorization header missing' });
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
                    where: { language_code: 'en' },
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
                .send({ title: 'New Title' });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Gallery not found' });
        });

        it('should only update provided fields', async () => {
            const response = await request(app)
                .put(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'New Title' });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('New Title');
            expect(response.body.description).toBe('Original Description');
            expect(response.body.status).toBe('draft');
        });

        it('should handle different languages', async () => {
            await request(app)
                .put(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .query({ language: 'da' })
                .send({ title: 'Dansk Titel', description: 'Dansk Beskrivelse' });

            const responseEn = await request(app)
                .get(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .query({ language: 'en' });

            const responseDa = await request(app)
                .get(`/api/v1/artist/galleries/${testGallery.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .query({ language: 'da' });

            expect(responseEn.body.title).toBe('Original Title');
            expect(responseDa.body.title).toBe('Dansk Titel');
        });
    });
});