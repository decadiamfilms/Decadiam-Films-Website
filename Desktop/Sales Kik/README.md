# SalesKik - Modular Business Platform for SMEs

## 🚀 Quick Start

### Prerequisites Installed ✅
- Node.js (v22.18.0)
- PostgreSQL 16
- npm

### Running the Application

**Option 1: Use the start script (Recommended)**
```bash
./START.sh
```

**Option 2: Manual start**
```bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend
npm run client:dev
```

**Option 3: Run both concurrently**
```bash
npm run dev
```

### Access Points
- 🌐 **Frontend**: http://localhost:3001
- 🔧 **Backend API**: http://localhost:5001
- 💾 **Database GUI**: `npx prisma studio` (opens at http://localhost:5557)

## 📁 Project Structure

```
Sales Kik/
├── server/                 # Backend Node.js/Express API
│   ├── api/               # API route handlers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   └── index.ts          # Server entry point
├── src/                   # Frontend React application
│   ├── components/        # Reusable React components
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   ├── store/            # Redux store and slices
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main React component
├── prisma/
│   └── schema.prisma     # Database schema definition
└── package.json          # Dependencies and scripts
```

## 🔐 Default Credentials

### Database
- **Database**: saleskik
- **User**: saleskik_user
- **Password**: saleskik_password123

### Test Account
Create your first account by:
1. Navigate to http://localhost:3001/register
2. Fill in the registration form
3. First user becomes admin automatically

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run server:dev` | Start backend only |
| `npm run client:dev` | Start frontend only |
| `npm run build` | Build for production |
| `npm run prisma:studio` | Open database GUI |
| `npm run prisma:migrate` | Run database migrations |
| `npm test` | Run tests |

## 📊 Database Management

### View Database
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

### Create New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19, TypeScript, Redux Toolkit, Tailwind CSS
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL 16
- **Authentication**: JWT with refresh tokens
- **Build Tools**: Vite, TypeScript

### Core Modules
- ✅ Authentication & User Management
- ✅ Company Profile & Settings
- ✅ Multi-tenant Architecture
- 🚧 Product Catalog Management
- 🚧 Customer Relationship Management
- 🚧 Quote Builder
- 🚧 Order Management
- 🚧 Invoice Generation
- 🚧 Inventory Management
- 🚧 Job Scheduling

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if ports are in use
lsof -i :3001
lsof -i :5001

# Restart PostgreSQL
brew services restart postgresql@16
```

### Database connection issues
```bash
# Test database connection
node test-db.js

# Check PostgreSQL status
brew services list | grep postgresql
```

### "Error Loading Dashboard - Unable to connect to server"
This is a common issue that can occur when the Vite proxy configuration doesn't match the backend port:

```bash
# 1. Check if both servers are running
npm run dev:safe

# 2. Verify backend is on port 5001 and frontend on port 3001
curl http://localhost:5001/health
curl http://localhost:3001

# 3. Fix the most common cause - Vite proxy port mismatch
# Check vite.config.ts proxy target should be 'http://localhost:5001'
# If it shows 'http://localhost:5000', update it to 'http://localhost:5001'

# 4. If still not working, restore working files from git
git stash  # Save current changes
git checkout HEAD -- server/services/auth.service.ts  # Restore auth service
npm run dev:safe

# 5. Check for authentication middleware issues
# Look for routes with authenticate() middleware that need to be temporarily disabled

# 6. Test endpoints individually
curl http://localhost:5001/api/auth/me
curl http://localhost:5001/api/onboarding/status
```

### Clear all data and start fresh
```bash
# Stop all services
# Press Ctrl+C in terminal running npm run dev

# Reset database
npx prisma migrate reset

# Start again
npm run dev
```

## 📝 Environment Variables

Key environment variables in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Backend server port (5001)
- `NODE_ENV` - Environment (development/production)

## 🚀 Next Steps

1. **Register your first user** at http://localhost:3000/register
2. **Explore the dashboard** after logging in
3. **Configure company settings** in the Settings page
4. **Start adding products and customers**
5. **Create your first quote**

## 📚 Documentation

- [Database Setup Guide](./DATABASE_SETUP.md)
- [API Documentation](http://localhost:5001/api-docs) (coming soon)
- [Component Library](http://localhost:3000/components) (coming soon)

## 🤝 Contributing

This is a proprietary project for SalesKik business operations.

## 📄 License

PROPRIETARY - All rights reserved

---

Built with ❤️ for SMEs by SalesKik Team