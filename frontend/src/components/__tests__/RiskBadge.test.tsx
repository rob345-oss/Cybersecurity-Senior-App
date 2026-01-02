import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskBadge from '../RiskBadge';

describe('RiskBadge', () => {
  it('renders with low risk level', () => {
    render(<RiskBadge level="low" score={25} />);
    const badge = screen.getByText(/low risk/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('25');
  });

  it('renders with medium risk level', () => {
    render(<RiskBadge level="medium" score={50} />);
    const badge = screen.getByText(/medium risk/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('50');
  });

  it('renders with high risk level', () => {
    render(<RiskBadge level="high" score={85} />);
    const badge = screen.getByText(/high risk/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('85');
  });

  it('applies correct CSS class for low risk', () => {
    const { container } = render(<RiskBadge level="low" score={20} />);
    const badge = container.querySelector('.risk-badge');
    expect(badge).toHaveClass('low');
  });

  it('applies correct CSS class for medium risk', () => {
    const { container } = render(<RiskBadge level="medium" score={50} />);
    const badge = container.querySelector('.risk-badge');
    expect(badge).toHaveClass('medium');
  });

  it('applies correct CSS class for high risk', () => {
    const { container } = render(<RiskBadge level="high" score={80} />);
    const badge = container.querySelector('.risk-badge');
    expect(badge).toHaveClass('high');
  });

  it('handles case-insensitive level input', () => {
    render(<RiskBadge level="LOW" score={25} />);
    const badge = screen.getByText(/low risk/i);
    expect(badge).toBeInTheDocument();
  });

  it('displays score correctly', () => {
    render(<RiskBadge level="medium" score={75} />);
    expect(screen.getByText(/75/)).toBeInTheDocument();
  });

  it('handles zero score', () => {
    render(<RiskBadge level="low" score={0} />);
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it('handles maximum score', () => {
    render(<RiskBadge level="high" score={100} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });
});

