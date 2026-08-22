import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlantWatch } from '@/components/stp/plant-watch';
import type { STPOperation } from '@/lib/mock-data';

const healthyOperations: STPOperation[] = [
    { id: '1', date: '2026-01-01', inlet_sewage: 100, tse_for_irrigation: 100, tanker_trips: 0 },
    { id: '2', date: '2026-01-02', inlet_sewage: 100, tse_for_irrigation: 100, tanker_trips: 0 },
    { id: '3', date: '2026-01-03', inlet_sewage: 100, tse_for_irrigation: 100, tanker_trips: 0 },
];

describe('PlantWatch', () => {
    it('renders the five STP process indicators in the shared table layout', () => {
        render(<PlantWatch operations={healthyOperations} />);

        expect(screen.getByRole('table', { name: 'STP process health' })).toBeInTheDocument();
        expect(screen.getByText('Treatment Efficiency')).toBeInTheDocument();
        expect(screen.getByText('Hydraulic Load')).toBeInTheDocument();
        expect(screen.getByText('TSE Reuse')).toBeInTheDocument();
        expect(screen.getByText('Tanker Load')).toBeInTheDocument();
        expect(screen.getByText('Data Completeness')).toBeInTheDocument();
    });

    it('shows the all-clear state when Attention only is enabled for a healthy period', () => {
        render(<PlantWatch operations={healthyOperations} />);

        fireEvent.click(screen.getByRole('button', { name: 'Attention only' }));

        expect(screen.getByText('No STP process indicators need attention in this period.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Attention only' })).toHaveAttribute('aria-pressed', 'true');
    });
});
