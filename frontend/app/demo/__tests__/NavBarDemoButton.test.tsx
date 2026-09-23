import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavBar from '@/app/components/home/NavBar'

vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    logout: vi.fn(),
    user: null,
    loginWithTokens: vi.fn(),
    refreshUser: vi.fn(),
  }),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('NavBar demo CTA', () => {
  it('shows Try Live Demo in the desktop header actions', () => {
    render(<NavBar />)
    const links = screen.getAllByRole('link', { name: /try live demo/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute('href', '/demo')
    expect(links[0]).toHaveAttribute('title', 'No signup required — stays on this website')
  })

  it('shows a compact Demo CTA in the mobile header bar', () => {
    render(<NavBar />)
    const links = screen.getAllByRole('link', { name: /try live demo/i })
    // Desktop full label + mobile compact "Demo" (same accessible name via aria-label)
    expect(links.length).toBeGreaterThanOrEqual(2)
    expect(links.some((link) => link.textContent?.includes('Demo'))).toBe(true)
  })

  it('shows Try Live Demo inside the mobile navigation menu', async () => {
    const user = userEvent.setup()
    render(<NavBar />)
    await user.click(screen.getByRole('button', { name: /toggle menu/i }))
    const links = screen.getAllByRole('link', { name: /try live demo/i })
    expect(links.some((link) => link.getAttribute('href') === '/demo')).toBe(true)
  })
})
