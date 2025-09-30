# Multi-stage Docker build for SalesKik Purchase Order System
# Optimized for production deployment with security and performance

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund
RUN npx prisma generate

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files and dependencies
COPY package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build application
RUN npm run build

# Generate Prisma client for production
RUN npx prisma generate

# Stage 3: Production
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Install production system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    tzdata

# Set timezone
ENV TZ=Australia/Sydney
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Create directories for file storage
RUN mkdir -p /app/uploads/purchase-orders /app/uploads/attachments /app/logs
RUN chown -R nextjs:nodejs /app/uploads /app/logs

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Security: Use non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]

# Labels for container management
LABEL maintainer="SalesKik Development Team"
LABEL version="1.0.0"
LABEL description="SalesKik Purchase Order System - Production Container"
LABEL org.opencontainers.image.source="https://github.com/saleskik/purchase-order-system"