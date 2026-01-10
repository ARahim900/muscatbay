import { describe, it, expect, beforeEach } from 'vitest';
import {
    validateEmail,
    validatePassword,
    validateUsername,
    validateFullName,
    validateUrl,
    sanitizeInput,
    sanitizeSearchQuery,
    validateFile,
    getPasswordRequirements,
    checkRateLimit,
    resetRateLimit,
    getSafeErrorMessage,
} from '@/lib/validation';

describe('Email Validation', () => {
    it('should accept valid emails', () => {
        const validEmails = [
            'test@example.com',
            'user.name@domain.com',
            'user+tag@example.org',
            'firstname.lastname@company.co.uk',
        ];

        validEmails.forEach((email) => {
            const result = validateEmail(email);
            expect(result.isValid).toBe(true);
        });
    });

    it('should reject invalid emails', () => {
        const invalidEmails = [
            'notanemail',
            'test@',
            '@test.com',
            'test@.com',
            '',
            '   ',
        ];

        invalidEmails.forEach((email) => {
            const result = validateEmail(email);
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    it('should reject emails that are too long', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const result = validateEmail(longEmail);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('too long');
    });
});

describe('Password Validation', () => {
    it('should accept strong passwords', () => {
        const result = validatePassword('SecureP@ss123', true);
        expect(result.isValid).toBe(true);
    });

    it('should reject passwords without minimum length', () => {
        const result = validatePassword('Short1!', false);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('8 characters');
    });

    it('should reject weak passwords when not requiring all rules', () => {
        const result = validatePassword('password', false);
        expect(result.isValid).toBe(false);
    });

    it('should return correct password requirements', () => {
        const requirements = getPasswordRequirements('Test123!');
        expect(requirements.length).toBe(5);
        expect(requirements.every((r: any) => r.met)).toBe(true);
    });

    it('should identify missing password requirements', () => {
        const requirements = getPasswordRequirements('test');
        expect(requirements[0].met).toBe(false); // length
        expect(requirements[1].met).toBe(false); // number
        expect(requirements[2].met).toBe(false); // uppercase
    });
});

describe('Username Validation', () => {
    it('should accept valid usernames', () => {
        const validUsernames = ['john_doe', 'user123', 'JohnDoe', 'test_user_123'];

        validUsernames.forEach((username) => {
            const result = validateUsername(username);
            expect(result.isValid).toBe(true);
        });
    });

    it('should allow empty username (optional field)', () => {
        const result = validateUsername('');
        expect(result.isValid).toBe(true);
    });

    it('should reject invalid usernames', () => {
        const invalidUsernames = [
            'ab', // too short
            'user@name', // invalid character
            'user name', // space
            'a'.repeat(31), // too long
        ];

        invalidUsernames.forEach((username) => {
            const result = validateUsername(username);
            expect(result.isValid).toBe(false);
        });
    });
});

describe('Full Name Validation', () => {
    it('should accept valid names', () => {
        const result = validateFullName('John Doe');
        expect(result.isValid).toBe(true);
    });

    it('should allow empty name (optional field)', () => {
        const result = validateFullName('');
        expect(result.isValid).toBe(true);
    });

    it('should reject names with script injection', () => {
        const result = validateFullName('<script>alert("xss")</script>');
        expect(result.isValid).toBe(false);
    });

    it('should reject names that are too long', () => {
        const result = validateFullName('a'.repeat(101));
        expect(result.isValid).toBe(false);
    });
});

describe('URL Validation', () => {
    it('should accept valid URLs', () => {
        const validUrls = [
            'https://example.com',
            'http://test.org/path',
            'https://sub.domain.com/page?query=1',
        ];

        validUrls.forEach((url) => {
            const result = validateUrl(url);
            expect(result.isValid).toBe(true);
        });
    });

    it('should allow empty URL (optional field)', () => {
        const result = validateUrl('');
        expect(result.isValid).toBe(true);
    });

    it('should reject javascript: protocol', () => {
        const result = validateUrl('javascript:alert(1)');
        expect(result.isValid).toBe(false);
    });

    it('should accept domain without protocol', () => {
        const result = validateUrl('example.com');
        expect(result.isValid).toBe(true);
    });
});

describe('Input Sanitization', () => {
    it('should escape HTML entities', () => {
        const result = sanitizeInput('<script>alert("xss")</script>');
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
        expect(result).toContain('&lt;');
        expect(result).toContain('&gt;');
    });

    it('should trim whitespace', () => {
        const result = sanitizeInput('  test  ');
        expect(result).toBe('test');
    });

    it('should handle empty input', () => {
        const result = sanitizeInput('');
        expect(result).toBe('');
    });
});

describe('Search Query Sanitization', () => {
    it('should escape LIKE wildcards', () => {
        const result = sanitizeSearchQuery('test%query_here');
        expect(result).toContain('\\%');
        expect(result).toContain('\\_');
    });

    it('should limit query length', () => {
        const longQuery = 'a'.repeat(300);
        const result = sanitizeSearchQuery(longQuery);
        expect(result.length).toBeLessThanOrEqual(200);
    });
});

describe('Rate Limiting', () => {
    beforeEach(() => {
        // Reset rate limits before each test
        resetRateLimit('test-key');
    });

    it('should allow requests within limit', () => {
        const result = checkRateLimit('test-key', 5, 60000, 300000);
        expect(result.isAllowed).toBe(true);
    });

    it('should block after exceeding limit', () => {
        // Make 5 requests
        for (let i = 0; i < 5; i++) {
            checkRateLimit('block-test', 5, 60000, 300000);
        }

        // 6th request should be blocked
        const result = checkRateLimit('block-test', 5, 60000, 300000);
        expect(result.isAllowed).toBe(false);
        expect(result.waitSeconds).toBeDefined();
    });

    it('should reset rate limit correctly', () => {
        // Use up attempts
        for (let i = 0; i < 5; i++) {
            checkRateLimit('reset-test', 5, 60000, 300000);
        }

        // Reset
        resetRateLimit('reset-test');

        // Should be allowed again
        const result = checkRateLimit('reset-test', 5, 60000, 300000);
        expect(result.isAllowed).toBe(true);
    });
});

describe('Safe Error Messages', () => {
    it('should return safe login error', () => {
        const error = new Error('User not found');
        const message = getSafeErrorMessage(error, 'login');
        expect(message).not.toContain('not found');
        expect(message).toContain('Invalid email or password');
    });

    it('should return safe signup error', () => {
        const error = new Error('Database error');
        const message = getSafeErrorMessage(error, 'signup');
        expect(message).not.toContain('Database');
        expect(message).toContain('Unable to create account');
    });

    it('should return safe reset error', () => {
        const error = new Error('Email not in system');
        const message = getSafeErrorMessage(error, 'reset');
        expect(message).not.toContain('not in system');
        expect(message).toContain('reset link has been sent');
    });
});
