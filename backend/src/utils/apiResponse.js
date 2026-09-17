/**
 * Standardized API Response Utilities
 */

export const sendSuccess = (res, data, meta = {}, statusCode = 200) => {
  const response = {
    success: true,
    ...meta,
    data,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res, code, message, statusCode = 400, details = null) => {
  const response = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(response);
};
