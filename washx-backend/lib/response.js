/**
 * Standardized API Response Helpers
 */

function sendSuccess(res, data = null, statusCode = 200, message = null) {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== null && data !== undefined) payload.data = data;
  return res.status(statusCode).json(data !== null && typeof data === 'object' && !Array.isArray(data) && !message ? data : payload);
}

function sendError(res, message = 'An error occurred', statusCode = 500, details = null) {
  const payload = {
    error: message,
    statusCode,
  };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
}

module.exports = {
  sendSuccess,
  sendError,
};
