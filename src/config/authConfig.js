// src/config/authConfig.js

const authRequiredRoutes = [
    '/api/v1/artist/galleries',
    '/api/v1/artist/galleries/:galleryId',
    '/api/v1/artist/galleries/{galleryId}/prints',
    '/api/v1/artist/galleries/{galleryId}/prints/{printId}',
    '/api/v1/artist/prints',
    '/api/v1/artist/prints/{printId}',
];

module.exports = {
    isAuthRequired: (path) => {
        return authRequiredRoutes.some(route => {
            // Convert route pattern to regex
            const regexPattern = new RegExp('^' + route.replace(/:\w+/g, '[^/]+') + '(/|$)');
            return regexPattern.test(path);
        });
    }
};