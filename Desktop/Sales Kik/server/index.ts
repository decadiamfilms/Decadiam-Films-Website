import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './api/auth/auth.routes';
import companyRoutes from './api/company/company.routes';
import userRoutes from './api/users/user.routes';
import productRoutes from './api/products/product.routes';
import customerRoutes from './api/customers/customer.routes';
import quoteRoutes from './api/quotes/quote.routes';
import smsRoutes from './api/quotes/sms.routes';
import emailRoutes from './api/quotes/email.routes';
import publicQuoteRoutes from './api/public/quote.routes';
import orderRoutes from './api/orders/order.routes';
import invoiceRoutes from './api/invoices/invoice.routes';
import enterpriseRoutes from './api/enterprise/enterprise.routes';
import categoryStructureRoutes from './api/categories/category-structure.routes';
import verificationRoutes from './api/auth/verification.routes';
import modulesRoutes from './api/modules/modules.routes';
import onboardingRoutes from './api/onboarding/onboarding.routes';
import claudeRoutes from './api/ai/claude.routes';
import glassRoutes from './api/glass/glass.routes';
import { customPricelistsRoutes, pricingRouter } from './api/custom-pricelists/custom-pricelists.routes';
import transferRoutes from './api/transfers/transfers.routes';
// import stockflowRoutes from './api/stockflow/stockflow.routes';
// import inventoryRoutes from './api/inventory/inventory.routes';
// import purchaseOrderRoutes from './api/purchase-orders/purchase-orders.routes';
// import jobRoutes from './api/jobs/job.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
console.log('CLIENT_URL from env:', process.env.CLIENT_URL);

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/api', rateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', verificationRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/quotes/email', emailRoutes);
app.use('/api/public', publicQuoteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/category', categoryStructureRoutes);
app.use('/api/ai/claude', claudeRoutes);
app.use('/api/glass', glassRoutes);
app.use('/api/custom-pricelists', customPricelistsRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/pricing', pricingRouter);
// app.use('/api/stockflow', stockflowRoutes);
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/purchase-orders', purchaseOrderRoutes);
// app.use('/api/jobs', jobRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
console.log('🔧 Updated auth service running v5');
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
  process.exit(0);
});

export default app;