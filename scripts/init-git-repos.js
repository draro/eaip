/**
 * Initialize git-repos directories for all active organizations
 * This script runs on container startup to ensure git repositories exist
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// MongoDB connection
const connectDB = async () => {
  const mongoose = require('mongoose');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eaip';

  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Create git repository directory for an organization
async function initGitRepo(orgId, orgName) {
  const repoPath = path.join(process.cwd(), 'git-repos', orgId);

  try {
    // Check if directory exists
    const exists = await fs.access(repoPath).then(() => true).catch(() => false);

    if (exists) {
      console.log(`  ✓ Git repo already exists: ${orgName} (${orgId})`);
      return;
    }

    // Create directory
    await fs.mkdir(repoPath, { recursive: true });

    // Initialize git repository
    await execAsync('git init', { cwd: repoPath });
    await execAsync('git config user.name "eAIP System"', { cwd: repoPath });
    await execAsync('git config user.email "system@eaip.local"', { cwd: repoPath });

    // Create initial commit
    const readmePath = path.join(repoPath, 'README.md');
    await fs.writeFile(readmePath, `# ${orgName} - eAIP Version Control\n\nThis repository tracks all document versions and changes.\n`);

    await execAsync('git add .', { cwd: repoPath });
    await execAsync('git commit -m "Initial commit"', { cwd: repoPath });

    console.log(`  ✓ Initialized git repo: ${orgName} (${orgId})`);
  } catch (error) {
    console.error(`  ✗ Failed to initialize repo for ${orgName}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Initializing git repositories for active organizations...\n');

  let connection;

  try {
    // Connect to MongoDB
    connection = await connectDB();

    // Get Organization model
    const Organization = connection.model('Organization', new connection.base.Schema({
      name: String,
      isActive: Boolean,
    }, { collection: 'organizations' }));

    // Find all active organizations
    const organizations = await Organization.find({ isActive: true }).select('_id name').lean();

    if (organizations.length === 0) {
      console.log('⚠ No active organizations found\n');
      return;
    }

    console.log(`Found ${organizations.length} active organization(s):\n`);

    // Initialize git repos for each organization
    for (const org of organizations) {
      await initGitRepo(org._id.toString(), org.name);
    }

    console.log('\n✅ Git repositories initialization complete');

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('✓ MongoDB connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initGitRepo, main };
