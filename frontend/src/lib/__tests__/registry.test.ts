/// <reference types="vitest/globals" />
import React from 'react';
import { resolve } from '../registry';

describe('registry', () => {
  it('resolve("react") returns object with createElement', () => {
    const mod = resolve('react') as typeof React;
    expect(typeof mod.createElement).toBe('function');
  });

  it('resolve("lucide-react") returns object with at least one icon', () => {
    const mod = resolve('lucide-react') as Record<string, unknown>;
    const icons = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('resolve("unknown-lib") returns object with default component', () => {
    const mod = resolve('unknown-lib') as Record<string, unknown>;
    expect(typeof mod.default).toBe('function');
  });

  it('resolve("@/components/ui/button") returns object with Button', () => {
    const mod = resolve('@/components/ui/button') as Record<string, unknown>;
    // Button is a forwardRef component (object with $$typeof) or plain function
    const B = mod.Button;
    expect(B != null && (typeof B === 'function' || typeof B === 'object')).toBe(true);
  });

  it('resolve("react/jsx-runtime") returns jsx function', () => {
    const mod = resolve('react/jsx-runtime') as Record<string, unknown>;
    expect(typeof mod.jsx).toBe('function');
  });
});
