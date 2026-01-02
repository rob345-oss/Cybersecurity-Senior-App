import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChipGrid from '../ChipGrid';

describe('ChipGrid', () => {
  const mockItems = ['item_1', 'item_2', 'item_3', 'test_item'];
  const mockSelected = new Set(['item_1']);
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  it('renders all items', () => {
    render(
      <ChipGrid
        items={mockItems}
        selected={mockSelected}
        onToggle={mockOnToggle}
      />
    );
    
    mockItems.forEach((item) => {
      const displayText = item.replaceAll('_', ' ');
      expect(screen.getByText(displayText)).toBeInTheDocument();
    });
  });

  it('applies selected class to selected items', () => {
    const { container } = render(
      <ChipGrid
        items={mockItems}
        selected={mockSelected}
        onToggle={mockOnToggle}
      />
    );
    
    const buttons = container.querySelectorAll('.chip');
    const firstButton = buttons[0];
    expect(firstButton).toHaveClass('selected');
  });

  it('does not apply selected class to unselected items', () => {
    const { container } = render(
      <ChipGrid
        items={mockItems}
        selected={mockSelected}
        onToggle={mockOnToggle}
      />
    );
    
    const buttons = container.querySelectorAll('.chip');
    const secondButton = buttons[1];
    expect(secondButton).not.toHaveClass('selected');
  });

  it('calls onToggle when chip is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ChipGrid
        items={mockItems}
        selected={mockSelected}
        onToggle={mockOnToggle}
      />
    );
    
    const item2Button = screen.getByText('item 2');
    await user.click(item2Button);
    
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith('item_2');
  });

  it('replaces underscores with spaces in display text', () => {
    render(
      <ChipGrid
        items={['test_item', 'another_test']}
        selected={new Set()}
        onToggle={mockOnToggle}
      />
    );
    
    expect(screen.getByText('test item')).toBeInTheDocument();
    expect(screen.getByText('another test')).toBeInTheDocument();
  });

  it('handles empty items array', () => {
    const { container } = render(
      <ChipGrid
        items={[]}
        selected={new Set()}
        onToggle={mockOnToggle}
      />
    );
    
    const buttons = container.querySelectorAll('.chip');
    expect(buttons.length).toBe(0);
  });

  it('handles empty selected set', () => {
    const { container } = render(
      <ChipGrid
        items={mockItems}
        selected={new Set()}
        onToggle={mockOnToggle}
      />
    );
    
    const buttons = container.querySelectorAll('.chip.selected');
    expect(buttons.length).toBe(0);
  });

  it('handles multiple selected items', () => {
    const multipleSelected = new Set(['item_1', 'item_3']);
    const { container } = render(
      <ChipGrid
        items={mockItems}
        selected={multipleSelected}
        onToggle={mockOnToggle}
      />
    );
    
    const selectedButtons = container.querySelectorAll('.chip.selected');
    expect(selectedButtons.length).toBe(2);
  });

  it('renders buttons with correct type', () => {
    render(
      <ChipGrid
        items={mockItems}
        selected={mockSelected}
        onToggle={mockOnToggle}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});

