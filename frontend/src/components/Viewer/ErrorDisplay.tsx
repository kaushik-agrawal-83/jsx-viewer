import React from 'react';

export interface ErrorInfo {
  message: string;
  line?: number;
  col?: number;
}

interface Props {
  error: ErrorInfo;
  type: 'transpile' | 'runtime';
}

export function ErrorDisplay({ error, type }: Props) {
  const label = type === 'transpile' ? 'SyntaxError' : 'RuntimeError';
  const location =
    error.line != null
      ? `Line ${error.line}${error.col != null ? `:${error.col}` : ''}`
      : null;

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'rgba(248,113,113,0.10)',
        border: '2px solid #f87171',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold" style={{ color: '#f87171' }}>
          ✕ {label}
        </span>
        {location && (
          <span className="text-xs font-mono" style={{ color: '#475569' }}>
            {location}
          </span>
        )}
      </div>
      <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed" style={{ color: '#a5b4fc' }}>
        {error.message}
      </pre>
      <p className="mt-3 text-xs" style={{ color: '#334155' }}>
        Fix the file and save to auto-reload
      </p>
    </div>
  );
}
