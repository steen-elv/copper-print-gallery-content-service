const { Gallery, Artwork, Translation } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getArtistGalleries = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        console.log(JSON.stringify(req.artist));
        const { count, rows } = await Gallery.findAndCountAll({
            where: { artist_id: req.artist.id },  // Filter by the authenticated artist's ID
            include: [
                {
                    model: Artwork,
                    attributes: [],
                    through: { attributes: [] }
                },
                {
                    model: Translation,
                    where: {
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
            where: { artist_id: req.artist.id },
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
        console.error('Error in getGalleries:', error);
        next(error);
    }
};