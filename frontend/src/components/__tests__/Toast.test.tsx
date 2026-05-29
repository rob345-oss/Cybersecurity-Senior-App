import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToastComponent, { Toast } from '../Toast'

describe('Toast', () => {
  const mockOnDismiss = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    mockOnDismiss.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const renderToast = (toast: Toast) => {
    return render(<ToastComponent toast={toast} onDismiss={mockOnDismiss} />)
  }

  it('renders success toast', () => {
    renderToast({ id: '1', message: 'Success message', type: 'success' })
    expect(screen.getByText('Success message')).toBeInTheDocument()
  })

  it('renders error toast', () => {
    renderToast({ id: '2', message: 'Error message', type: 'error' })
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('renders info toast', () => {
    renderToast({ id: '3', message: 'Info message', type: 'info' })
    expect(screen.getByText('Info message')).toBeInTheDocument()
  })

  it('applies success type classes', () => {
    const { container } = renderToast({ id: '1', message: 'Success', type: 'success' })
    const toastElement = container.firstChild as HTMLElement
    expect(toastElement).toHaveClass('bg-green-50', 'text-green-800', 'border-green-200')
  })

  it('applies error type classes', () => {
    const { container } = renderToast({ id: '2', message: 'Error', type: 'error' })
    const toastElement = container.firstChild as HTMLElement
    expect(toastElement).toHaveClass('bg-red-50', 'text-red-800', 'border-red-200')
  })

  it('applies info type classes', () => {
    const { container } = renderToast({ id: '3', message: 'Info', type: 'info' })
    const toastElement = container.firstChild as HTMLElement
    expect(toastElement).toHaveClass('bg-blue-50', 'text-blue-800', 'border-blue-200')
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    renderToast({ id: '1', message: 'Test message', type: 'success' })

    await user.click(screen.getByLabelText('Dismiss'))

    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    expect(mockOnDismiss).toHaveBeenCalledWith('1')
    vi.useFakeTimers()
  })

  it('auto-dismisses after 5 seconds', () => {
    renderToast({ id: '1', message: 'Test message', type: 'success' })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(mockOnDismiss).toHaveBeenCalledWith('1')
  })

  it('does not auto-dismiss before 5 seconds', () => {
    renderToast({ id: '1', message: 'Test message', type: 'success' })

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(mockOnDismiss).not.toHaveBeenCalled()
  })

  it('cleans up timer on unmount', () => {
    const { unmount } = renderToast({ id: '1', message: 'Test message', type: 'success' })
    unmount()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(mockOnDismiss).not.toHaveBeenCalled()
  })

  it('renders dismiss button with correct aria-label', () => {
    renderToast({ id: '1', message: 'Test message', type: 'success' })

    const dismissButton = screen.getByLabelText('Dismiss')
    expect(dismissButton).toBeInTheDocument()
    expect(dismissButton.textContent).toBe('×')
  })

  it('handles long messages', () => {
    const longMessage =
      'This is a very long message that might need to wrap or be truncated in the toast component'
    renderToast({ id: '1', message: longMessage, type: 'info' })
    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})
