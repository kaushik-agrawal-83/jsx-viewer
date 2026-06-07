import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('App', () => {
  it('renders JSX Viewer heading', () => {
    render(<App />);
    expect(screen.getByText('⚛ JSX Viewer')).toBeInTheDocument();
  });
});
