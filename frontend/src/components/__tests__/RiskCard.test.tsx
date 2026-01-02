import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskCard from '../RiskCard';
import { RiskResponse } from '../../types';

const mockRiskResponse: RiskResponse = {
  score: 75,
  level: 'high',
  reasons: ['Suspicious activity detected', 'Multiple red flags'],
  next_action: 'Verify the caller independently',
  recommended_actions: [
    {
      id: 'action-1',
      title: 'Pause and verify',
      detail: 'Take time to verify the request',
    },
    {
      id: 'action-2',
      title: 'Contact support',
      detail: 'Reach out to official support channels',
    },
  ],
  safe_script: {
    say_this: 'I need to verify this independently',
    if_they_push_back: 'I will not proceed without verification',
  },
  metadata: {},
};

describe('RiskCard', () => {
  it('renders risk badge with score and level', () => {
    render(<RiskCard risk={mockRiskResponse} />);
    expect(screen.getByText(/high risk/i)).toBeInTheDocument();
    expect(screen.getByText(/75/)).toBeInTheDocument();
  });

  it('displays next action', () => {
    render(<RiskCard risk={mockRiskResponse} />);
    expect(screen.getByText(/Next best action:/i)).toBeInTheDocument();
    expect(screen.getByText(/Verify the caller independently/i)).toBeInTheDocument();
  });

  it('displays all reasons', () => {
    render(<RiskCard risk={mockRiskResponse} />);
    expect(screen.getByText(/Why we flagged this/i)).toBeInTheDocument();
    expect(screen.getByText(/Suspicious activity detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Multiple red flags/i)).toBeInTheDocument();
  });

  it('displays recommended actions', () => {
    render(<RiskCard risk={mockRiskResponse} />);
    expect(screen.getByText(/Recommended actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Pause and verify/i)).toBeInTheDocument();
    expect(screen.getByText(/Take time to verify the request/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact support/i)).toBeInTheDocument();
  });

  it('displays safe script when present', () => {
    render(<RiskCard risk={mockRiskResponse} />);
    expect(screen.getByText(/Safety script/i)).toBeInTheDocument();
    expect(screen.getByText(/I need to verify this independently/i)).toBeInTheDocument();
    expect(screen.getByText(/I will not proceed without verification/i)).toBeInTheDocument();
  });

  it('does not display safe script section when absent', () => {
    const riskWithoutScript: RiskResponse = {
      ...mockRiskResponse,
      safe_script: undefined,
    };
    render(<RiskCard risk={riskWithoutScript} />);
    expect(screen.queryByText(/Safety script/i)).not.toBeInTheDocument();
  });

  it('does not display recommended actions section when empty', () => {
    const riskWithoutActions: RiskResponse = {
      ...mockRiskResponse,
      recommended_actions: [],
    };
    render(<RiskCard risk={riskWithoutActions} />);
    expect(screen.queryByText(/Recommended actions/i)).not.toBeInTheDocument();
  });

  it('handles empty reasons array', () => {
    const riskWithNoReasons: RiskResponse = {
      ...mockRiskResponse,
      reasons: [],
    };
    render(<RiskCard risk={riskWithNoReasons} />);
    expect(screen.getByText(/Why we flagged this/i)).toBeInTheDocument();
  });

  it('renders with low risk level', () => {
    const lowRisk: RiskResponse = {
      ...mockRiskResponse,
      score: 20,
      level: 'low',
    };
    render(<RiskCard risk={lowRisk} />);
    expect(screen.getByText(/low risk/i)).toBeInTheDocument();
  });

  it('renders with medium risk level', () => {
    const mediumRisk: RiskResponse = {
      ...mockRiskResponse,
      score: 50,
      level: 'medium',
    };
    render(<RiskCard risk={mediumRisk} />);
    expect(screen.getByText(/medium risk/i)).toBeInTheDocument();
  });
});

