import React from 'react';
import * as ReactDOM from 'react-dom';
import * as LucideReact from 'lucide-react';
import * as Recharts from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { shadcnStubs } from './shadcn-stubs';

function cn(...args: Parameters<typeof clsx>): string {
  return twMerge(clsx(args));
}

function makeUnknownPlaceholder(specifier: string): React.ComponentType {
  return function UnknownLib() {
    return React.createElement(
      'div',
      {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          border: '2px dashed #475569',
          borderRadius: 8,
          padding: '8px 14px',
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 12,
          gap: 6,
        },
      },
      '⚠ Unknown: ',
      React.createElement('code', null, specifier),
    );
  };
}

const REGISTRY: Record<string, unknown> = {
  react: React,
  'react-dom': ReactDOM,
  'react/jsx-runtime': { jsx, jsxs, Fragment },
  'react/jsx-dev-runtime': { jsxDEV: jsx, jsxs, Fragment },
  'lucide-react': LucideReact,
  recharts: Recharts,
  clsx: { clsx, default: clsx },
  'tailwind-merge': { twMerge, default: twMerge, merge: twMerge },
  'class-variance-authority': { cva, default: cva },
  '@radix-ui/react-slot': { Slot },
  '@/lib/utils': { cn, default: cn },
  '@/lib/cn': { cn, default: cn },
};

export function resolve(specifier: string): unknown {
  if (specifier in REGISTRY) return REGISTRY[specifier];

  if (specifier.startsWith('@/components/ui/')) {
    const name = specifier.split('/').pop() ?? '';
    const stubs = shadcnStubs[name];
    if (stubs) return stubs;
  }

  return { default: makeUnknownPlaceholder(specifier) };
}
