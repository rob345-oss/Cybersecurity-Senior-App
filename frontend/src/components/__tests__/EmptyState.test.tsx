import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmptyState from '../EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items found" description="There are no items to display" />)

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('There are no items to display')).toBeInTheDocument()
  })

  it('renders default icon when not provided', () => {
    render(<EmptyState title="Test Title" description="Test Description" />)

    expect(screen.getByText('📋')).toBeInTheDocument()
  })

  it('renders custom icon when provided', () => {
    render(<EmptyState title="Test Title" description="Test Description" icon="🔍" />)

    expect(screen.getByText('🔍')).toBeInTheDocument()
    expect(screen.queryByText('📋')).not.toBeInTheDocument()
  })

  it('applies layout classes', () => {
    const { container } = render(<EmptyState title="Test Title" description="Test Description" />)

    const emptyState = container.firstChild as HTMLElement
    expect(emptyState).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
  })

  it('renders title as heading', () => {
    render(<EmptyState title="Test Title" description="Test Description" />)

    const title = screen.getByText('Test Title')
    expect(title.tagName).toBe('H3')
  })

  it('renders description as paragraph', () => {
    render(<EmptyState title="Test Title" description="Test Description" />)

    const description = screen.getByText('Test Description')
    expect(description.tagName).toBe('P')
  })

  it('handles long title and description', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines'
    const longDescription =
      'This is a very long description that contains a lot of text and might need to wrap to multiple lines in the UI'

    render(<EmptyState title={longTitle} description={longDescription} />)

    expect(screen.getByText(longTitle)).toBeInTheDocument()
    expect(screen.getByText(longDescription)).toBeInTheDocument()
  })

  it('handles empty strings', () => {
    const { container } = render(<EmptyState title="" description="" />)

    expect(container.querySelector('h3')).toBeInTheDocument()
    expect(container.querySelector('p')).toBeInTheDocument()
  })
})
