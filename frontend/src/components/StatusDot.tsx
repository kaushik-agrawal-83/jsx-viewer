import React from 'react';

export type DotStatus = 'ok' | 'error' | 'loading' | 'watching' | 'recent';

const BASE: React.CSSProperties = {
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: 9999,
  flexShrink: 0,
};

export function StatusDot({ status }: { status: DotStatus }) {
  switch (status) {
    case 'ok':
      return (
        <span
          style={{ ...BASE, background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.40)' }}
        />
      );
    case 'error':
      return (
        <span
          style={{ ...BASE, background: '#f87171', boxShadow: '0 0 6px rgba(248,113,113,0.40)' }}
        />
      );
    case 'loading':
      return (
        <span
          style={{
            ...BASE,
            background: '#818cf8',
            boxShadow: '0 0 6px rgba(129,140,248,0.50)',
            animation: 'dot-pulse 0.8s ease-in-out infinite',
          }}
        />
      );
    case 'watching':
      return (
        <span
          style={{
            ...BASE,
            background: '#818cf8',
            boxShadow: '0 0 6px rgba(129,140,248,0.50)',
            animation: 'dot-pulse 2s ease-in-out infinite',
          }}
        />
      );
    case 'recent':
      return <span style={{ ...BASE, background: '#334155' }} />;
  }
}
