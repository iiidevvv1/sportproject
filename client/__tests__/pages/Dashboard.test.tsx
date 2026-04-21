import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../../src/pages/Dashboard';

const getGames = vi.fn();
const getVersion = vi.fn().mockResolvedValue({ version: '1.9.0' });

vi.mock('../../src/api', () => ({
  getGames: (...args: unknown[]) => getGames(...args),
  getVersion: (...args: unknown[]) => getVersion(...args),
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
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([]);
  });

  it('renders page title', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('Керлинг Стат')).toBeInTheDocument();
  });

  it('shows new game button', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('Новая игра')).toBeInTheDocument();
  });

  it('enters export selection mode for finished games', async () => {
    getGames.mockResolvedValue([
      {
        id: 1,
        date: '2026-04-21',
        team_home: 'Альфа',
        team_away: 'Бета',
        color_home: 'red',
        color_away: 'blue',
        hammer_first_end: 'home',
        max_ends: 8,
        status: 'finished',
        created_at: '2026-04-21T09:00:00Z',
        score_home: 5,
        score_away: 3,
      },
    ]);

    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);

    await user.click(await screen.findByRole('button', { name: 'Выгрузка Excel' }));

    expect(screen.getByRole('button', { name: 'Скачать .xlsx' })).toBeDisabled();
    expect(screen.getByText('Выбрано игр: 0')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Выбрать игру Альфа — Бета' })).toBeInTheDocument();
  });
});
