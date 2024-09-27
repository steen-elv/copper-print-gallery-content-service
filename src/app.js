// src/app.js

const express = require('express');
const path = require('path');
const OpenApiValidator = require('express-openapi-validator');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const apiSpec = path.join(__dirname, '../api/content-management-public-api-specification.yaml');

app.use(
    OpenApiValidator.middleware({
        apiSpec,
        operationHandlers: path.join(__dirname, 'controllers'),
        validateRequests: true,
        validateResponses: true,
    })
);

// Error handling
app.use(errorHandler);

module.exports = app;