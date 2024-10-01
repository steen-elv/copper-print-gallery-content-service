const { Gallery, Artwork, ArtworkMetadata, Image, GalleryArtwork, Translation } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getArtistGalleries = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Gallery.findAndCountAll({
            where: { artist_id: req.artist.id },  // Filter by the authenticated artist's ID
            include: [
                {
                    model: Artwork,
                    attributes: [],
                    through: { attributes: [] }
                }
            ],
            attributes: [
                'id',
                'title',
                'description',
                'status',
                'created_at',
                'updated_at',
                [sequelize.fn('COUNT', sequelize.col('Artworks.id')), 'printCount']
            ],
            group: ['Gallery.id'],
            limit: Number(limit),
            offset: Number(offset),
            order: [['updated_at', 'DESC']],
            distinct: true,
            subQuery: false
        });

        const galleries = rows.map(gallery => ({
            id: gallery.id,
            title: gallery.title,
            description: gallery.description,
            status: gallery.status,
            printCount: Number(gallery.getDataValue('printCount')),
            createdAt: gallery.created_at,
            updatedAt: gallery.updated_at
        }));

        res.json({
            galleries: galleries,
            totalCount: count.length,
            currentPage: Number(page),
            totalPages: Math.ceil(count.length / limit)
        });
    } catch (error) {
        next(error);
    }
};

// Implement other endpoints...
