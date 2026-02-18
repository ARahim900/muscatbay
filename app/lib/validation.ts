/**
 * Security Validation Utilities
 * 
 * Centralized input validation and sanitization for the Muscat Bay Dashboard.
 * Implements industry-standard security practices to prevent common vulnerabilities.
 */

// ==============================================
// Email Validation
// ==============================================

/**
 * RFC 5322 compliant email regex pattern (simplified)
 * Validates format like: user@domain.tld
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns ValidationResult with isValid and optional error message
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required' };
    }

    const trimmed = email.trim();

    if (trimmed.length === 0) {
        return { isValid: false, error: 'Email is required' };
    }

    if (trimmed.length > 254) {
        return { isValid: false, error: 'Email is too long' };
    }

    if (!EMAIL_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
}

// ==============================================
// Password Validation
// ==============================================

export interface PasswordRequirement {
    label: string;
    met: boolean;
    regex?: RegExp;
}

/**
 * Gets password requirements with their current status
 * @param password - Password to check
 * @returns Array of requirements with met status
 */
export function getPasswordRequirements(password: string): PasswordRequirement[] {
    return [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Contains a number', met: /\d/.test(password) },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
        { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @param requireAllRules - If true, all rules must pass. If false, minimum 3 rules
 * @returns ValidationResult
 */
export function validatePassword(password: string, requireAllRules: boolean = false): ValidationResult {
    if (!password || typeof password !== 'string') {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long' };
    }

    const requirements = getPasswordRequirements(password);
    const metCount = requirements.filter(r => r.met).length;

    if (requireAllRules) {
        const unmet = requirements.find(r => !r.met);
        if (unmet) {
            return { isValid: false, error: `Password must have: ${unmet.label.toLowerCase()}` };
        }
    } else {
        // Minimum: length + at least 2 other requirements
        if (!requirements[0].met) {
            return { isValid: false, error: 'Password must be at least 8 characters' };
        }
        if (metCount < 3) {
            return { isValid: false, error: 'Password is too weak. Add numbers or special characters.' };
        }
    }

    return { isValid: true };
}

// ==============================================
// Username Validation
// ==============================================

/**
 * Username pattern: alphanumeric, underscores, 3-30 characters
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

/**
 * Validates username format
 * @param username - Username to validate
 * @returns ValidationResult
 */
export function validateUsername(username: string): ValidationResult {
    if (!username || typeof username !== 'string') {
        return { isValid: true }; // Username is optional
    }

    const trimmed = username.trim();

    if (trimmed.length === 0) {
        return { isValid: true }; // Empty is allowed (optional field)
    }

    if (trimmed.length < 3) {
        return { isValid: false, error: 'Username must be at least 3 characters' };
    }

    if (trimmed.length > 30) {
        return { isValid: false, error: 'Username must be 30 characters or less' };
    }

    if (!USERNAME_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }

    return { isValid: true };
}

// ==============================================
// Name Validation
// ==============================================

/**
 * Validates full name
 * @param name - Name to validate
 * @returns ValidationResult
 */
export function validateFullName(name: string): ValidationResult {
    if (!name || typeof name !== 'string') {
        return { isValid: true }; // Name can be optional
    }

    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return { isValid: true };
    }

    if (trimmed.length > 100) {
        return { isValid: false, error: 'Name must be 100 characters or less' };
    }

    // Prevent script injection in names
    if (/<script|javascript:|on\w+=/i.test(trimmed)) {
        return { isValid: false, error: 'Name contains invalid characters' };
    }

    return { isValid: true };
}

// ==============================================
// URL Validation
// ==============================================

/**
 * Validates URL format (for website fields)
 * @param url - URL to validate
 * @returns ValidationResult
 */
export function validateUrl(url: string): ValidationResult {
    if (!url || typeof url !== 'string') {
        return { isValid: true }; // URL is optional
    }

    const trimmed = url.trim();

    if (trimmed.length === 0) {
        return { isValid: true };
    }

    if (trimmed.length > 2048) {
        return { isValid: false, error: 'URL is too long' };
    }

    // Block javascript: protocol
    if (/^javascript:/i.test(trimmed)) {
        return { isValid: false, error: 'Invalid URL format' };
    }

    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { isValid: false, error: 'URL must start with http:// or https://' };
        }
        return { isValid: true };
    } catch {
        // Try adding https:// prefix
        try {
            new URL(`https://${trimmed}`);
            return { isValid: true }; // Valid with prefix
        } catch {
            return { isValid: false, error: 'Please enter a valid URL' };
        }
    }
}

// ==============================================
// Input Sanitization
// ==============================================

/**
 * Sanitizes string input by trimming and escaping HTML entities
 * @param input - Raw input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Sanitizes search query for database operations
 * Removes special characters that could be used for injection
 * @param query - Search query
 * @returns Sanitized query safe for use in LIKE patterns
 */
export function sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
        return '';
    }

    return query
        .trim()
        .slice(0, 200) // Limit length
        .replace(/[%_\\]/g, '\\$&'); // Escape LIKE wildcards
}

// ==============================================
// File Validation
// ==============================================

export interface FileValidationOptions {
    maxSizeBytes: number;
    allowedTypes: string[];
}

const DEFAULT_IMAGE_OPTIONS: FileValidationOptions = {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

/**
 * Validates file for upload
 * @param file - File to validate
 * @param options - Validation options
 * @returns ValidationResult
 */
export function validateFile(
    file: File,
    options: Partial<FileValidationOptions> = {}
): ValidationResult {
    const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };

    if (!file) {
        return { isValid: false, error: 'No file selected' };
    }

    if (file.size > opts.maxSizeBytes) {
        const maxMB = Math.round(opts.maxSizeBytes / (1024 * 1024));
        return { isValid: false, error: `File size must be less than ${maxMB}MB` };
    }

    if (!opts.allowedTypes.includes(file.type)) {
        return { isValid: false, error: 'Invalid file type. Please upload an image.' };
    }

    // Check file extension matches type
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!ext || !validExtensions.includes(ext)) {
        return { isValid: false, error: 'Invalid file extension' };
    }

    return { isValid: true };
}

// ==============================================
// Rate Limiting (Client-side)
// ==============================================

interface RateLimitState {
    attempts: number;
    lastAttempt: number;
    lockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitState>();

/**
 * Client-side rate limiting for sensitive operations
 * @param key - Unique identifier for the rate limit (e.g., 'login', 'signup')
 * @param maxAttempts - Maximum attempts before lockout
 * @param windowMs - Time window in milliseconds
 * @param lockoutMs - Lockout duration in milliseconds
 * @returns Object with isAllowed and optional wait time
 */
export function checkRateLimit(
    key: string,
    maxAttempts: number = 5,
    windowMs: number = 60000, // 1 minute
    lockoutMs: number = 300000 // 5 minutes
): { isAllowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    const state = rateLimitStore.get(key) || { attempts: 0, lastAttempt: 0, lockedUntil: 0 };

    // Check if currently locked out
    if (state.lockedUntil > now) {
        const waitSeconds = Math.ceil((state.lockedUntil - now) / 1000);
        return { isAllowed: false, waitSeconds };
    }

    // Reset if window expired
    if (now - state.lastAttempt > windowMs) {
        state.attempts = 0;
    }

    // Check attempt count (don't record — caller must call recordRateLimitAttempt on failure)
    if (state.attempts >= maxAttempts) {
        state.lockedUntil = now + lockoutMs;
        rateLimitStore.set(key, state);
        return { isAllowed: false, waitSeconds: Math.ceil(lockoutMs / 1000) };
    }

    return { isAllowed: true };
}

/**
 * Records a failed attempt for rate limiting
 * Call this only when the action fails (e.g., wrong password)
 * @param key - Rate limit key to record attempt for
 */
export function recordRateLimitAttempt(key: string): void {
    const now = Date.now();
    const state = rateLimitStore.get(key) || { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
    state.attempts++;
    state.lastAttempt = now;
    rateLimitStore.set(key, state);
}

/**
 * Resets rate limit for a key (call on successful action)
 * @param key - Rate limit key to reset
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

// ==============================================
// Secure Error Messages
// ==============================================

/**
 * Converts detailed errors to user-safe messages
 * Prevents information leakage from authentication errors
 * @param error - Original error
 * @param context - Error context (e.g., 'login', 'signup')
 * @returns Safe error message for display
 */
export function getSafeErrorMessage(error: unknown, context: 'login' | 'signup' | 'reset' | 'profile'): string {
    // Log original error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.error(`[${context}] Error:`, error);
    }

    // Generic messages by context
    const messages: Record<string, string> = {
        login: 'Invalid email or password. Please try again.',
        signup: 'Unable to create account. Please try again later.',
        reset: 'If an account exists with this email, a reset link has been sent.',
        profile: 'Unable to update profile. Please try again.',
    };

    return messages[context] || 'An error occurred. Please try again.';
}
