import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PracticeQuestion from '../PracticeQuestion'

describe('PracticeQuestion', () => {
  it('reveals explanation when Suspicious is selected', async () => {
    const user = userEvent.setup()

    render(
      <PracticeQuestion
        question="A caller asks for your password. Is this safe or suspicious?"
        correctAnswer="suspicious"
        explanation="A real company will not call unexpectedly and ask for your password."
      />
    )

    await user.click(screen.getByRole('button', { name: 'Suspicious' }))

    expect(screen.getByText("That's right!")).toBeInTheDocument()
    expect(
      screen.getByText('A real company will not call unexpectedly and ask for your password.')
    ).toBeInTheDocument()
  })

  it('shows feedback when incorrect answer is selected', async () => {
    const user = userEvent.setup()

    render(
      <PracticeQuestion
        question="A caller asks for your password. Is this safe or suspicious?"
        correctAnswer="suspicious"
        explanation="A real company will not call unexpectedly and ask for your password."
      />
    )

    await user.click(screen.getByRole('button', { name: 'Safe' }))

    expect(screen.getByText("Let's try again.")).toBeInTheDocument()
  })
})
