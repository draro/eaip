# Winston Logging Troubleshooting Guide

## Problem: Logs are not being written to MongoDB

If you're not seeing logs in the `auditlogs` collection, follow this troubleshooting guide.

## Quick Diagnostics

### 1. Check Environment Variables

**Check if MONGODB_URI is set:**

```bash
# In your project root
grep MONGODB_URI .env
```

**Expected output:**
```
MONGODB_URI=mongodb://localhost:27017/eaip
```

**If not found, add it to your .env file:**

```bash
# Add this line to your .env file
MONGODB_URI=mongodb://localhost:27017/eaip

# Or for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eaip
```

### 2. Verify MongoDB is Running

**For local MongoDB:**

```bash
# Check if MongoDB is running
sudo systemctl status mongod
# Or
ps aux | grep mongod

# If not running, start it:
sudo systemctl start mongod
```

**For MongoDB Atlas:**
- Check your connection string is correct
- Verify network access settings allow your IP
- Check database user credentials

### 3. Test the Logger

**Option A: Use the Test API Endpoint**

```bash
# Start your dev server
npm run dev

# In another terminal, call the test endpoint:
curl http://localhost:3000/api/test-logging
```

This will create 8 test log entries. Check the response for instructions on verifying logs.

**Option B: Use the Test Script**

```bash
# Run the test script
npx ts-node scripts/test-winston-logging.ts
```

This will check your configuration and create test logs.

### 4. Verify Logs in MongoDB

**MongoDB Shell:**

```bash
# Connect to MongoDB
mongo eaip

# Check if auditlogs collection exists
show collections

# Count logs
db.auditlogs.count()

# View recent logs
db.auditlogs.find().sort({ timestamp: -1 }).limit(5).pretty()
```

**MongoDB Compass:**
1. Connect to your MongoDB instance
2. Select `eaip` database
3. Look for `auditlogs` collection
4. Browse documents

**Logs Viewer UI:**
1. Navigate to: `http://localhost:3000/admin/logs`
2. Login as super_admin or org_admin
3. You should see logs in the table

## Common Issues and Solutions

### Issue 1: MONGODB_URI not set

**Symptom:**
- No logs appearing in MongoDB
- Console shows: "Winston configured without MongoDB"
- Logger works in console but not in database

**Solution:**
```bash
# Add to .env file
MONGODB_URI=mongodb://localhost:27017/eaip

# Restart your Next.js server
npm run dev
```

**Verify it's loaded:**
```bash
# In your app, check:
console.log('MONGODB_URI set:', !!process.env.MONGODB_URI);
```

### Issue 2: MongoDB Connection Error

**Symptom:**
- Error: "MongoError: failed to connect to server"
- Logs appear in console but not in database

**Solution:**

1. **Check MongoDB is running:**
   ```bash
   sudo systemctl status mongod
   ```

2. **Test connection manually:**
   ```bash
   mongo mongodb://localhost:27017/eaip
   ```

3. **Check firewall:**
   ```bash
   # Allow MongoDB port
   sudo ufw allow 27017/tcp
   ```

4. **Check MongoDB logs:**
   ```bash
   sudo tail -f /var/log/mongodb/mongod.log
   ```

### Issue 3: Wrong Database Name

**Symptom:**
- Logs are written but in wrong database
- Can't find `auditlogs` collection in `eaip` database

**Solution:**

1. **Check your MONGODB_URI:**
   ```bash
   # Should end with /eaip
   MONGODB_URI=mongodb://localhost:27017/eaip
   #                                        ^^^^
   ```

2. **List all databases:**
   ```bash
   mongo
   show dbs
   ```

3. **Search for auditlogs in other databases:**
   ```bash
   mongo
   use test
   show collections
   use admin
   show collections
   ```

### Issue 4: Winston-MongoDB Package Issue

**Symptom:**
- TypeError: MongoDB is not a constructor
- Import errors

**Solution:**

1. **Verify package is installed:**
   ```bash
   npm list winston-mongodb
   ```

2. **Reinstall if needed:**
   ```bash
   npm uninstall winston-mongodb
   npm install winston-mongodb@latest
   ```

3. **Check import in logger.ts:**
   ```typescript
   // Should be named import, not default:
   import { MongoDB } from 'winston-mongodb';

   // NOT:
   import MongoDB from 'winston-mongodb';
   ```

### Issue 5: Logs Only in Console, Not Database

**Symptom:**
- Logs appear in console/terminal
- No logs in MongoDB
- Collection doesn't exist

**Solution:**

This means Winston Console transport works but MongoDB transport doesn't.

1. **Check winston-mongodb is added to transports:**
   ```typescript
   // In src/lib/logger.ts
   if (process.env.MONGODB_URI) {
     transports.push(
       new MongoDB({
         db: process.env.MONGODB_URI,
         collection: 'auditlogs',
         // ...
       })
     );
   }
   ```

2. **Verify MONGODB_URI in runtime:**
   ```typescript
   // Add temporary debug log
   console.log('MongoDB transport enabled:', !!process.env.MONGODB_URI);
   ```

3. **Check Winston initialization:**
   ```bash
   # Look for errors during startup
   npm run dev | grep -i mongo
   ```

### Issue 6: Collection Created but Empty

**Symptom:**
- `auditlogs` collection exists
- Collection has 0 documents
- No errors in console

**Solution:**

1. **Verify logger is actually being used:**
   ```bash
   # Search for logger imports
   grep -r "from '@/lib/logger'" src/
   ```

2. **If no results, logger isn't being used yet:**
   - Import and use the logger in your code
   - Or call the test endpoint: `/api/test-logging`

3. **Check log level:**
   ```bash
   # In .env, ensure:
   LOG_LEVEL=info
   # NOT: LOG_LEVEL=error (would skip info logs)
   ```

## Manual Integration Test

Create a simple test to verify logging works:

**1. Create test file: `src/app/api/test-log/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export async function GET() {
  log.info('Manual test log', {
    action: 'manual_test',
    resource: 'testing',
    testDate: new Date().toISOString()
  });

  return NextResponse.json({ message: 'Log created' });
}
```

**2. Call the endpoint:**

```bash
curl http://localhost:3000/api/test-log
```

**3. Check MongoDB:**

```bash
mongo eaip --eval "db.auditlogs.find().limit(1).pretty()"
```

**Expected result:** You should see the test log entry.

## Verification Checklist

- [ ] MONGODB_URI is set in .env file
- [ ] MongoDB is running (local or Atlas)
- [ ] Database name in URI is "eaip"
- [ ] winston-mongodb package is installed
- [ ] Import statement uses named import: `import { MongoDB }`
- [ ] MongoDB transport is added to transports array
- [ ] Collection "auditlogs" exists in database
- [ ] Test endpoint creates logs successfully
- [ ] Logs viewer UI shows logs

## Environment Variables Reference

Add these to your `.env` file:

```bash
# Required - MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/eaip

# Optional - Log level (default: info)
LOG_LEVEL=info

# Optional - Node environment
NODE_ENV=development

# Optional - Log retention in days (default: 90)
LOG_RETENTION_DAYS=90
```

## MongoDB Connection Strings

**Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/eaip
```

**Local MongoDB with authentication:**
```
MONGODB_URI=mongodb://username:password@localhost:27017/eaip
```

**MongoDB Atlas:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eaip
```

**MongoDB Atlas with options:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eaip?retryWrites=true&w=majority
```

## Still Not Working?

If you've tried everything above and logs still aren't appearing:

1. **Check Winston initialization:**
   ```bash
   # Add debug logging to src/lib/logger.ts
   console.log('Winston initialized with transports:', transports.length);
   console.log('MongoDB transport enabled:', !!process.env.MONGODB_URI);
   ```

2. **Check for Winston errors:**
   ```typescript
   // In src/lib/logger.ts, add error handler
   logger.on('error', (err) => {
     console.error('Winston error:', err);
   });
   ```

3. **Try synchronous logging:**
   ```typescript
   // Temporarily test with synchronous write
   const log = winston.createLogger({
     transports: [
       new MongoDB({
         db: process.env.MONGODB_URI!,
         collection: 'auditlogs',
         options: {
           useUnifiedTopology: true,
         }
       })
     ]
   });

   log.info('Direct test');
   ```

4. **Check MongoDB connection directly:**
   ```bash
   # Test connection with MongoDB driver
   node -e "const { MongoClient } = require('mongodb'); MongoClient.connect('mongodb://localhost:27017/eaip').then(() => console.log('Connected')).catch(console.error)"
   ```

## Support

If you're still experiencing issues:
1. Check the Winston GitHub issues: https://github.com/winstonjs/winston
2. Check winston-mongodb issues: https://github.com/winstonjs/winston-mongodb
3. Review security documentation in `docs/security/`
4. Check MongoDB connection from your application

---

*Last Updated: 2025-01-11*
*Status: Troubleshooting Guide*
