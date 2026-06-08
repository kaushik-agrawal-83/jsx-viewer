import React from 'react';
import { resolve } from './registry';

export class RuntimeError extends Error {
  readonly originalStack: string | undefined;
  constructor(message: string, originalStack?: string) {
    super(message);
    this.name = 'RuntimeError';
    this.originalStack = originalStack;
  }
}

export function evalComponent(code: string): React.ComponentType {
  const moduleObj = { exports: {} as Record<string, unknown> };
  try {
    const fn = new Function('require', 'module', 'exports', 'React', code);
    // React injected as global so bare React.useState() works without an import
    fn(resolve, moduleObj, moduleObj.exports, React);
  } catch (err: unknown) {
    const e = err as Error;
    throw new RuntimeError(e.message, e.stack);
  }

  const component = moduleObj.exports.default;
  if (typeof component !== 'function') {
    throw new RuntimeError('No default export found');
  }
  return component as React.ComponentType;
}
