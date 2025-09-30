import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const windowMs = (parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000); // minutes to ms
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  
  const key = req.ip || 'unknown';
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitMap.get(key);
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }
  
  entry.count++;
  rateLimitMap.set(key, entry);
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k);
      }
    }
  }
  
  // Check rate limit
  if (entry.count > maxRequests) {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
    return;
  }
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
  res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
  
  next();
};