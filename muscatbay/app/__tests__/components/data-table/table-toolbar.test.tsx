import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableToolbar } from '@/components/shared/data-table/table-toolbar';

describe('TableToolbar', () => {
  it('renders title and count slots', () => {
    render(
      <TableToolbar title="Assets" count={248}>
        <button>Filters</button>
      </TableToolbar>
    );
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('· 248')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
  });

  it('formats numeric count with locale separators', () => {
    render(<TableToolbar title="Meters" count={1234567} />);
    expect(screen.getByText('· 1,234,567')).toBeInTheDocument();
  });

  it('omits the count chip when count is not provided', () => {
    render(<TableToolbar title="Assets" />);
    expect(screen.queryByText(/^·\s/)).toBeNull();
  });

  it('renders without title (back-compat with existing call sites)', () => {
    render(<TableToolbar><button>Filters</button></TableToolbar>);
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.queryByText(/Assets/)).toBeNull();
  });
});
