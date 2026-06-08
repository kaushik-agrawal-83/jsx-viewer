/// <reference types="vitest/globals" />
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { transpile } from '../transpiler';
import { evalComponent } from '../renderer';

describe('full pipeline', () => {
  it('JSX string → transpile → evalComponent → renders DOM content', () => {
    const source = `export default function Hello() {
  return <div data-testid="hello">Hello world</div>;
}`;
    const result = transpile(source);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const Comp = evalComponent(result.code);
    const { getByTestId } = render(React.createElement(Comp));
    expect(getByTestId('hello')).toBeInTheDocument();
  });

  it('JSX using lucide-react renders without Unknown placeholder', () => {
    const source = `import { Star } from 'lucide-react';
export default function IconTest() {
  return <Star data-testid="icon" />;
}`;
    const result = transpile(source);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const Comp = evalComponent(result.code);
    const { getByTestId } = render(React.createElement(Comp));
    const el = getByTestId('icon');
    expect(el.textContent).not.toContain('Unknown');
  });
});
