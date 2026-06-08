/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Preview } from '../Preview';

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('Preview', () => {
  it('null source renders EmptyPane', () => {
    render(<Preview source={null} fileName="" />);
    expect(screen.getByText(/Drop a .jsx/i)).toBeInTheDocument();
  });

  it('valid JSX source renders component in DOM', async () => {
    render(
      <Preview
        source={`export default function Hello() { return <div data-testid="hi">Hello</div>; }`}
        fileName="hello.jsx"
      />,
    );
    await waitFor(() => expect(screen.getByTestId('hi')).toBeInTheDocument());
  });

  it('invalid JSX source renders transpile error card', () => {
    render(<Preview source="export default function Broken() { return <div" fileName="bad.jsx" />);
    expect(screen.getByText(/SyntaxError/i)).toBeInTheDocument();
  });

  it('source with runtime throw renders runtime error card', async () => {
    const source = `export default function Bomb() {
  const x = null;
  return <div>{x.boom}</div>;
}`;
    render(<Preview source={source} fileName="bomb.jsx" />);
    await waitFor(() => expect(screen.getByText(/RuntimeError/i)).toBeInTheDocument());
  });
});
