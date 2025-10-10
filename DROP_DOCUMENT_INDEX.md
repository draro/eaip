# Drop Duplicate Document Index

## Problem
The `AIPDocument` model has a unique index that prevents organizations from creating multiple documents for the same country/airport/version/documentType combination. This is too restrictive.

## Solution
The code has been updated to remove the unique constraint, but the existing index in the MongoDB database needs to be dropped and recreated.

## How to Fix on Production Server

### Option 1: Using MongoDB Shell

Connect to your MongoDB instance and run:

```javascript
use eaip

// Show current indexes
db.aipdocuments.getIndexes()

// Drop the unique index
db.aipdocuments.dropIndex("organization_1_country_1_airport_1_version_1_documentType_1")

// Recreate as non-unique index
db.aipdocuments.createIndex(
  { organization: 1, country: 1, airport: 1, version: 1, documentType: 1 },
  { background: true }
)

// Verify the index is no longer unique
db.aipdocuments.getIndexes()
```

### Option 2: Using Node.js Script

If you have access to the production server shell:

```bash
cd /path/to/eaip-editor
export MONGODB_URI="your-mongodb-connection-string"
node scripts/drop-document-unique-index.js
```

### Option 3: Using Docker Exec (if using Docker)

```bash
# Connect to MongoDB container
docker-compose exec mongodb mongosh -u admin -p changeme --authenticationDatabase admin eaip

# Then run the MongoDB commands from Option 1
```

## Verification

After running the migration:

1. Try cloning a document again - it should now work
2. Check that you can create multiple documents for the same ICAO code
3. Verify indexes with: `db.aipdocuments.getIndexes()`

The index should still exist but **without** the `unique: true` property.

## What Changed

**Before:**
```javascript
AIPDocumentSchema.index(
  { organization: 1, country: 1, airport: 1, version: 1, documentType: 1 },
  { unique: true }  // ❌ Too restrictive
);
```

**After:**
```javascript
AIPDocumentSchema.index(
  { organization: 1, country: 1, airport: 1, version: 1, documentType: 1 }
  // ✓ No unique constraint - allows multiple documents
);
```

## Impact

Organizations can now:
- Clone documents for the same ICAO code
- Create multiple documents for the same country/airport/version
- Have different document titles for the same parameters
- Maintain multiple drafts or variations of documents
