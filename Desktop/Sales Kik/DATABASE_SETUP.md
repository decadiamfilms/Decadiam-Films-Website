# SalesKik Database Setup Guide

## ✅ Setup Complete!

Your PostgreSQL database has been successfully configured for the SalesKik project.

## Database Details

- **Database Name**: `saleskik`
- **Username**: `saleskik_user`
- **Password**: `saleskik_password123`
- **Host**: `localhost`
- **Port**: `5432`
- **Connection URL**: `postgresql://saleskik_user:saleskik_password123@localhost:5432/saleskik?schema=public`

## PostgreSQL Commands

### Start PostgreSQL Service
```bash
brew services start postgresql@16
```

### Stop PostgreSQL Service
```bash
brew services stop postgresql@16
```

### Check PostgreSQL Status
```bash
brew services list | grep postgresql
```

### Access PostgreSQL Console
```bash
/opt/homebrew/opt/postgresql@16/bin/psql -d saleskik -U saleskik_user
```

## Prisma Commands

### Run Migrations
```bash
npx prisma migrate dev
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Open Prisma Studio (Database GUI)
```bash
npx prisma studio
```
This will open a browser at http://localhost:5557 where you can view and edit your database.

### Reset Database (Caution!)
```bash
npx prisma migrate reset
```

## Environment Variables

Your `.env` file has been configured with:
- Secure database connection string
- Cryptographically secure JWT secrets
- All necessary configuration for development

## Quick Start

1. **Start the backend server**:
   ```bash
   npm run server:dev
   ```

2. **Start the frontend development server** (in a new terminal):
   ```bash
   npm run client:dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

## Testing the Setup

Run the included test script to verify database connectivity:
```bash
node test-db.js
```

## Database Schema

The database includes the following main tables:
- **Companies**: Multi-tenant company profiles
- **Users**: User accounts with authentication
- **UserGroups**: Permission groups for access control
- **Products**: Product catalog with categories and pricing
- **Customers**: Customer management with contacts
- **Quotes**: Sales quotations with line items
- **Orders**: Order management with status tracking
- **Invoices**: Invoice generation and payment tracking
- **Inventory**: Stock levels and movements across locations
- **Jobs**: Job scheduling and time tracking

## Troubleshooting

### PostgreSQL won't start
```bash
# Check if another instance is running
lsof -i :5432

# Force restart
brew services restart postgresql@16
```

### Permission denied errors
```bash
# Grant all permissions to user
/opt/homebrew/opt/postgresql@16/bin/psql -d postgres -c "ALTER USER saleskik_user CREATEDB;"
```

### Reset everything and start fresh
```bash
# Stop PostgreSQL
brew services stop postgresql@16

# Drop and recreate database
/opt/homebrew/opt/postgresql@16/bin/dropdb saleskik
/opt/homebrew/opt/postgresql@16/bin/createdb saleskik

# Run migrations
npx prisma migrate dev
```

## Security Notes

⚠️ **Important for Production**:
- Change the database password before deploying
- Update JWT secrets with new random values
- Use environment-specific .env files
- Never commit .env files to version control
- Enable SSL for database connections in production

## Next Steps

1. Create your first user account via the registration page
2. Start building out the modules (Products, Customers, Quotes, etc.)
3. Customize the company settings
4. Enable the modules you need

---

Database setup completed on: August 12, 2025