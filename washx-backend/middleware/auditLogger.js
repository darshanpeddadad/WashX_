/**
 * WashX Audit Logger
 * Records security-relevant events to DB (admin actions, auth failures, etc.)
 * and safe console logs (never logs passwords or full tokens).
 */
const prisma = require('../lib/prisma');

// Sanitize request for safe logging — remove sensitive fields
function sanitizeBody(body = {}) {
  const safe = { ...body };
  const SENSITIVE = ['password', 'currentPassword', 'newPassword', 'token', 'razorpay_signature', 'cvv', 'otp'];
  SENSITIVE.forEach((k) => { if (safe[k]) safe[k] = '[REDACTED]'; });
  return safe;
}

// Sanitize headers for safe logging
function sanitizeHeaders(headers = {}) {
  const safe = { ...headers };
  if (safe.authorization) safe.authorization = safe.authorization.startsWith('Bearer ') ? 'Bearer [REDACTED]' : '[REDACTED]';
  if (safe['x-admin-key']) safe['x-admin-key'] = '[REDACTED]';
  return safe;
}

/**
 * HTTP request logger middleware — logs 4xx/5xx with safe context
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    if (status >= 400) {
      const level = status >= 500 ? 'ERROR' : 'WARN';
      console[level === 'ERROR' ? 'error' : 'warn'](
        `[${level}] ${req.method} ${req.originalUrl} → ${status} (${ms}ms) | IP: ${req.ip} | Body: ${JSON.stringify(sanitizeBody(req.body))}`
      );
    }
  });
  next();
}

/**
 * Log an admin action to the AuditLog table (if it exists) or console
 */
async function logAdminAction(adminId, action, details = {}) {
  try {
    // Check if AuditLog model exists before writing
    if (prisma.auditLog) {
      await prisma.auditLog.create({
        data: {
          adminId,
          action,
          details: JSON.stringify(details),
        },
      });
    }
  } catch {
    // Silently fallback to console if table doesn't exist yet
  }
  console.info(`[AUDIT] Admin ${adminId}: ${action}`, details);
}

/**
 * Log a security event (failed logins, rate limit hits, etc.)
 */
function logSecurityEvent(event, context = {}) {
  console.warn(`[SECURITY] ${event}`, sanitizeHeaders(context));
}

module.exports = { requestLogger, logAdminAction, logSecurityEvent, sanitizeBody };
