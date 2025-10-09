/**
 * Restore git-repos from a backup archive
 * Can restore from specific backup or latest backup
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const GIT_REPOS_DIR = process.env.GIT_REPOS_DIR || path.join(process.cwd(), 'git-repos');

async function findLatestBackup() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('git-repos-backup-') && file.endsWith('.tar.gz'));

    if (backupFiles.length === 0) {
      return null;
    }

    const filesWithStats = await Promise.all(
      backupFiles.map(async file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          mtime: stats.mtime,
        };
      })
    );

    filesWithStats.sort((a, b) => b.mtime - a.mtime);
    return filesWithStats[0];

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Backups directory not found.');
      return null;
    }
    throw error;
  }
}

async function restoreBackup(backupPath, options = {}) {
  const { skipConfirmation = false, createBackupBeforeRestore = true } = options;

  console.log('🔄 Starting git-repos restore...\n');

  try {
    // Verify backup file exists
    const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);

    if (!backupExists) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    console.log(`📦 Backup file: ${path.basename(backupPath)}`);

    // Get backup info
    const stats = await fs.stat(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log(`   Created: ${stats.mtime.toISOString()}`);

    // Check if git-repos already exists
    const reposExists = await fs.access(GIT_REPOS_DIR).then(() => true).catch(() => false);

    if (reposExists && createBackupBeforeRestore) {
      console.log('\n⚠️  Existing git-repos directory found!');
      console.log('   Creating safety backup before restore...');

      const { createBackup } = require('./backup-git-repos.js');
      const safetyBackupPath = await createBackup();

      if (safetyBackupPath) {
        console.log(`   ✅ Safety backup created: ${path.basename(safetyBackupPath)}`);
      }
    }

    // Confirmation prompt (skip in production/docker)
    if (!skipConfirmation && reposExists) {
      console.log('\n⚠️  WARNING: This will replace the existing git-repos directory!');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Remove existing git-repos directory
    if (reposExists) {
      console.log('\n🗑️  Removing existing git-repos directory...');
      await fs.rm(GIT_REPOS_DIR, { recursive: true, force: true });
    }

    // Extract backup
    console.log('\n📂 Extracting backup...');

    const extractCommand = `tar -xzf "${backupPath}" -C "${path.dirname(GIT_REPOS_DIR)}"`;
    await execAsync(extractCommand);

    // Verify extraction
    const restored = await fs.access(GIT_REPOS_DIR).then(() => true).catch(() => false);

    if (!restored) {
      throw new Error('Restore failed: git-repos directory not found after extraction');
    }

    // Count restored organizations
    const orgs = await fs.readdir(GIT_REPOS_DIR);
    const orgDirs = [];

    for (const org of orgs) {
      const orgPath = path.join(GIT_REPOS_DIR, org);
      const stat = await fs.stat(orgPath);
      if (stat.isDirectory()) {
        orgDirs.push(org);
      }
    }

    console.log('\n✅ Restore completed successfully!');
    console.log(`   Restored ${orgDirs.length} organization(s):`);
    orgDirs.forEach(org => {
      console.log(`     - ${org}`);
    });

    return {
      success: true,
      organizationsRestored: orgDirs.length,
      organizations: orgDirs,
    };

  } catch (error) {
    console.error('\n❌ Restore failed:', error.message);
    throw error;
  }
}

async function verifyBackup(backupPath) {
  console.log('🔍 Verifying backup...\n');

  try {
    const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);

    if (!backupExists) {
      console.error('❌ Backup file not found');
      return false;
    }

    // List contents of backup
    const { stdout } = await execAsync(`tar -tzf "${backupPath}"`);
    const files = stdout.trim().split('\n');

    console.log(`✅ Backup is valid`);
    console.log(`   Total files: ${files.length}`);

    // Count organizations
    const orgDirs = files.filter(f => f.match(/^git-repos\/[^/]+\/$/));
    console.log(`   Organizations: ${orgDirs.length}`);

    orgDirs.forEach(org => {
      const orgId = org.split('/')[1];
      console.log(`     - ${orgId}`);
    });

    return true;

  } catch (error) {
    console.error('❌ Backup verification failed:', error.message);
    return false;
  }
}

// CLI handling
async function main() {
  const command = process.argv[2];
  const backupFile = process.argv[3];

  if (command === 'verify' && backupFile) {
    const backupPath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(BACKUP_DIR, backupFile);
    await verifyBackup(backupPath);
  } else if (command === 'latest' || !command) {
    console.log('🔍 Finding latest backup...\n');
    const latest = await findLatestBackup();

    if (!latest) {
      console.error('❌ No backups found');
      process.exit(1);
    }

    console.log(`Found: ${latest.name}\n`);
    await restoreBackup(latest.path, { skipConfirmation: process.env.SKIP_CONFIRMATION === 'true' });
  } else if (backupFile) {
    const backupPath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(BACKUP_DIR, backupFile);
    await restoreBackup(backupPath, { skipConfirmation: process.env.SKIP_CONFIRMATION === 'true' });
  } else {
    console.log('Usage:');
    console.log('  node restore-git-repos.js [command] [backup-file]');
    console.log('');
    console.log('Commands:');
    console.log('  latest              Restore from latest backup (default)');
    console.log('  verify <file>       Verify a backup file');
    console.log('  <backup-file>       Restore from specific backup file');
    console.log('');
    console.log('Examples:');
    console.log('  node restore-git-repos.js');
    console.log('  node restore-git-repos.js latest');
    console.log('  node restore-git-repos.js git-repos-backup-2025-01-15T10-30-00.tar.gz');
    console.log('  node restore-git-repos.js verify git-repos-backup-2025-01-15T10-30-00.tar.gz');
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { restoreBackup, findLatestBackup, verifyBackup };
