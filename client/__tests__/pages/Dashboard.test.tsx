import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../../src/pages/Dashboard';

vi.mock('../../src/api', () => ({
  getGames: vi.fn().mockResolvedValue([]),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Dashboard', () => {
  it('renders page title', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('Керлинг Стат')).toBeInTheDocument();
  });

  it('shows new game button', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('Новая игра')).toBeInTheDocument();
  });
});
