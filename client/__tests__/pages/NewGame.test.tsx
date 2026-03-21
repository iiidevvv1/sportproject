import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewGame from '../../src/pages/NewGame';

vi.mock('../../src/api', () => ({
  createGame: vi.fn().mockResolvedValue({ id: 1 }),
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

describe('NewGame', () => {
  it('renders form fields', () => {
    renderWithProviders(<NewGame />);
    expect(screen.getByText('Новая игра')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Введите название...').length).toBeGreaterThan(0);
  });

  it('has team name inputs', () => {
    renderWithProviders(<NewGame />);
    const inputs = screen.getAllByPlaceholderText('Введите название...');
    expect(inputs).toHaveLength(2);
  });

  it('has ends selector with 8 and 10 options', () => {
    renderWithProviders(<NewGame />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
