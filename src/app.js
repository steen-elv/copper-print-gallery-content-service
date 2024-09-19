// src/app.js

const express = require('express');
const path = require('path');
const OpenApiValidator = require('express-openapi-validator');
const publicController = require('./controllers/publicController');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const apiSpec = path.join(__dirname, '../api/content-management-public-api-specification.yaml');

app.use(
    OpenApiValidator.middleware({
        apiSpec,
        validateRequests: true,
        validateResponses: true,
    })
);

// Define your route handlers
app.get('/api/v1/galleries', publicController.getGalleries);
app.get('/api/v1/galleries/:galleryId', publicController.getGallery);
app.get('/api/v1/galleries/:galleryId/prints', publicController.getGalleryPrints);
app.get('/api/v1/prints', publicController.getPrints);
app.get('/api/v1/prints/:printId', publicController.getPrint);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;