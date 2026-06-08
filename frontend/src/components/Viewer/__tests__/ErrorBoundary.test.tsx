/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ErrorBoundary';

function Bomb() {
  throw new Error('test explosion');
}

function Safe() {
  return <div data-testid="safe">all good</div>;
}

// Suppress console.error from React for expected errors in tests
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('ErrorBoundary', () => {
  it('child that throws shows error display', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/RuntimeError/i)).toBeInTheDocument();
  });

  it('child that does not throw renders children normally', () => {
    render(
      <ErrorBoundary>
        <Safe />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('safe')).toBeInTheDocument();
  });

  it('key change resets error state', () => {
    const { rerender } = render(
      <ErrorBoundary key="a">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/RuntimeError/i)).toBeInTheDocument();

    rerender(
      <ErrorBoundary key="b">
        <Safe />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('safe')).toBeInTheDocument();
  });
});
