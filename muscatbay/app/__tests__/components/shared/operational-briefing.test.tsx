import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { OperationalBriefing } from '@/components/shared/operational-briefing';

describe('OperationalBriefing', () => {
    it('shows a period label and limits the management summary to four findings', () => {
        render(
            <OperationalBriefing
                periodLabel="Jan – Jul 2026"
                items={Array.from({ length: 5 }, (_, index) => ({
                    label: `Finding ${index + 1}`,
                    value: String(index + 1),
                    icon: Activity,
                }))}
            />,
        );

        expect(screen.getByText('Jan – Jul 2026')).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(4);
        expect(screen.queryByText('Finding 5')).not.toBeInTheDocument();
    });

    it('announces semantic severity in visible text as well as colour', () => {
        render(
            <OperationalBriefing
                periodLabel="Jul 2026"
                items={[{ label: 'Unresolved findings', value: '3 to review', icon: Activity, severity: 'danger', description: 'Action required' }]}
            />,
        );

        expect(screen.getByText('3 to review')).toBeInTheDocument();
        expect(screen.getByText('Action required')).toBeInTheDocument();
    });
});
