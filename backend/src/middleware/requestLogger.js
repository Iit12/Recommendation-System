/**
 * Lightweight Request Logging Middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    
    console.log(
      `[API] ${req.method} ${req.originalUrl} -> ${statusColor}${status}${reset} (${duration}ms)`
    );
  });

  next();
};
