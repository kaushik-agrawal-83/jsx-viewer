/// <reference types="vitest/globals" />
import { transpile } from '../transpiler';
import { evalComponent, RuntimeError } from '../renderer';

const validCode = (source: string): string => {
  const r = transpile(source);
  if (!r.ok) throw new Error(r.error.message);
  return r.code;
};

describe('renderer', () => {
  it('valid transpiled code returns a component function', () => {
    const code = validCode(`export default function Foo() { return null; }`);
    const comp = evalComponent(code);
    expect(typeof comp).toBe('function');
  });

  it('invalid code (throws in body) throws RuntimeError', () => {
    const code = `(function(require, module, exports) {
      const obj = null;
      obj.boom;
    })`;
    expect(() => evalComponent(code)).toThrow(RuntimeError);
  });

  it('missing default export throws RuntimeError', () => {
    const code = validCode(`export function Foo() { return null; }`);
    expect(() => evalComponent(code)).toThrow(RuntimeError);
  });
});
