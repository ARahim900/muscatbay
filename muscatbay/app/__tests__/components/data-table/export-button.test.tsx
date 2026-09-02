import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '@/components/shared/data-table/export-button';
import { exportToCSV } from '@/lib/export-utils';

vi.mock('@/lib/export-utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/export-utils')>();
    return { ...actual, exportToCSV: vi.fn() };
});

const exportToCSVMock = vi.mocked(exportToCSV);

interface Row extends Record<string, unknown> {
    name: string;
    status: string | null;
    active: boolean;
}

const rows: Row[] = [
    { name: 'OWATCO', status: 'Active', active: true },
    { name: 'Kalhat', status: null, active: false },
];

describe('ExportButton', () => {
    beforeEach(() => {
        exportToCSVMock.mockClear();
    });

    it('is disabled when there are no rows', () => {
        render(<ExportButton rows={[]} filename="empty" />);
        expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
        expect(exportToCSVMock).not.toHaveBeenCalled();
    });

    it('exports every property when no columns are given', () => {
        render(<ExportButton rows={rows} filename="contractors" />);
        fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

        expect(exportToCSVMock).toHaveBeenCalledOnce();
        const [data, filename] = exportToCSVMock.mock.calls[0];
        expect(data).toEqual([
            { name: 'OWATCO', status: 'Active', active: true },
            { name: 'Kalhat', status: null, active: false },
        ]);
        expect(filename).toMatch(/^contractors-\d{4}-\d{2}-\d{2}$/);
    });

    it('applies column selection, headers and formatters', () => {
        render(
            <ExportButton
                rows={rows}
                filename="tracker"
                columns={[
                    { key: 'name', header: 'Contractor' },
                    { key: 'active', header: 'State', format: (r) => (r.active ? 'Open' : 'Closed') },
                ]}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

        const [data] = exportToCSVMock.mock.calls[0];
        expect(data).toEqual([
            { Contractor: 'OWATCO', State: 'Open' },
            { Contractor: 'Kalhat', State: 'Closed' },
        ]);
    });

    it('shows the row count in the hover title', () => {
        render(<ExportButton rows={rows} filename="x" />);
        expect(screen.getByRole('button', { name: 'Export CSV' })).toHaveAttribute(
            'title',
            'Download 2 rows as CSV'
        );
    });

    it('supports a custom label', () => {
        render(<ExportButton rows={rows} filename="x" label="Export Register" />);
        expect(screen.getByRole('button', { name: 'Export Register' })).toBeInTheDocument();
    });

    it('carries a ≥44px touch target in BOTH axes on coarse pointers', () => {
        render(<ExportButton rows={rows} filename="x" />);
        const button = screen.getByRole('button', { name: 'Export CSV' });

        // Below `sm` the label is hidden and only the icon shows, so the width
        // floor matters as much as the height one (WCAG 2.5.5).
        expect(button.className).toContain('pointer-coarse:min-h-11');
        expect(button.className).toContain('pointer-coarse:min-w-11');
        // Mouse sizing is unchanged.
        expect(button.className).toContain('min-h-[36px]');
    });
});
