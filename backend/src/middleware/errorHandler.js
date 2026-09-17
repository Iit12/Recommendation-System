import { sendError } from '../utils/apiResponse.js';

/**
 * Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred on the server.';

  // Log in non-production
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return sendError(
    res,
    errorCode,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res) => {
  return sendError(
    res,
    'ENDPOINT_NOT_FOUND',
    `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
    404
  );
};
