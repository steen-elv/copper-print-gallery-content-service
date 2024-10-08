const { Gallery, Artwork, ArtworkMetadata, GalleryArtwork, Translation, Artist, Image } = require('../models');
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

exports.updatePrintOrder = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { galleryId } = req.params;
        const { printOrders } = req.body;

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Artist not found' });
        }

        const gallery = await Gallery.findOne({
            where: {
                id: galleryId,
                artist_id: artist.id
            }
        });

        if (!gallery) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Gallery not found' });
        }

        // Verify all print IDs belong to this gallery
        const galleryArtworks = await GalleryArtwork.findAll({
            where: { gallery_id: galleryId }
        });
        const galleryPrintIds = new Set(galleryArtworks.map(ga => ga.artwork_id));

        for (const { printId, newOrder } of printOrders) {
            if (!galleryPrintIds.has(printId)) {
                await transaction.rollback();
                return res.status(400).json({ error: `Print with ID ${printId} does not belong to this gallery` });
            }

            await GalleryArtwork.update(
                { order: newOrder },
                {
                    where: {
                        gallery_id: galleryId,
                        artwork_id: printId
                    },
                    transaction
                }
            );
        }

        await transaction.commit();
        res.status(200).json({ message: 'Print order updated successfully' });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

exports.addPrintToGallery = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { galleryId, printId } = req.params;
        const { order } = req.body;

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Artist not found' });
        }

        const gallery = await Gallery.findOne({
            where: {
                id: galleryId,
                artist_id: artist.id
            }
        });

        if (!gallery) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Gallery not found' });
        }

        const artwork = await Artwork.findByPk(printId);
        if (!artwork) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Print not found' });
        }

        const existingGalleryArtwork = await GalleryArtwork.findOne({
            where: {
                gallery_id: galleryId,
                artwork_id: printId
            }
        });

        if (existingGalleryArtwork) {
            await transaction.rollback();
            return res.status(409).json({ error: 'Print already exists in the gallery' });
        }

        // Update order of existing prints if necessary
        if (order) {
            await GalleryArtwork.update(
                { order: sequelize.literal('`order` + 1') },
                {
                    where: {
                        gallery_id: galleryId,
                        order: { [Op.gte]: order }
                    },
                    transaction
                }
            );
        }

        // Add the new print to the gallery
        const maxOrder = await GalleryArtwork.max('order', {
            where: { gallery_id: galleryId }
        });
        const newOrder = order || (maxOrder ? maxOrder + 1 : 1);

        await GalleryArtwork.create({
            gallery_id: galleryId,
            artwork_id: printId,
            order: newOrder
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Print added to gallery successfully' });
    } catch (error) {
        console.log('Error in addPrintToGallery', error);
        await transaction.rollback();
        next(error);
    }
};

exports.removePrintFromGallery = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { galleryId, printId } = req.params;

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Artist not found' });
        }

        const gallery = await Gallery.findOne({
            where: {
                id: galleryId,
                artist_id: artist.id
            }
        });

        if (!gallery) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Gallery not found' });
        }

        const galleryArtwork = await GalleryArtwork.findOne({
            where: {
                gallery_id: galleryId,
                artwork_id: printId
            }
        });

        if (!galleryArtwork) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Print not found in the gallery' });
        }

        const removedOrder = galleryArtwork.order;

        // Remove the print from the gallery
        await galleryArtwork.destroy({ transaction });

        // Update order of remaining prints
        await GalleryArtwork.update(
            { order: sequelize.literal('`order` - 1') },
            {
                where: {
                    gallery_id: galleryId,
                    order: { [Op.gt]: removedOrder }
                },
                transaction
            }
        );

        await transaction.commit();
        res.status(204).send();
    } catch (error) {
        console.error('Error in removePrintFromGallery', error);
        await transaction.rollback();
        next(error);
    }
};

exports.getArtistPrints = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, language = 'en', technique, year, plateType, paperType } = req.query;
        const offset = (page - 1) * limit;

        console.log(`Debug: Page ${page}, Limit ${limit}, Offset ${offset}`);

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        const whereClause = { artist_id: artist.id };
        const metadataWhereClause = {};

        if (technique) metadataWhereClause.technique = technique;
        if (year) metadataWhereClause.year_created = Number(year);
        if (plateType) metadataWhereClause.plate_material = plateType;
        if (paperType) metadataWhereClause.paper_type = paperType;

        console.log('Debug: Where clause', JSON.stringify(whereClause));
        console.log('Debug: Where metadataWhereClause', JSON.stringify(metadataWhereClause));

        // First, get the total count and IDs of artworks
        const { count, rows: artworkIds } = await Artwork.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: ArtworkMetadata,
                    as: 'metadata',
                    where: metadataWhereClause,
                    required: true
                }
            ],
            attributes: ['id'],
            order: [[{ model: ArtworkMetadata, as: 'metadata' }, 'year_created', 'DESC']],
            limit: Number(limit),
            offset: Number(offset),
            distinct: true,
            subQuery: false
        });

        console.log(`Debug: Total count ${count}, Artwork IDs returned [${artworkIds.map(a => a.id)}]`);

        // Now, fetch the full data for these artworks
        const artworks = await Artwork.findAll({
            where: { id: artworkIds.map(a => a.id) },
            include: [
                {
                    model: ArtworkMetadata,
                    as: 'metadata',
                    required: true
                },
                {
                    model: Translation,
                    where: {
                        language_code: language,
                        field_name: { [Op.in]: ['title', 'description'] }
                    },
                    required: false
                },
                {
                    model: Image,
                    where: { version: 'thumbnail' },
                    required: false
                }
            ],
            order: [[{ model: ArtworkMetadata, as: 'metadata' }, 'year_created', 'DESC']]
        });

        const prints = artworks.map(artwork => ({
            id: artwork.id,
            title: artwork.Translations.find(t => t.field_name === 'title')?.translated_content || 'Untitled',
            description: artwork.Translations.find(t => t.field_name === 'description')?.translated_content || '',
            artistName: artwork.metadata.artist_name,
            year: artwork.metadata.year_created,
            medium: artwork.metadata.medium,
            technique: artwork.metadata.technique,
            dimensions: artwork.metadata.dimensions,
            editionInfo: artwork.metadata.edition_info,
            plateType: artwork.metadata.plate_material,
            paperType: artwork.metadata.paper_type,
            inkType: artwork.metadata.ink_type,
            printingPress: artwork.metadata.printing_press,
            availability: artwork.metadata.availability,
            price: artwork.metadata.price,
            thumbnailUrl: artwork.Images[0]?.public_url || null,
            createdAt: artwork.created_at,
            updatedAt: artwork.updated_at
        }));

        console.log(`Debug: Prints mapped ${prints.length}`);
        console.log(`Debug: Prints ${JSON.stringify(prints)}`);

        res.json({
            prints,
            totalCount: count,
            currentPage: Number(page),
            totalPages: Math.ceil(count / Number(limit))
        });
    } catch (error) {
        console.error('Error in getArtistPrints:', error);
        next(error);
    }
};

const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const imageProcessingServiceUrl = process.env.IMAGE_PROCESSING_SERVICE_URL;

exports.createPrint = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const {
            title, description, technique, plateType, dimensions,
            year, editionSize, paperType, inkType, printingPress,
            status = 'draft', artistNotes, language
        } = req.body;

        const image = req.file;
        if (!image) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Image file is required' });
        }

        const artist = await Artist.findOne({ where: { keycloak_id: req.keycloak_id } });
        if (!artist) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Artist not found' });
        }

        const baseImageId = uuidv4();
        const fileExtension = image.originalname.split('.').pop();
        const s3Key = `originals/${artist.id}/${baseImageId}.${fileExtension}`;

        // Upload image to S3
        const putObjectCommand = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
            Body: image.buffer,
            ContentType: image.mimetype
        });
        await s3Client.send(putObjectCommand);

        // Create Artwork
        const artwork = await Artwork.create({
            artist_id: artist.id
        }, { transaction });

        // Create ArtworkMetadata
        await ArtworkMetadata.create({
            artwork_id: artwork.id,
            artist_name: artist.username,
            year_created: year,
            medium: 'Printmaking',
            technique,
            dimensions,
            edition_info: `Edition of ${editionSize}`,
            plate_material: plateType,
            paper_type: paperType,
            ink_type: inkType,
            printing_press: printingPress,
            availability: status,
            price: null // Assuming price is not provided in this endpoint
        }, { transaction });

        // Create Translations
        const usedLanguage = language || artist.default_language;
        await Translation.create({
            entity_id: artwork.id,
            entity_type: 'Artwork',
            field_name: 'title',
            translated_content: title,
            language_code: usedLanguage
        }, { transaction });

        if (description) {
            await Translation.create({
                entity_id: artwork.id,
                entity_type: 'Artwork',
                field_name: 'description',
                translated_content: description,
                language_code: usedLanguage
            }, { transaction });
        }

        // Initiate image processing
        const imageProcessingPayload = {
            baseImageId,
            originalImageReference: `s3://${process.env.S3_BUCKET_NAME}/${s3Key}`
        };

        // In a real scenario, this would be an actual API call
        // For now, we'll just log the payload
        console.log('Initiating image processing with payload:', imageProcessingPayload);

        await transaction.commit();

        res.status(202).json({
            id: artwork.id,
            title,
            description,
            technique,
            plateType,
            dimensions,
            year,
            editionSize,
            paperType,
            inkType,
            printingPress,
            status,
            artistNotes,
            imageProcessingStatus: 'processing',
            baseImageId
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};