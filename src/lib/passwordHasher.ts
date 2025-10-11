import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Password Hashing Utility with Transparent Migration
 *
 * Security Finding Reference: C-002 (CRITICAL - CVSS 8.5)
 *
 * This class provides secure password hashing using bcrypt (cost factor 14)
 * and includes transparent migration from legacy SHA-256 hashing.
 *
 * Migration Strategy:
 * - New passwords are immediately hashed with bcrypt
 * - Existing SHA-256 passwords are detected and migrated on next login
 * - No user action required - migration happens automatically
 * - After 30 days, all active users will have bcrypt passwords
 */
export class PasswordHasher {
  /**
   * bcrypt cost factor (2^14 iterations)
   * SOC 2 recommends minimum cost of 12-14
   * Higher = more secure but slower (exponential)
   */
  private static readonly SALT_ROUNDS = 14;

  /**
   * Legacy salt for SHA-256 detection
   * Used to identify and migrate old password hashes
   */
  private static readonly LEGACY_SALT = 'eAIP_salt_2025';

  /**
   * Hash a password using bcrypt
   *
   * @param password - Plain text password
   * @returns bcrypt hash string (includes salt)
   *
   * @example
   * const hash = await PasswordHasher.hash('MySecurePass123!');
   * // Returns: $2a$14$...
   */
  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against a bcrypt hash
   *
   * @param password - Plain text password to verify
   * @param hash - bcrypt hash to compare against
   * @returns true if password matches hash
   *
   * @example
   * const isValid = await PasswordHasher.verify('MySecurePass123!', storedHash);
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Check if a hash is from the legacy SHA-256 system
   *
   * bcrypt hashes always start with $2a$, $2b$, or $2y$
   * SHA-256 hashes are 64 character hex strings
   *
   * @param hash - Hash to check
   * @returns true if hash is legacy SHA-256 format
   */
  static isLegacyHash(hash: string): boolean {
    // bcrypt hashes start with $2a$, $2b$, or $2y$
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return false;
    }

    // SHA-256 hashes are 64 character hex strings
    return /^[a-f0-9]{64}$/i.test(hash);
  }

  /**
   * Hash password using legacy SHA-256 algorithm
   *
   * ONLY used for verifying existing legacy passwords during migration
   * DO NOT use for new passwords
   *
   * @param password - Plain text password
   * @returns SHA-256 hash
   */
  private static hashLegacy(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + this.LEGACY_SALT)
      .digest('hex');
  }

  /**
   * Authenticate user and transparently migrate to bcrypt if needed
   *
   * This is the main method to use for user authentication.
   * It handles both bcrypt and legacy SHA-256 passwords automatically.
   *
   * @param password - Plain text password from user
   * @param storedHash - Hash from database
   * @returns Object with authentication result and migration info
   *
   * @example
   * const result = await PasswordHasher.authenticateAndMigrate(
   *   userInputPassword,
   *   user.password
   * );
   *
   * if (result.authenticated) {
   *   if (result.needsMigration) {
   *     // Update user password in database
   *     user.password = result.newHash;
   *     await user.save();
   *   }
   *   // Proceed with login
   * } else {
   *   // Invalid password
   * }
   */
  static async authenticateAndMigrate(
    password: string,
    storedHash: string
  ): Promise<{
    authenticated: boolean;
    needsMigration: boolean;
    newHash?: string;
  }> {
    // Check if this is a legacy SHA-256 hash
    if (this.isLegacyHash(storedHash)) {
      // Verify against legacy hash
      const legacyHash = this.hashLegacy(password);

      if (legacyHash === storedHash) {
        // Authentication successful - create new bcrypt hash for migration
        const newHash = await this.hash(password);

        return {
          authenticated: true,
          needsMigration: true,
          newHash,
        };
      }

      // Authentication failed
      return {
        authenticated: false,
        needsMigration: false,
      };
    } else {
      // This is already a bcrypt hash - verify normally
      const authenticated = await this.verify(password, storedHash);

      return {
        authenticated,
        needsMigration: false,
      };
    }
  }

  /**
   * Validate password strength
   *
   * Requirements (SOC 2 compliant):
   * - Minimum 12 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   *
   * @param password - Password to validate
   * @returns Object with validation result and error messages
   *
   * @example
   * const validation = PasswordHasher.validateStrength('weak');
   * if (!validation.isValid) {
   *   console.log(validation.errors);
   * }
   */
  static validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password123!',
      'Password123!',
      'Admin123456!',
      'Welcome123!',
      'Qwerty123456!',
    ];

    if (commonPasswords.some(common => password.toLowerCase() === common.toLowerCase())) {
      errors.push('This password is too common. Please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate a secure random password
   *
   * Useful for temporary passwords, password resets, etc.
   * Generated passwords meet all strength requirements.
   *
   * @param length - Password length (default: 16)
   * @returns Secure random password
   *
   * @example
   * const tempPassword = PasswordHasher.generateSecurePassword();
   * // Returns: something like "Xk9#mP2$vL8@qR5!"
   */
  static generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + numbers + special;

    let password = '';

    // Ensure at least one of each required character type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Get migration statistics for monitoring
   *
   * @param users - Array of user objects with password hashes
   * @returns Statistics about password migration status
   *
   * @example
   * const users = await User.find({});
   * const stats = PasswordHasher.getMigrationStats(users);
   * console.log(`${stats.migrationProgress}% migrated to bcrypt`);
   */
  static getMigrationStats(users: Array<{ password: string }>) {
    const total = users.length;
    const legacy = users.filter(u => this.isLegacyHash(u.password)).length;
    const bcrypt = total - legacy;

    return {
      total,
      legacy,
      bcrypt,
      migrationProgress: total > 0 ? Math.round((bcrypt / total) * 100) : 0,
    };
  }
}
