# SalesKik - Enhanced Category Editor Development

## Current Status
Authentication flow and server startup reliability improvements completed.

## Features Implemented So Far:
- ✅ Fixed scrolling structure 
- ✅ Added multi-select checkboxes
- ✅ Added bulk duplicate with count
- ✅ Added individual duplicate buttons
- ✅ Fixed Enter key scroll jumping
- ✅ Fixed authentication error handling (no more false 500 errors)
- ✅ Added proper startup scripts for reliable server management

## Authentication Improvements:
- Fixed DashboardRouter.tsx to properly handle missing tokens (redirect to login instead of showing 500 error)
- Improved error messages for network connectivity issues
- Added better token cleanup on authentication failures

## Server Management:
- Created start-dev.sh script for reliable server startup
- Added npm run dev:safe command for enhanced startup process
- Existing npm run dev command still available via concurrently

## 🚨 CRITICAL: "Error Loading Dashboard" Fix
When you see "Unable to connect to server" error, follow these steps in order:

### Root Cause
The error occurs when frontend can't reach backend due to proxy misconfiguration or auth issues.

### Step-by-Step Fix (TESTED WORKING):
1. **Check Vite Proxy Configuration** (Most Common Issue)
   ```bash
   # The problem: vite.config.ts proxy points to wrong port
   # Check: proxy.target should be 'http://localhost:5001' NOT 'http://localhost:5000'
   # Fix: Edit vite.config.ts line ~25: target: 'http://localhost:5001'
   ```

2. **Restart Servers Properly**
   ```bash
   npm run dev:safe  # Use the enhanced startup script
   ```

3. **Check Authentication Middleware**
   - Routes with `router.use(authenticate)` may need temporary disabling
   - Add fallback company IDs for development: `|| '0e573687-3b53-498a-9e78-f198f16f8bcb'`

4. **Verify Individual Endpoints**
   ```bash
   curl http://localhost:5001/health                # Should return {"status":"ok"}
   curl http://localhost:5001/api/auth/me          # Should not return auth error  
   curl http://localhost:5001/api/onboarding/status # Should not return 404
   ```

5. **If Still Failing - Restore Working State**
   ```bash
   git stash                                        # Save current changes
   git checkout HEAD -- server/services/auth.service.ts
   npm run dev:safe
   ```

### Quick Test
- Frontend loads: ✅ http://localhost:3001 should show application
- Backend health: ✅ http://localhost:5001/health should return status OK
- Proxy working: ✅ No 404 errors in browser console for /api/* requests

## Current Challenge:
Complex JSX nesting is causing "Unterminated JSX contents" errors when adding visual drop zone feedback.

## Next Steps:
Instead of complex nested structures, implement simpler visual feedback:
1. Simple border highlighting on hover
2. Basic drop preview messages
3. Color changes for valid drop zones
4. Keep JSX structure minimal and clean

## Backup Files:
- CategoryEditor.broken.tsx (complex version with JSX issues)
- CategoryEditor.backup2.tsx (another attempt)
- BACKUP_20250816_013150/ (working foundation)

## CRITICAL WARNING - Database Schema:
⚠️ **NEVER USE `npx prisma db pull --force`** ⚠️
- This command overwrites our custom Prisma schema with the raw database schema
- It breaks all model names (converts to snake_case) and corrupts TypeScript types  
- It destroys custom relationships and naming conventions
- Always use our existing schema.prisma file which is carefully configured
- If database sync is needed, use `npx prisma db push` instead
- This command caused major breakage on 2025-10-10 and required full rollback

## Recovery Notes:
If database connection fails, do NOT use `prisma db pull`. Instead:
1. Check Supabase dashboard for connection issues
2. Restart development server: `npm run dev`  
3. If needed, use `npx prisma generate` to regenerate client only
4. Our schema.prisma is the source of truth, not the database schema

## Database Backup Strategy:
✅ **Schema Protection**: `prisma/schema.prisma` is versioned in Git
✅ **Data Backup**: Use `node prisma/backup-database.js` to backup all data
✅ **Data Restore**: Use `node prisma/restore-database.js <backup-file.json>` to restore
✅ **Automatic Backups**: Created database-backup-1760149481011.json (5 categories, 13 subcategories)

### Backup Commands:
- **Create backup**: `node prisma/backup-database.js`
- **List backups**: `ls prisma/database-backup-*.json`  
- **Restore backup**: `node prisma/restore-database.js prisma/database-backup-[timestamp].json`

## CRITICAL WARNING - Database Schema:
⚠️ **NEVER USE `npx prisma db pull --force`** ⚠️
- This command overwrites our custom Prisma schema with the raw database schema
- It breaks all model names (converts to snake_case) and corrupts TypeScript types
- It destroys custom relationships and naming conventions 
- Always use our existing schema.prisma file which is carefully configured
- If database sync is needed, use `npx prisma db push` instead
- This command caused major breakage on 2025-10-10 and required full rollback