import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CONFIG, STP_RATES, ELECTRICITY_RATES, WATER_RATES, PAGINATION, UI_CONFIG } from '@/lib/config';

describe('Configuration', () => {
    describe('STP_RATES', () => {
        it('should have valid TANKER_FEE', () => {
            expect(STP_RATES.TANKER_FEE).toBe(4.50);
            expect(typeof STP_RATES.TANKER_FEE).toBe('number');
        });

        it('should have valid TSE_SAVING_RATE', () => {
            expect(STP_RATES.TSE_SAVING_RATE).toBe(0.80);
            expect(typeof STP_RATES.TSE_SAVING_RATE).toBe('number');
        });
    });

    describe('ELECTRICITY_RATES', () => {
        it('should have valid RATE_PER_KWH', () => {
            expect(ELECTRICITY_RATES.RATE_PER_KWH).toBe(0.025);
            expect(typeof ELECTRICITY_RATES.RATE_PER_KWH).toBe('number');
        });
    });

    describe('WATER_RATES', () => {
        it('should have valid RATE_PER_M3', () => {
            expect(WATER_RATES.RATE_PER_M3).toBe(0.50);
            expect(typeof WATER_RATES.RATE_PER_M3).toBe('number');
        });
    });

    describe('PAGINATION', () => {
        it('should have valid pagination settings', () => {
            expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(50);
            expect(PAGINATION.MAX_PAGE_SIZE).toBe(100);
            expect(PAGINATION.TABLE_PAGE_SIZE).toBe(25);
        });

        it('should have MAX_PAGE_SIZE >= DEFAULT_PAGE_SIZE', () => {
            expect(PAGINATION.MAX_PAGE_SIZE).toBeGreaterThanOrEqual(PAGINATION.DEFAULT_PAGE_SIZE);
        });
    });

    describe('UI_CONFIG', () => {
        it('should have valid date formats', () => {
            expect(UI_CONFIG.DATE_FORMAT).toBe('dd MMM yyyy');
            expect(UI_CONFIG.DATE_FORMAT_SHORT).toBe('MMM yyyy');
        });

        it('should have valid currency settings', () => {
            expect(UI_CONFIG.CURRENCY).toBe('OMR');
            expect(UI_CONFIG.CURRENCY_DECIMALS).toBe(3);
        });
    });

    describe('CONFIG (default export)', () => {
        it('should contain all config sections', () => {
            expect(CONFIG.STP).toBe(STP_RATES);
            expect(CONFIG.ELECTRICITY).toBe(ELECTRICITY_RATES);
            expect(CONFIG.WATER).toBe(WATER_RATES);
            expect(CONFIG.PAGINATION).toBe(PAGINATION);
            expect(CONFIG.UI).toBe(UI_CONFIG);
        });
    });
});
