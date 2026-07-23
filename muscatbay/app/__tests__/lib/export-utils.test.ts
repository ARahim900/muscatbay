import { describe, it, expect, vi, afterEach } from 'vitest';
import { objectsToCSV, downloadFile, exportToCSV, getDateForFilename } from '@/lib/export-utils';

describe('objectsToCSV', () => {
    it('builds a header row plus one line per object', () => {
        const csv = objectsToCSV([
            { name: 'OWATCO', value: 389693 },
            { name: 'Kalhat', value: 52000 },
        ]);
        expect(csv).toBe('name,value\nOWATCO,389693\nKalhat,52000');
    });

    it('uses provided columns for selection, order and headers', () => {
        const csv = objectsToCSV(
            [{ a: 1, b: 2, c: 3 }],
            [
                { key: 'c', header: 'Third' },
                { key: 'a', header: 'First' },
            ]
        );
        expect(csv).toBe('Third,First\n3,1');
    });

    it('escapes commas, quotes and newlines', () => {
        const csv = objectsToCSV([{ v: 'a,b', w: 'say "hi"', x: 'two\nlines' }]);
        expect(csv).toBe('v,w,x\n"a,b","say ""hi""","two\nlines"');
    });

    it('renders null and undefined as empty cells', () => {
        const csv = objectsToCSV([{ a: null, b: undefined, c: 0 }]);
        expect(csv).toBe('a,b,c\n,,0');
    });

    it('joins array values with a semicolon separator', () => {
        const csv = objectsToCSV([{ systems: ['FA', 'FE', 'Hose Reel'] }]);
        expect(csv).toBe('systems\nFA; FE; Hose Reel');
    });

    it('returns only the header row for empty data when columns are given', () => {
        const csv = objectsToCSV<Record<string, unknown>>([], [
            { key: 'a', header: 'A' },
            { key: 'b', header: 'B' },
        ]);
        expect(csv).toBe('A,B');
    });

    it('returns an empty string for empty data without columns', () => {
        expect(objectsToCSV([])).toBe('');
    });
});

describe('downloadFile', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('prefixes CSV downloads with a UTF-8 BOM so Excel detects the encoding', () => {
        // jsdom's Blob has no .text(); capture the constructor input instead.
        const blobCalls: { parts: unknown[]; type?: string }[] = [];
        class MockBlob {
            constructor(parts: unknown[], opts?: { type?: string }) {
                blobCalls.push({ parts, type: opts?.type });
            }
        }
        vi.stubGlobal('Blob', MockBlob);
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn(() => 'blob:mock'),
            revokeObjectURL: vi.fn(),
        });
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

        downloadFile('a,b\n1,2', 'test.csv');

        expect(click).toHaveBeenCalledOnce();
        expect(blobCalls).toHaveLength(1);
        expect(blobCalls[0].parts).toEqual(['\uFEFF' + 'a,b\n1,2']);
        expect(blobCalls[0].type).toBe('text/csv;charset=utf-8;');
        vi.unstubAllGlobals();
    });
});

describe('exportToCSV', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('appends .csv exactly once and downloads the built CSV', () => {
        const created: string[] = [];
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn(() => 'blob:mock'),
            revokeObjectURL: vi.fn(),
        });
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            created.push(this.download);
        });

        exportToCSV([{ a: 1 }], 'report');
        exportToCSV([{ a: 1 }], 'report.csv');

        expect(created).toEqual(['report.csv', 'report.csv']);
    });
});

describe('getDateForFilename', () => {
    it('returns an ISO date (YYYY-MM-DD)', () => {
        expect(getDateForFilename()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
