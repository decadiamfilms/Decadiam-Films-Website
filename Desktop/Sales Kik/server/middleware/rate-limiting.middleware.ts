import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiting Middleware - 2025 Production Security
 * Protects against brute force attacks and API abuse
 */

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    console.log('🚫 Rate limit exceeded for IP:', req.ip);
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    console.log('🚫 Auth rate limit exceeded for IP:', req.ip);
    res.status(429).json({
      success: false,
      error: 'Too many login attempts from this IP, please try again after 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

// Very strict rate limiting for password reset and 2FA
export const securityRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 security attempts per 5 minutes
  message: {
    success: false,
    error: 'Too many security attempts from this IP, please try again after 5 minutes.',
    code: 'SECURITY_RATE_LIMIT_EXCEEDED'
  },
  handler: (req: Request, res: Response) => {
    console.log('🚫 Security rate limit exceeded for IP:', req.ip);
    res.status(429).json({
      success: false,
      error: 'Too many security attempts from this IP, please try again after 5 minutes.',
      code: 'SECURITY_RATE_LIMIT_EXCEEDED',
      retryAfter: '5 minutes'
    });
  }
});

// Moderate rate limiting for data modification endpoints
export const dataModificationRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 data modification requests per minute
  message: {
    success: false,
    error: 'Too many data modification requests, please slow down.',
    code: 'DATA_MODIFICATION_RATE_LIMIT_EXCEEDED'
  },
  skip: (req: Request) => req.method === 'GET', // Only limit POST, PUT, DELETE
  handler: (req: Request, res: Response) => {
    console.log('🚫 Data modification rate limit exceeded for IP:', req.ip);
    res.status(429).json({
      success: false,
      error: 'Too many data modification requests, please slow down.',
      code: 'DATA_MODIFICATION_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute'
    });
  }
});

// Lenient rate limiting for read-only operations
export const readOnlyRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 read requests per minute
  message: {
    success: false,
    error: 'Too many requests, please slow down.',
    code: 'READ_RATE_LIMIT_EXCEEDED'
  },
  skip: (req: Request) => req.method !== 'GET', // Only limit GET requests
  handler: (req: Request, res: Response) => {
    console.log('🚫 Read rate limit exceeded for IP:', req.ip);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please slow down.',
      code: 'READ_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute'
    });
  }
});

/**
 * Apply appropriate rate limiting based on endpoint type
 */
export const smartRateLimit = (endpointType: 'auth' | 'security' | 'data' | 'read' | 'general') => {
  switch (endpointType) {
    case 'auth':
      return authRateLimit;
    case 'security':
      return securityRateLimit;
    case 'data':
      return dataModificationRateLimit;
    case 'read':
      return readOnlyRateLimit;
    case 'general':
    default:
      return generalRateLimit;
  }
};

/**
 * Rate limiting configuration for different environments
 */
export const getRateLimitConfig = (environment: 'development' | 'staging' | 'production' = 'development') => {
  const configs = {
    development: {
      general: { windowMs: 15 * 60 * 1000, max: 1000 }, // Very lenient for development
      auth: { windowMs: 15 * 60 * 1000, max: 50 },
      security: { windowMs: 5 * 60 * 1000, max: 10 }
    },
    staging: {
      general: { windowMs: 15 * 60 * 1000, max: 500 },
      auth: { windowMs: 15 * 60 * 1000, max: 25 },
      security: { windowMs: 5 * 60 * 1000, max: 5 }
    },
    production: {
      general: { windowMs: 15 * 60 * 1000, max: 100 },
      auth: { windowMs: 15 * 60 * 1000, max: 10 },
      security: { windowMs: 5 * 60 * 1000, max: 3 }
    }
  };

  return configs[environment];
};