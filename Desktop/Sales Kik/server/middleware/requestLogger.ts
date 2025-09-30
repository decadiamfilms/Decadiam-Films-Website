import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  
  const start = Date.now();
  
  // Log request
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Request ID: ${requestId}`);
  }
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms - Request ID: ${requestId}`
      );
    }
  });
  
  next();
};