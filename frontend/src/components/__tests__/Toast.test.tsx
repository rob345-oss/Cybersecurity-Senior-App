import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastComponent, { Toast } from '../Toast';

describe('Toast', () => {
  const mockOnDismiss = vi.fn();
  
  beforeEach(() => {
    vi.useFakeTimers();
    mockOnDismiss.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderToast = (toast: Toast) => {
    return render(<ToastComponent toast={toast} onDismiss={mockOnDismiss} />);
  };

  it('renders success toast', () => {
    const toast: Toast = {
      id: '1',
      message: 'Success message',
      type: 'success',
    };
    
    renderToast(toast);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders error toast', () => {
    const toast: Toast = {
      id: '2',
      message: 'Error message',
      type: 'error',
    };
    
    renderToast(toast);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders info toast', () => {
    const toast: Toast = {
      id: '3',
      message: 'Info message',
      type: 'info',
    };
    
    renderToast(toast);
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('applies correct styles for success toast', () => {
    const toast: Toast = {
      id: '1',
      message: 'Success',
      type: 'success',
    };
    
    const { container } = renderToast(toast);
    const toastElement = container.firstChild as HTMLElement;
    
    expect(toastElement).toHaveStyle({
      backgroundColor: '#dcfce7',
      color: '#166534',
    });
  });

  it('applies correct styles for error toast', () => {
    const toast: Toast = {
      id: '2',
      message: 'Error',
      type: 'error',
    };
    
    const { container } = renderToast(toast);
    const toastElement = container.firstChild as HTMLElement;
    
    expect(toastElement).toHaveStyle({
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    });
  });

  it('applies correct styles for info toast', () => {
    const toast: Toast = {
      id: '3',
      message: 'Info',
      type: 'info',
    };
    
    const { container } = renderToast(toast);
    const toastElement = container.firstChild as HTMLElement;
    
    expect(toastElement).toHaveStyle({
      backgroundColor: '#dbeafe',
      color: '#1e40af',
    });
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const toast: Toast = {
      id: '1',
      message: 'Test message',
      type: 'success',
    };
    
    renderToast(toast);
    
    const dismissButton = screen.getByLabelText('Dismiss');
    await user.click(dismissButton);
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).toHaveBeenCalledWith('1');
  });

  it('auto-dismisses after 5 seconds', async () => {
    const toast: Toast = {
      id: '1',
      message: 'Test message',
      type: 'success',
    };
    
    renderToast(toast);
    
    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('1');
    });
  });

  it('does not auto-dismiss before 5 seconds', () => {
    const toast: Toast = {
      id: '1',
      message: 'Test message',
      type: 'success',
    };
    
    renderToast(toast);
    
    // Fast-forward 4 seconds (less than 5)
    vi.advanceTimersByTime(4000);
    
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('cleans up timer on unmount', () => {
    const toast: Toast = {
      id: '1',
      message: 'Test message',
      type: 'success',
    };
    
    const { unmount } = renderToast(toast);
    unmount();
    
    // Fast-forward time after unmount
    vi.advanceTimersByTime(5000);
    
    // Should not call onDismiss after unmount
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('renders dismiss button with correct aria-label', () => {
    const toast: Toast = {
      id: '1',
      message: 'Test message',
      type: 'success',
    };
    
    renderToast(toast);
    
    const dismissButton = screen.getByLabelText('Dismiss');
    expect(dismissButton).toBeInTheDocument();
    expect(dismissButton.textContent).toBe('×');
  });

  it('handles long messages', () => {
    const longMessage = 'This is a very long message that might need to wrap or be truncated in the toast component';
    const toast: Toast = {
      id: '1',
      message: longMessage,
      type: 'info',
    };
    
    renderToast(toast);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });
});

