import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/shared/data-table/status-badge';

describe('StatusBadge', () => {
  it('renders a dot by default (no lucide icon)', () => {
    render(<StatusBadge label="Active" color="green" />);
    expect(screen.getByTestId('status-badge-dot')).toBeInTheDocument();
    expect(screen.queryByTestId('status-badge-icon')).toBeNull();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders the lucide icon when iconVariant="icon"', () => {
    render(<StatusBadge label="Active" color="green" iconVariant="icon" />);
    expect(screen.getByTestId('status-badge-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('status-badge-dot')).toBeNull();
  });

  it('renders nothing leading when iconVariant="none"', () => {
    render(<StatusBadge label="Active" color="green" iconVariant="none" />);
    expect(screen.queryByTestId('status-badge-dot')).toBeNull();
    expect(screen.queryByTestId('status-badge-icon')).toBeNull();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('back-compat: hideIcon prop keeps the dot variant', () => {
    render(<StatusBadge label="Active" color="green" hideIcon />);
    expect(screen.getByTestId('status-badge-dot')).toBeInTheDocument();
    expect(screen.queryByTestId('status-badge-icon')).toBeNull();
  });
});
