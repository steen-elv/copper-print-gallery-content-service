const { Gallery, Artwork, GalleryArtwork, Translation, Artist, Image } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getArtistGalleries = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, language = 'en' } = req.query;
        const offset = (page - 1) * limit;

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        const { count, rows } = await Gallery.findAndCountAll({
            where: { artist_id: artist.id },
            include: [
                {
                    model: Artwork,
                    attributes: [],
                    through: { attributes: [] }
                },
                {
                    model: Translation,
                    where: {
                        language_code: language,
                        field_name: { [Op.in]: ['title', 'description'] }
                    },
                    required: false
                }
            ],
            attributes: [
                'id',
                'status',
                'created_at',
                'updated_at',
                [sequelize.fn('COUNT', sequelize.col('Artworks.id')), 'printCount']
            ],
            group: ['Gallery.id', 'Translations.id'],
            limit: Number(limit),
            offset: Number(offset),
            order: [['updated_at', 'DESC']],
            distinct: true,
            subQuery: false
        });

        const galleries = rows.map(gallery => ({
            id: gallery.id,
            title: gallery.Translations.find(t => t.field_name === 'title')?.translated_content || 'Untitled',
            description: gallery.Translations.find(t => t.field_name === 'description')?.translated_content || '',
            status: gallery.status,
            printCount: Number(gallery.getDataValue('printCount')),
            createdAt: gallery.created_at,
            updatedAt: gallery.updated_at
        }));

        const totalCount = await Gallery.count({
            where: { artist_id: artist.id },
            distinct: true,
            include: [{ model: Artwork, attributes: [] }]
        });

        res.json({
            galleries: galleries,
            totalCount: totalCount,
            currentPage: Number(page),
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (error) {
        next(error);
    }
};

exports.getGallery = async (req, res, next) => {
    try {
        const { galleryId } = req.params;
        const language = req.query.language || 'en';

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        const gallery = await Gallery.findOne({
            where: {
                id: galleryId,
                artist_id: artist.id
            },
            include: [
                {
                    model: Translation,
                    where: {
                        language_code: language,
                        field_name: { [Op.in]: ['title', 'description'] }
                    },
                    required: false
                },
                {
                    model: Artwork,
                    attributes: [],
                    through: { attributes: [] }
                }
            ],
            attributes: [
                'id',
                'status',
                'created_at',
                'updated_at',
                [sequelize.fn('COUNT', sequelize.col('Artworks.id')), 'printCount']
            ],
            group: ['Gallery.id', 'Translations.id']
        });

        if (!gallery) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        const response = {
            id: gallery.id,
            title: gallery.Translations.find(t => t.field_name === 'title')?.translated_content || 'Untitled',
            description: gallery.Translations.find(t => t.field_name === 'description')?.translated_content || '',
            status: gallery.status,
            printCount: Number(gallery.get('printCount')),
            createdAt: gallery.created_at,
            updatedAt: gallery.updated_at
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
};

async function handleTranslation(entityId, entityType, fieldName, content, language, transaction) {
    const [translation, created] = await Translation.findOrCreate({
        where: {
            entity_id: entityId,
            entity_type: entityType,
            field_name: fieldName,
            language_code: language
        },
        defaults: {
            translated_content: content
        },
        transaction
    });

    if (!created && translation.translated_content !== content) {
        await translation.update({ translated_content: content }, { transaction });
    }

    return translation;
}

exports.createGallery = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { title, description, status = 'draft' } = req.body;
        const language = req.query.language || 'en';

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Artist not found' });
        }

        const gallery = await Gallery.create({
            artist_id: artist.id,
            status: status
        }, { transaction });

        await handleTranslation(gallery.id, 'Gallery', 'title', title, language, transaction);

        if (description) {
            await handleTranslation(gallery.id, 'Gallery', 'description', description, language, transaction);
        }

        await transaction.commit();

        const createdGallery = await Gallery.findOne({
            where: { id: gallery.id },
            include: [{
                model: Translation,
                where: { language_code: language },
                required: false
            }]
        });

        res.status(201).json({
            id: createdGallery.id,
            title: createdGallery.Translations.find(t => t.field_name === 'title')?.translated_content || 'Untitled',
            description: createdGallery.Translations.find(t => t.field_name === 'description')?.translated_content || '',
            status: createdGallery.status,
            createdAt: createdGallery.created_at,
            updatedAt: createdGallery.updated_at
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

exports.updateGallery = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { galleryId } = req.params;
        const { title, description, status } = req.body;
        const language = req.query.language || 'en';

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Artist not found' });
        }

        const gallery = await Gallery.findOne({
            where: {
                id: galleryId,
                artist_id: artist.id
            },
            transaction
        });

        if (!gallery) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Gallery not found' });
        }

        if (status) {
            gallery.status = status;
            await gallery.save({ transaction });
        }

        if (title) {
            await handleTranslation(gallery.id, 'Gallery', 'title', title, language, transaction);
        }

        if (description) {
            await handleTranslation(gallery.id, 'Gallery', 'description', description, language, transaction);
        }

        await transaction.commit();

        const updatedGallery = await Gallery.findOne({
            where: { id: galleryId },
            include: [{
                model: Translation,
                where: { language_code: language },
                required: false
            }]
        });

        res.json({
            id: updatedGallery.id,
            title: updatedGallery.Translations.find(t => t.field_name === 'title')?.translated_content || 'Untitled',
            description: updatedGallery.Translations.find(t => t.field_name === 'description')?.translated_content || '',
            status: updatedGallery.status,
            createdAt: updatedGallery.created_at,
            updatedAt: updatedGallery.updated_at
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

exports.getGalleryPrints = async (req, res, next) => {
    try {
        const { galleryId } = req.params;
        const { page = 1, limit = 20, language = 'en' } = req.query;
        const offset = (page - 1) * limit;

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        const gallery = await Gallery.findOne({
            where: {
                id: galleryId,
                artist_id: artist.id
            },
            include: [
                {
                    model: Artwork,
                    through: {
                        model: GalleryArtwork,
                        attributes: ['order']
                    },
                    include: [
                        {
                            model: Translation,
                            where: {
                                language_code: language,
                                field_name: 'title'
                            },
                            required: false
                        },
                        {
                            model: Image,
                            where: { version: 'thumbnail' },
                            required: false
                        }
                    ]
                }
            ],
            order: [[Artwork, GalleryArtwork, 'order', 'ASC']]
        });

        if (!gallery) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        const totalCount = gallery.Artworks.length;
        const paginatedArtworks = gallery.Artworks.slice(offset, offset + Number(limit));

        const prints = paginatedArtworks.map(artwork => ({
            printId: artwork.id,
            title: artwork.Translations[0]?.translated_content || 'Untitled',
            thumbnailUrl: artwork.Images[0]?.public_url || null,
            order: artwork.GalleryArtwork.order
        }));

        res.json({
            prints: prints,
            totalCount: totalCount,
            currentPage: Number(page),
            totalPages: Math.ceil(totalCount / Number(limit))
        });
    } catch (error) {
        console.error('Error in getGalleryPrints:', error);
        next(error);
    }
};