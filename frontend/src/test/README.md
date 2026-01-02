# Frontend Tests

This directory contains comprehensive test suites for React components using Vitest and React Testing Library.

## Test Structure

### Component Tests

- **`components/__tests__/RiskBadge.test.tsx`** - Tests for RiskBadge component (risk level display, CSS classes)
- **`components/__tests__/RiskCard.test.tsx`** - Tests for RiskCard component (risk display, actions, scripts)
- **`components/__tests__/ChipGrid.test.tsx`** - Tests for ChipGrid component (selection, interactions)
- **`components/__tests__/EmptyState.test.tsx`** - Tests for EmptyState component (display, icons)
- **`components/__tests__/Toast.test.tsx`** - Tests for Toast component (types, auto-dismiss, interactions)

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- RiskBadge.test.tsx
```

## Test Setup

Tests are configured using:
- **Vitest** - Fast test runner
- **React Testing Library** - Component testing utilities
- **jsdom** - DOM environment for tests
- **@testing-library/jest-dom** - Custom matchers for DOM assertions
- **@testing-library/user-event** - User interaction simulation

## Test Coverage

The test suite provides comprehensive coverage for:

- ✅ Component rendering
- ✅ User interactions (clicks, form inputs)
- ✅ Props handling
- ✅ Conditional rendering
- ✅ CSS class application
- ✅ Accessibility (ARIA labels)
- ✅ Edge cases (empty data, missing props)

## Writing New Tests

When adding new components, create a test file in `components/__tests__/`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Test user behavior, not implementation details**
2. **Use semantic queries** (getByRole, getByLabelText) when possible
3. **Test accessibility** (ARIA labels, keyboard navigation)
4. **Test edge cases** (empty data, null values, long strings)
5. **Keep tests isolated** (each test should be independent)

## Requirements

Tests require the following dependencies (already in `package.json`):
- vitest
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- jsdom

