// src/middleware/errorMiddleware.js

const OpenApiValidator = require('express-openapi-validator');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status;
  let message = err.message;
  let errorCode = 'INTERNAL_SERVER_ERROR';

  // Handle OpenApiValidator errors
  if (err instanceof OpenApiValidator.error.BadRequest) {
    statusCode = 400;
    errorCode = 'BAD_REQUEST';
    message = err.message;
  }
  // Handle 404 errors
  else if (err.name === 'NotFoundError' || err.statusCode === 404) {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    // Differentiate between route not found and resource not found
    message = err.resourceNotFound ? err.message : `Not Found - ${req.originalUrl}`;
  }
  // Handle other specific error types here
  // ...

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    }
  });
};

module.exports = { errorHandler };