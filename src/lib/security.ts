import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface PasswordStrength {
  score: number;
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export interface GeneratedPassword {
  password: string;
  hashedPassword: string;
  entropy: number;
}

export class SecurityUtils {
  private static readonly SALT_ROUNDS = 14;
  private static readonly MIN_PASSWORD_LENGTH = 12;
  private static readonly MAX_PASSWORD_LENGTH = 128;

  static generateSecurePassword(length: number = 16): GeneratedPassword {
    if (length < this.MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
    }

    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + specialChars;

    let password = '';

    // Ensure at least one character from each category (NIST requirements)
    password += this.getRandomChar(lowercase);
    password += this.getRandomChar(uppercase);
    password += this.getRandomChar(numbers);
    password += this.getRandomChar(specialChars);

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(allChars);
    }

    // Shuffle the password to randomize character positions
    password = this.shuffleString(password);

    // Calculate entropy (bits)
    const entropy = Math.log2(allChars.length) * length;

    return {
      password,
      hashedPassword: bcrypt.hashSync(password, this.SALT_ROUNDS),
      entropy: Math.round(entropy * 100) / 100
    };
  }

  private static getRandomChar(charset: string): string {
    const randomBytes = crypto.randomBytes(1);
    const randomIndex = randomBytes[0] % charset.length;
    return charset[randomIndex];
  }

  private static shuffleString(str: string): string {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const randomBytes = crypto.randomBytes(4);
      const j = randomBytes.readUInt32BE(0) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  static validatePasswordStrength(password: string): PasswordStrength {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check (NIST SP 800-63B)
    if (password.length < this.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
    } else if (password.length >= 16) {
      score += 2;
    } else {
      score += 1;
      suggestions.push('Consider using a longer password (16+ characters recommended)');
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      errors.push(`Password must not exceed ${this.MAX_PASSWORD_LENGTH} characters`);
    }

    // Character diversity checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!hasSpecialChars) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Common patterns to avoid
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters (3+ in a row)');
      score -= 1;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push('Password should not contain common patterns or words');
      score -= 2;
    }

    // Check for keyboard patterns
    const keyboardPatterns = [
      'qwerty', 'asdf', 'zxcv', '1234', 'abcd'
    ];

    for (const pattern of keyboardPatterns) {
      if (password.toLowerCase().includes(pattern)) {
        errors.push('Password should not contain keyboard patterns');
        score -= 1;
        break;
      }
    }

    // Entropy calculation
    const charset =
      (hasLowercase ? 26 : 0) +
      (hasUppercase ? 26 : 0) +
      (hasNumbers ? 10 : 0) +
      (hasSpecialChars ? 32 : 0);

    const entropy = Math.log2(charset) * password.length;

    if (entropy < 50) {
      suggestions.push('Password entropy is low - consider adding more character variety');
    } else if (entropy >= 80) {
      score += 2;
    } else if (entropy >= 60) {
      score += 1;
    }

    // Normalize score (0-10)
    score = Math.max(0, Math.min(10, score));

    const isValid = errors.length === 0 && score >= 6;

    if (!isValid && errors.length === 0) {
      suggestions.push('Password strength is below recommended level');
    }

    return {
      score,
      isValid,
      errors,
      suggestions
    };
  }

  static async hashPassword(password: string): Promise<string> {
    // Validate password before hashing
    const validation = this.validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(`Invalid password: ${validation.errors.join(', ')}`);
    }

    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateVerificationToken(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  static isTokenExpired(tokenCreatedAt: Date, expirationHours: number = 24): boolean {
    const expirationTime = new Date(tokenCreatedAt.getTime() + (expirationHours * 60 * 60 * 1000));
    return new Date() > expirationTime;
  }

  // Rate limiting helpers
  static generateRateLimitKey(identifier: string, action: string): string {
    return `ratelimit:${action}:${identifier}`;
  }

  // Session security
  static generateSecureSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // CSRF token generation
  static generateCSRFToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // Input sanitization for security logs
  static sanitizeLogInput(input: string): string {
    return input.replace(/[\r\n\t]/g, '_').substring(0, 200);
  }
}