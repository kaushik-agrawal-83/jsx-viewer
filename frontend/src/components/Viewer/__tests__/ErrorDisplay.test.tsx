/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorDisplay } from '../ErrorDisplay';

describe('ErrorDisplay', () => {
  it('shows SyntaxError for transpile type', () => {
    render(<ErrorDisplay type="transpile" error={{ message: 'bad syntax' }} />);
    expect(screen.getByText(/SyntaxError/i)).toBeInTheDocument();
  });

  it('shows RuntimeError for runtime type', () => {
    render(<ErrorDisplay type="runtime" error={{ message: 'boom' }} />);
    expect(screen.getByText(/RuntimeError/i)).toBeInTheDocument();
  });

  it('shows line and col when provided', () => {
    render(<ErrorDisplay type="transpile" error={{ message: 'err', line: 5, col: 10 }} />);
    expect(screen.getByText('Line 5:10')).toBeInTheDocument();
  });

  it('does not show line/col section when absent', () => {
    render(<ErrorDisplay type="runtime" error={{ message: 'err' }} />);
    expect(screen.queryByText(/Line/)).not.toBeInTheDocument();
  });
});
