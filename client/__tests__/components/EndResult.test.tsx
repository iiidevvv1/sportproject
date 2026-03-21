import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EndResult from '../../src/components/EndResult';

describe('EndResult', () => {
  const props = {
    teamHome: 'Красные',
    teamAway: 'Синие',
    endNumber: 3,
    onSubmit: vi.fn(),
  };

  it('shows end number in title', () => {
    render(<EndResult {...props} />);
    expect(screen.getByText('Результат энда 3')).toBeInTheDocument();
  });

  it('has team selection buttons', () => {
    render(<EndResult {...props} />);
    expect(screen.getByText('Красные')).toBeInTheDocument();
    expect(screen.getByText('Синие')).toBeInTheDocument();
  });

  it('has blank end option', () => {
    render(<EndResult {...props} />);
    expect(screen.getByText('Нулевой энд (0:0)')).toBeInTheDocument();
  });
});
