import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LessonReader from '../LessonReader'
import { techSupportScamsLesson } from '../../../lessons/data/tech-support-scams'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

describe('LessonReader', () => {
  it('renders lesson title and all major section types', () => {
    render(<LessonReader lesson={techSupportScamsLesson} />)

    expect(screen.getByRole('heading', { level: 1, name: 'How to Spot Tech Support Scams' })).toBeInTheDocument()
    expect(screen.getByText('Goal of This Lesson')).toBeInTheDocument()
    expect(screen.getByText('What a Tech Support Scam Might Sound Like')).toBeInTheDocument()
    expect(screen.getByText('Things to Notice')).toBeInTheDocument()
    expect(screen.getByText('Simple Rule to Remember')).toBeInTheDocument()
    expect(screen.getByText('What You Should Do Instead')).toBeInTheDocument()
    expect(screen.getByText('Example Situation')).toBeInTheDocument()
    expect(screen.getByText('Practice Question')).toBeInTheDocument()
    expect(screen.getByText('Final Takeaway')).toBeInTheDocument()
  })

  it('renders scam quote examples', () => {
    render(<LessonReader lesson={techSupportScamsLesson} />)

    expect(screen.getByText(/Your computer has a virus/)).toBeInTheDocument()
    expect(screen.getByText(/Your account has been hacked/)).toBeInTheDocument()
  })

  it('includes CallGuard practice link', () => {
    render(<LessonReader lesson={techSupportScamsLesson} />)

    const link = screen.getByRole('link', { name: /Practice with CallGuard/i })
    expect(link).toHaveAttribute('href', '/dashboard/callguard')
  })
})
