/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createLocalStorageMock } from '../test-utils/localStorage';
import App from '../App';

vi.stubGlobal('localStorage', createLocalStorageMock());

describe('App', () => {
  it('renders JSX Viewer heading', () => {
    render(<App />);
    expect(screen.getByText('⚛ JSX Viewer')).toBeInTheDocument();
  });
});
