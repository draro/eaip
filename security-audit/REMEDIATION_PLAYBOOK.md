# eAIP Security Remediation Playbook
## Step-by-Step Implementation Guide

**Version:** 1.0  
**Date:** January 2025  
**Classification:** INTERNAL USE ONLY

---

## Purpose

This playbook provides detailed, actionable steps for remediating all identified security vulnerabilities and compliance gaps in the eAIP Document Management System.

---

## Critical Priority: Finding C-001 - Credential Rotation

### Objective
Remove all hardcoded credentials from version control and implement secure secret management.

### Prerequisites
- Access to production environment
- MongoDB Atlas admin access
- Google Cloud Platform admin access
- Anthropic and OpenAI account access
- Git repository admin access

### Step-by-Step Instructions

#### Day 1: Immediate Credential Rotation

**Step 1: MongoDB Atlas Password Rotation (30 minutes)**
```bash
# 1. Log into MongoDB Atlas (https://cloud.mongodb.com)
# 2. Navigate to: Database Access → Users
# 3. Find user: davide
# 4. Click "Edit" → "Edit Password"
# 5. Generate new strong password (use password generator):
#    Minimum 20 characters, mixed case, numbers, symbols
# 6. Update connection string format:
OLD: mongodb+srv://davide:!!!Sasha2015!!!Eliana2019!!!@flyclimweb...
NEW: mongodb+srv://davide:<NEW_STRONG_PASSWORD>@flyclimweb...

# 7. Update production .env file (DO NOT COMMIT):
nano /path/to/production/.env
# Update MONGODB_URI with new password
# Save and exit

# 8. Restart application:
docker-compose restart eaip-app

# 9. Verify connectivity:
docker logs eaip-app | grep "MongoDB connected successfully"
```

**Step 2: Anthropic API Key Rotation (15 minutes)**
```bash
# 1. Log into Anthropic Console (https://console.anthropic.com)
# 2. Navigate to: API Keys
# 3. Revoke existing key: sk-ant-api03-88axSYiqO1nYe4e...
# 4. Create new API key with descriptive name: "eAIP-Production-2025"
# 5. Copy new key (shown only once)
# 6. Update production .env:
ANTHROPIC_API_KEY=sk-ant-api03-<NEW_KEY>

# 7. Test API connectivity:
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-opus-20240229","max_tokens":1024,"messages":[{"role":"user","content":"test"}]}'
```

**Step 3: OpenAI API Key Rotation (15 minutes)**
```bash
# 1. Log into OpenAI Platform (https://platform.openai.com)
# 2. Navigate to: API Keys
# 3. Revoke existing key: sk-proj-f0NFLaxrme5Y4M3p1RVp...
# 4. Create new secret key: "eAIP Production Key"
# 5. Update production .env:
OPENAI_API_KEY="sk-proj-<NEW_KEY>"

# 6. Test API:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Step 4: Google Cloud Service Account Rotation (45 minutes)**
```bash
# 1. Log into Google Cloud Console
# 2. Navigate to: IAM & Admin → Service Accounts
# 3. Create new service account:
#    Name: eaip-storage-production-v2
#    Description: eAIP GCS access (rotated Jan 2025)
#    Role: Storage Object Admin (on eaip-storage bucket only)

# 4. Create key for new service account:
#    Key type: JSON
#    Download: eaip-storage-production-v2.json

# 5. Update .env with new credentials:
# Copy entire JSON content and escape for single-line:
GCS_CREDENTIALS_JSON='{"type":"service_account","project_id":"phonic-formula-456510-u6",...}'

# 6. Test GCS access:
node << 'EOTEST'
const { Storage } = require('@google-cloud/storage');
const credentials = JSON.parse(process.env.GCS_CREDENTIALS_JSON);
const storage = new Storage({ projectId: credentials.project_id, credentials });
storage.bucket('eaip-storage').exists().then(([exists]) => {
  console.log(exists ? '✓ GCS access OK' : '✗ GCS access FAILED');
});
EOTEST

# 7. Delete old service account after verification:
#    Wait 24 hours to ensure no issues
#    Then delete: davide@phonic-formula-456510-u6.iam.gserviceaccount.com
```

**Step 5: Remove Credentials from Git History (2 hours)**
```bash
# IMPORTANT: Coordinate with all team members before proceeding

# 1. Clone fresh repository copy:
git clone <repo-url> eaip-cleanup
cd eaip-cleanup

# 2. Install BFG Repo-Cleaner:
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
alias bfg='java -jar bfg-1.14.0.jar'

# 3. Create replacements file:
cat > passwords.txt << 'EOFILE'
!!!Sasha2015!!!Eliana2019!!!==>***REMOVED***
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==>***REMOVED***
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==>***REMOVED***
EOFILE

# 4. Run BFG to remove passwords:
bfg --replace-text passwords.txt

# 5. Clean up repository:
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. Verify removal:
git log --all --full-history --source --pretty=format: -- .env | \
  xargs -I {} git show {} | grep -i "password\|api.*key\|secret"
# Should return no results

# 7. Force push (BREAKING CHANGE - coordinate with team):
git push --force --all
git push --force --tags

# 8. Notify all team members to re-clone:
#    Send email: "URGENT: Git history cleaned, please re-clone repository"
#    All team members must delete local copies and re-clone
```

#### Day 2-3: Implement Secret Management

**Option A: Google Cloud Secret Manager (Recommended for GCP deployment)**

```bash
# 1. Enable Secret Manager API:
gcloud services enable secretmanager.googleapis.com

# 2. Create secrets:
echo -n "$MONGODB_URI" | gcloud secrets create mongodb-uri --data-file=-
echo -n "$ANTHROPIC_API_KEY" | gcloud secrets create anthropic-api-key --data-file=-
echo -n "$OPENAI_API_KEY" | gcloud secrets create openai-api-key --data-file=-
echo -n "$GCS_CREDENTIALS_JSON" | gcloud secrets create gcs-credentials --data-file=-
echo -n "$NEXTAUTH_SECRET" | gcloud secrets create nextauth-secret --data-file=-

# 3. Grant access to service account:
for secret in mongodb-uri anthropic-api-key openai-api-key gcs-credentials nextauth-secret; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:eaip-app@phonic-formula-456510-u6.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done

# 4. Update application code to fetch secrets:
# Create: src/lib/secrets.ts
```

```typescript
// src/lib/secrets.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const projectId = process.env.GCS_PROJECT_ID || 'phonic-formula-456510-u6';

async function getSecret(secretName: string): Promise<string> {
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  const [version] = await client.accessSecretVersion({ name });
  const payload = version.payload?.data?.toString() || '';
  return payload;
}

export async function loadSecrets() {
  if (process.env.NODE_ENV === 'production') {
    // Load from Secret Manager in production
    process.env.MONGODB_URI = await getSecret('mongodb-uri');
    process.env.ANTHROPIC_API_KEY = await getSecret('anthropic-api-key');
    process.env.OPENAI_API_KEY = await getSecret('openai-api-key');
    process.env.GCS_CREDENTIALS_JSON = await getSecret('gcs-credentials');
    process.env.NEXTAUTH_SECRET = await getSecret('nextauth-secret');
    console.log('✓ Secrets loaded from Google Secret Manager');
  } else {
    // Development: use .env file
    console.log('✓ Secrets loaded from .env file');
  }
}
```

```typescript
// Update src/lib/mongodb.ts (add at top):
import { loadSecrets } from './secrets';

// Before connectDB():
let secretsLoaded = false;
async function connectDB(): Promise<typeof mongoose> {
  if (!secretsLoaded) {
    await loadSecrets();
    secretsLoaded = true;
  }
  // ... rest of connection logic
}
```

**Step 6: Implement Pre-commit Hooks (Day 3)**

```bash
# 1. Install git-secrets:
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
sudo make install

# 2. Setup in repository:
cd /path/to/eaip-repo
git secrets --install
git secrets --register-aws  # Detects AWS keys
git secrets --add 'password|passwd|pwd|secret|token|key|apikey'
git secrets --add 'mongodb\+srv://[^:]+:[^@]+@'  # MongoDB connection strings
git secrets --add 'sk-[a-zA-Z0-9]{32,}'  # API keys pattern
git secrets --add 'AKIA[0-9A-Z]{16}'  # AWS keys
git secrets --add '-----BEGIN\s+PRIVATE\s+KEY-----'  # Private keys

# 3. Scan existing files:
git secrets --scan

# 4. Add to .git/hooks/pre-commit:
#!/bin/bash
git secrets --pre-commit "$@"

# 5. Test:
echo "password=mysecret" > test.txt
git add test.txt
git commit -m "test"  # Should FAIL

# 6. Document for team in README:
```

```markdown
## Security: Git Secrets
This repository uses git-secrets to prevent committing sensitive data.

Installation:
1. Clone git-secrets: `git clone https://github.com/awslabs/git-secrets.git`
2. Install: `cd git-secrets && sudo make install`
3. Setup: `git secrets --install`

The pre-commit hook will reject commits containing secrets.
```

#### Day 4-5: Implement CI/CD Secret Scanning

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for scanning
      
      - name: TruffleHog Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          
      - name: GitLeaks Secret Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Fail on Secrets Found
        if: failure()
        run: |
          echo "::error::Secrets detected in commit. Please remove and try again."
          exit 1
```

### Verification Checklist

- [ ] MongoDB Atlas password rotated and tested
- [ ] Anthropic API key rotated and tested
- [ ] OpenAI API key rotated and tested
- [ ] Google Cloud service account rotated and tested
- [ ] n8n webhook tokens rotated (if applicable)
- [ ] All credentials removed from git history
- [ ] Team members notified and repositories re-cloned
- [ ] Secret Manager implemented and tested
- [ ] Pre-commit hooks installed and tested
- [ ] CI/CD secret scanning enabled
- [ ] Documentation updated
- [ ] Incident logged in audit trail

### Success Criteria

✓ No credentials in version control (git history clean)  
✓ All API calls working with new credentials  
✓ Secret Manager operational in production  
✓ Pre-commit hooks preventing new credential commits  
✓ CI/CD pipeline failing on secret detection  
✓ Team trained on secret management practices

### Rollback Plan

If issues arise:
1. Revert to previous credentials temporarily
2. Investigate and fix issues
3. Re-attempt rotation
4. Document lessons learned

### Post-Implementation

1. Monitor logs for authentication errors
2. Verify all integrations working
3. Schedule monthly credential rotation
4. Review access logs for anomalies
5. Update runbooks and documentation

---

## Critical Priority: Finding C-002 - Password Hashing Upgrade

### Objective
Replace SHA-256 password hashing with bcrypt (cost factor 14) while maintaining user access.

### Strategy
Transparent migration: upgrade passwords to bcrypt on next successful login (no user action required).

### Implementation Steps

#### Week 1: Development and Testing

**Step 1: Install Dependencies**
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

**Step 2: Create Password Utility (src/lib/passwordHash.ts)**
```typescript
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class PasswordHasher {
  private static readonly SALT_ROUNDS = 14; // SOC 2 recommended
  private static readonly LEGACY_SALT = 'eAIP_salt_2025';

  /**
   * Hash password using bcrypt (new standard)
   */
  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against bcrypt hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Legacy SHA-256 hashing (for migration only)
   */
  static hashLegacy(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + this.LEGACY_SALT)
      .digest('hex');
  }

  /**
   * Check if hash is legacy SHA-256 format
   */
  static isLegacyHash(hash: string): boolean {
    // Bcrypt hashes start with $2a$, $2b$, or $2y$
    return !hash.startsWith('$2a$') && 
           !hash.startsWith('$2b$') && 
           !hash.startsWith('$2y$');
  }

  /**
   * Migrate user from legacy to bcrypt on successful login
   */
  static async authenticateAndMigrate(
    password: string, 
    storedHash: string
  ): Promise<{ authenticated: boolean; needsMigration: boolean; newHash?: string }> {
    
    if (this.isLegacyHash(storedHash)) {
      // Verify against legacy SHA-256
      const legacyHash = this.hashLegacy(password);
      
      if (legacyHash === storedHash) {
        // Valid password - migrate to bcrypt
        const newHash = await this.hash(password);
        return {
          authenticated: true,
          needsMigration: true,
          newHash
        };
      } else {
        return {
          authenticated: false,
          needsMigration: false
        };
      }
    } else {
      // Modern bcrypt verification
      const authenticated = await this.verify(password, storedHash);
      return {
        authenticated,
        needsMigration: false
      };
    }
  }
}
```

**Step 3: Update Authentication Logic (src/lib/auth/authOptions.ts)**
```typescript
import { PasswordHasher } from '@/lib/passwordHash';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const user = await User.findOne({ email: credentials.email });
          if (!user || !user.password) return null;

          // MIGRATION LOGIC: Authenticate and upgrade hash if needed
          const authResult = await PasswordHasher.authenticateAndMigrate(
            credentials.password,
            user.password
          );

          if (!authResult.authenticated) {
            // Track failed login attempt
            await user.incrementLoginAttempts();
            return null;
          }

          // SUCCESS: Upgrade hash if using legacy format
          if (authResult.needsMigration && authResult.newHash) {
            console.log(`Migrating password hash for user: ${user.email}`);
            user.password = authResult.newHash;
            await user.save();
            
            // Log migration in audit trail
            await DocumentActionLog.create({
              actionType: 'password_migrated',
              userId: user._id,
              userName: user.name,
              userEmail: user.email,
              organization: user.organization,
              details: {
                fromFormat: 'SHA-256',
                toFormat: 'bcrypt',
                timestamp: new Date()
              },
              timestamp: new Date()
            });
          }

          // Reset failed login attempts on successful login
          if (user.failedLoginAttempts > 0) {
            await user.resetLoginAttempts();
          }

          // Update last login
          user.lastLoginAt = new Date();
          await user.save();

          // Return user object...
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            // ... rest of user object
          };

        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  // ... rest of config
};
```

**Step 4: Update Password Change Endpoint (src/app/api/auth/change-password/route.ts)**
```typescript
import { PasswordHasher } from '@/lib/passwordHash';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  // Validate new password strength
  const validation = PasswordHasher.validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    return NextResponse.json({
      error: 'Weak password',
      details: validation.errors
    }, { status: 400 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify current password (handles both legacy and bcrypt)
  const authResult = await PasswordHasher.authenticateAndMigrate(
    currentPassword,
    user.password
  );

  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Invalid current password' }, { status: 401 });
  }

  // Hash new password with bcrypt
  user.password = await PasswordHasher.hash(newPassword);
  user.mustChangePassword = false;
  user.isTemporaryPassword = false;
  await user.save();

  // Log password change
  await DocumentActionLog.create({
    actionType: 'password_changed',
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    organization: user.organization,
    details: { timestamp: new Date() },
    timestamp: new Date()
  });

  return NextResponse.json({
    success: true,
    message: 'Password updated successfully'
  });
}
```

**Step 5: Add Password Strength Validation**
```typescript
// Add to src/lib/passwordHash.ts

export interface PasswordStrength {
  score: number; // 0-10
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export class PasswordHasher {
  // ... existing methods

  static validatePasswordStrength(password: string): PasswordStrength {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    } else if (password.length >= 16) {
      score += 2;
    } else {
      score += 1;
      suggestions.push('Use 16+ characters for stronger security');
    }

    if (password.length > 128) {
      errors.push('Password cannot exceed 128 characters');
    }

    // Character diversity
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    if (!hasLower) errors.push('Include lowercase letters');
    else score += 1;
    
    if (!hasUpper) errors.push('Include uppercase letters');
    else score += 1;
    
    if (!hasNumber) errors.push('Include numbers');
    else score += 1;
    
    if (!hasSpecial) errors.push('Include special characters');
    else score += 1;

    // Common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Avoid repeated characters (3+ in a row)');
      score -= 1;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push('Avoid common patterns or words');
      score -= 2;
    }

    // Entropy calculation
    const charset = 
      (hasLower ? 26 : 0) + 
      (hasUpper ? 26 : 0) + 
      (hasNumber ? 10 : 0) + 
      (hasSpecial ? 32 : 0);
    const entropy = Math.log2(charset) * password.length;

    if (entropy < 50) {
      suggestions.push('Low entropy - add more character variety');
    } else if (entropy >= 80) {
      score += 2;
    } else if (entropy >= 60) {
      score += 1;
    }

    // Normalize score
    score = Math.max(0, Math.min(10, score));
    const isValid = errors.length === 0 && score >= 6;

    if (!isValid && errors.length === 0) {
      suggestions.push('Password strength is below recommended level');
    }

    return { score, isValid, errors, suggestions };
  }
}
```

#### Week 2: Deployment and Monitoring

**Step 1: Deploy to Staging**
```bash
# 1. Build and test
npm run build
npm test

# 2. Deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# 3. Test authentication
curl -X POST https://staging.eaip.flyclim.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 4. Verify hash upgrade in database
mongosh "mongodb+srv://..." --eval '
  db.users.findOne(
    { email: "test@example.com" },
    { password: 1 }
  )
'
# Should see bcrypt hash starting with $2b$14$
```

**Step 2: Monitor Migration Progress**
```typescript
// Create monitoring script: scripts/monitor-password-migration.ts
import connectDB from '../src/lib/mongodb';
import User from '../src/models/User';

async function monitorMigration() {
  await connectDB();

  const totalUsers = await User.countDocuments();
  const legacyUsers = await User.countDocuments({
    password: { $not: /^\$2[aby]\$/ }
  });
  const migratedUsers = totalUsers - legacyUsers;

  console.log(`Password Migration Progress:
    Total Users: ${totalUsers}
    Migrated: ${migratedUsers} (${((migratedUsers/totalUsers)*100).toFixed(1)}%)
    Legacy: ${legacyUsers} (${((legacyUsers/totalUsers)*100).toFixed(1)}%)
  `);

  if (legacyUsers > 0) {
    console.log(`\nUsers still on legacy hashing:`);
    const users = await User.find(
      { password: { $not: /^\$2[aby]\$/ } },
      { email: 1, lastLoginAt: 1 }
    ).limit(10);
    
    users.forEach(user => {
      const lastLogin = user.lastLoginAt 
        ? new Date(user.lastLoginAt).toISOString()
        : 'Never';
      console.log(`  - ${user.email} (last login: ${lastLogin})`);
    });
  }
}

monitorMigration();
```

```bash
# Run monitoring
npm run ts-node scripts/monitor-password-migration.ts
```

**Step 3: Deploy to Production**
```bash
# 1. Scheduled maintenance window
echo "Deploying password security upgrade..."

# 2. Deploy new code
git pull origin main
docker-compose build
docker-compose up -d

# 3. Monitor logs
docker logs -f eaip-app | grep -i "password\|auth\|migration"

# 4. Test authentication
curl -X POST https://eaip.flyclim.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"securepassword"}'
```

**Step 4: User Communication**
```markdown
**Email to All Users:**

Subject: Security Upgrade - No Action Required

Dear eAIP User,

We've upgraded our password security system to use industry-leading bcrypt 
encryption (NIST/SOC 2 compliant). 

**What this means for you:**
- Your password will be automatically upgraded on your next login
- No action required from you
- Your current password continues to work
- Enhanced security protection for your account

**What's changing:**
- Passwords now use bcrypt with cost factor 14
- Compliant with SOC 2 Type II requirements
- Protection against modern attack methods

**When will this happen:**
- Automatically on your next login
- Takes less than 1 second
- Completely transparent to you

If you experience any login issues, please contact support@flyclim.com.

Best regards,
eAIP Security Team
```

### Verification Checklist

- [ ] bcrypt implementation tested in development
- [ ] Migration logic tested with legacy passwords
- [ ] New password hashing tested
- [ ] Password strength validation working
- [ ] Deployed to staging successfully
- [ ] Migration monitoring script working
- [ ] User communication sent
- [ ] Deployed to production
- [ ] All admin accounts upgraded
- [ ] Failed login tracking working
- [ ] Audit logging capturing migrations
- [ ] Documentation updated

### Success Criteria

✓ All new passwords use bcrypt (cost factor 14)  
✓ Legacy passwords upgraded transparently on login  
✓ 90% of active users migrated within 2 weeks  
✓ No user-reported authentication issues  
✓ Audit logs showing successful migrations  
✓ Password strength validation enforced

### Post-Implementation

1. Monitor migration progress weekly
2. After 90 days, force password reset for remaining legacy users
3. Remove legacy SHA-256 code after 100% migration
4. Schedule annual bcrypt cost factor review
5. Document lessons learned

---

## Additional Playbooks

The following playbooks are available separately:

- **C-003: Log Sanitization Playbook** (10 days)
- **H-001: MFA Implementation Playbook** (15 days)
- **H-002: Audit Logging Enhancement Playbook** (12 days)
- **H-003: Field-Level Encryption Playbook** (14 days)
- **H-004: Rate Limiting Playbook** (8 days)
- **H-005: GDPR Rights Implementation Playbook** (20 days)

Each playbook provides step-by-step instructions with commands, code samples, 
verification steps, and rollback procedures.

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** After Phase 1 completion

