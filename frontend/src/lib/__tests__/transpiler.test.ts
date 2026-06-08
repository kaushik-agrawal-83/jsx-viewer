/// <reference types="vitest/globals" />
import { transpile } from '../transpiler';

describe('transpiler', () => {
  it('valid JSX returns ok:true with non-empty code', () => {
    const result = transpile('<div>Hello</div>');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.code.length).toBeGreaterThan(0);
  });

  it('converts import to require() in output', () => {
    const result = transpile(`import { useState } from 'react';
export default function Foo() { return <div />; }`);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.code).toContain('require(');
  });

  it('invalid JSX returns ok:false with message and line', () => {
    const result = transpile(`export default function Broken() {
  return (
    <div className="p-4">
      <h1>Missing closing tag
    </div>
  );
}`);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBeTruthy();
      expect(result.error.line).toBeDefined();
    }
  });

  it('self-closing component transpiles without error', () => {
    const result = transpile(`export default function Foo() { return <input />; }`);
    expect(result.ok).toBe(true);
  });
});
