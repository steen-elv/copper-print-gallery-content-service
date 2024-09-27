// src/middleware/errorMiddleware.js

const OpenApiValidator = require('express-openapi-validator');

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errorCode = 'INTERNAL_SERVER_ERROR';

  // Handle OpenApiValidator errors
  if (err instanceof OpenApiValidator.error.BadRequest) {
    statusCode = 400;
    errorCode = 'BAD_REQUEST';
    // The error message from OpenApiValidator is typically well-formatted,
    // but you can customize it further if needed
    message = err.message;
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

module.exports = { notFound, errorHandler };