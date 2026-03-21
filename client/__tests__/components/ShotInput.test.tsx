import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShotInput from '../../src/components/ShotInput';

describe('ShotInput', () => {
  const defaultProps = {
    type: 'draw' as const,
    turn: 'inturn' as const,
    score: 50 as const,
    isThrowaway: false,
    onTypeChange: vi.fn(),
    onTurnChange: vi.fn(),
    onScoreChange: vi.fn(),
    onThrowaway: vi.fn(),
  };

  it('renders type buttons', () => {
    render(<ShotInput {...defaultProps} />);
    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(screen.getByText('Takeout')).toBeInTheDocument();
  });

  it('renders rotation buttons', () => {
    render(<ShotInput {...defaultProps} />);
    expect(screen.getByText('In')).toBeInTheDocument();
    expect(screen.getByText('Out')).toBeInTheDocument();
  });

  it('renders score buttons', () => {
    render(<ShotInput {...defaultProps} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onThrowaway when throwaway button clicked', async () => {
    const user = userEvent.setup();
    render(<ShotInput {...defaultProps} />);
    await user.click(screen.getByText('Проброс'));
    expect(defaultProps.onThrowaway).toHaveBeenCalled();
  });
});
