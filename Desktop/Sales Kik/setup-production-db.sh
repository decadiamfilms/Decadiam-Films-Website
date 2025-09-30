#!/bin/bash

# Production Database Setup Script for SalesKik
# NON-DISRUPTIVE: Does not affect development database

echo "🗄️  Setting up SalesKik Production Database"

# Production database configuration
PROD_DB_NAME="saleskik_production"
PROD_DB_USER="saleskik_prod"
PROD_DB_PASSWORD="saleskik_secure_prod_password_2024"

echo "📊 Creating production database..."

# Create production database (if it doesn't exist)
createdb $PROD_DB_NAME 2>/dev/null && echo "✅ Database '$PROD_DB_NAME' created" || echo "ℹ️  Database '$PROD_DB_NAME' already exists"

# Create production user (if it doesn't exist)
psql $PROD_DB_NAME -c "CREATE USER $PROD_DB_USER WITH PASSWORD '$PROD_DB_PASSWORD';" 2>/dev/null && echo "✅ User '$PROD_DB_USER' created" || echo "ℹ️  User '$PROD_DB_USER' already exists"

# Grant privileges
psql $PROD_DB_NAME -c "GRANT ALL PRIVILEGES ON DATABASE $PROD_DB_NAME TO $PROD_DB_USER;" && echo "✅ Privileges granted"

# Grant schema privileges
psql $PROD_DB_NAME -c "GRANT ALL ON SCHEMA public TO $PROD_DB_USER;" && echo "✅ Schema privileges granted"

# Set production DATABASE_URL for migrations
export DATABASE_URL="postgresql://$PROD_DB_USER:$PROD_DB_PASSWORD@localhost:5432/$PROD_DB_NAME?schema=public"

echo "🔧 Running database migrations..."
DATABASE_URL=$DATABASE_URL npx prisma migrate deploy && echo "✅ Migrations completed successfully"

echo ""
echo "✅ Production Database Setup Complete!"
echo ""
echo "📊 Production Database Details:"
echo "  🗄️  Database: $PROD_DB_NAME"
echo "  👤 User: $PROD_DB_USER"
echo "  🔗 URL: postgresql://$PROD_DB_USER:***@localhost:5432/$PROD_DB_NAME"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update .env.production with this DATABASE_URL"
echo "  2. Test connection with production environment"
echo "  3. Migrate admin settings and company data"
echo ""
echo "⚠️  Important:"
echo "  • Development database remains unchanged"
echo "  • Development environment continues working normally"
echo "  • This setup is for production deployment only"