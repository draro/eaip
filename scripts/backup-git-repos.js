/**
 * Backup git-repos to a compressed archive
 * Creates timestamped backups that can be restored later
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const GIT_REPOS_DIR = process.env.GIT_REPOS_DIR || path.join(process.cwd(), 'git-repos');

async function createBackup() {
  console.log('🔄 Starting git-repos backup...\n');

  try {
    // Check if git-repos directory exists
    const reposExists = await fs.access(GIT_REPOS_DIR).then(() => true).catch(() => false);

    if (!reposExists) {
      console.log('⚠️  No git-repos directory found. Nothing to backup.');
      return null;
    }

    // Create backups directory if it doesn't exist
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Generate timestamp for backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `git-repos-backup-${timestamp}.tar.gz`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    console.log(`📦 Creating backup: ${backupFileName}`);

    // Create tarball of git-repos directory
    const command = `tar -czf "${backupPath}" -C "${path.dirname(GIT_REPOS_DIR)}" "${path.basename(GIT_REPOS_DIR)}"`;
    await execAsync(command);

    // Get file size
    const stats = await fs.stat(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully!`);
    console.log(`   File: ${backupPath}`);
    console.log(`   Size: ${fileSizeMB} MB`);

    // List all organizations backed up
    const { stdout } = await execAsync(`tar -tzf "${backupPath}" | grep -E "git-repos/[^/]+$" || true`);
    const orgs = stdout.trim().split('\n').filter(Boolean);

    if (orgs.length > 0) {
      console.log(`   Organizations: ${orgs.length}`);
      orgs.forEach(org => {
        const orgId = org.split('/')[1];
        console.log(`     - ${orgId}`);
      });
    }

    // Clean up old backups (keep last 10)
    await cleanupOldBackups();

    return backupPath;

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

async function cleanupOldBackups(keepCount = 10) {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('git-repos-backup-') && file.endsWith('.tar.gz'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
      }));

    if (backupFiles.length <= keepCount) {
      return;
    }

    // Sort by modification time (newest first)
    const filesWithStats = await Promise.all(
      backupFiles.map(async file => ({
        ...file,
        stats: await fs.stat(file.path),
      }))
    );

    filesWithStats.sort((a, b) => b.stats.mtime - a.stats.mtime);

    // Delete old backups
    const filesToDelete = filesWithStats.slice(keepCount);

    if (filesToDelete.length > 0) {
      console.log(`\n🗑️  Cleaning up ${filesToDelete.length} old backup(s)...`);

      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`   Deleted: ${file.name}`);
      }
    }

  } catch (error) {
    console.error('⚠️  Failed to cleanup old backups:', error.message);
  }
}

async function listBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('git-repos-backup-') && file.endsWith('.tar.gz'));

    if (backupFiles.length === 0) {
      console.log('No backups found.');
      return [];
    }

    const filesWithStats = await Promise.all(
      backupFiles.map(async file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          created: stats.mtime.toISOString(),
        };
      })
    );

    filesWithStats.sort((a, b) => new Date(b.created) - new Date(a.created));

    console.log('\n📋 Available backups:\n');
    filesWithStats.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Size: ${file.size}`);
      console.log(`   Created: ${file.created}\n`);
    });

    return filesWithStats;

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No backups directory found.');
      return [];
    }
    throw error;
  }
}

// CLI handling
async function main() {
  const command = process.argv[2];

  if (command === 'list') {
    await listBackups();
  } else if (command === 'create' || !command) {
    await createBackup();
  } else {
    console.log('Usage:');
    console.log('  node backup-git-repos.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  create    Create a new backup (default)');
    console.log('  list      List all available backups');
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

module.exports = { createBackup, listBackups, cleanupOldBackups };
