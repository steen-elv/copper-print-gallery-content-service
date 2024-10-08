// src/app.js

const express = require('express');
const path = require('path');
const multer = require('multer');
const OpenApiValidator = require('express-openapi-validator');
const { errorHandler } = require('./middleware/errorMiddleware');
const extractJwtInfo = require('./middleware/jwtMiddleware');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Apply the JWT middleware to all routes
app.use(extractJwtInfo);

const apiSpecs = [
    path.join(__dirname, '../api/content-management-public-api-specification.yaml'),
    path.join(__dirname, '../api/content-management-artist-api-specification.yaml')

];

for (const apiSpec of apiSpecs) {
    app.use(
        OpenApiValidator.middleware({
            apiSpec: apiSpec,
            operationHandlers: path.join(__dirname, 'controllers'),
            validateRequests: true,
            validateResponses: true,
            fileUploader: {
                storage: multer.memoryStorage(),
                limits: {
                    fileSize: 50 * 1024 * 1024, // 5MB limit
                },
            },
        })
    );
}

// Error handling
app.use(errorHandler);

module.exports = app;