import React, { useEffect, useRef, useMemo } from 'react';
import { transpile } from '../../lib/transpiler';
import { evalComponent } from '../../lib/renderer';
import { ErrorDisplay } from './ErrorDisplay';
import { ErrorBoundary } from './ErrorBoundary';
import { EmptyPane } from './EmptyPane';
import type { ErrorInfo } from './ErrorDisplay';

type PreviewResult =
  | { kind: 'empty' }
  | { kind: 'transpile-error'; error: ErrorInfo }
  | { kind: 'eval-error'; error: ErrorInfo }
  | { kind: 'ok'; Component: React.ComponentType };

interface Props {
  source: string | null;
  fileName: string;
  onStatusChange?: (status: 'ok' | 'error', error?: ErrorInfo) => void;
}

function injectTailwindCDN() {
  if (document.querySelector('script[src*="cdn.tailwindcss.com"]')) return;
  // Config must run after CDN loads; guard against undefined in test envs
  const config = document.createElement('script');
  config.textContent =
    'if(typeof tailwind!=="undefined"){tailwind.config={corePlugins:{preflight:false}}}';
  document.head.appendChild(config);
  const script = document.createElement('script');
  script.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(script);
}

export function Preview({ source, fileName: _fileName, onStatusChange }: Props) {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    injectTailwindCDN();
  }, []);

  const result = useMemo((): PreviewResult => {
    if (!source) return { kind: 'empty' };
    const tr = transpile(source);
    if (!tr.ok) return { kind: 'transpile-error', error: tr.error };
    try {
      const Component = evalComponent(tr.code);
      return { kind: 'ok', Component };
    } catch (err: unknown) {
      return { kind: 'eval-error', error: { message: (err as Error).message } };
    }
  }, [source]);

  useEffect(() => {
    if (result.kind === 'empty') return;
    if (result.kind === 'ok') onStatusChange?.('ok');
    else if (result.kind === 'transpile-error') onStatusChange?.('error', result.error);
    else if (result.kind === 'eval-error') onStatusChange?.('error', result.error);
  }, [result, onStatusChange]);

  if (result.kind === 'empty') return <EmptyPane />;

  if (result.kind === 'transpile-error') {
    return (
      <div className="p-4">
        <ErrorDisplay type="transpile" error={result.error} />
      </div>
    );
  }

  if (result.kind === 'eval-error') {
    return (
      <div className="p-4">
        <ErrorDisplay type="runtime" error={result.error} />
      </div>
    );
  }

  const { Component } = result;
  return (
    <div id="preview-root" className="overflow-auto h-full">
      <ErrorBoundary
        key={source}
        onError={err => onStatusChange?.('error', { message: err.message })}
      >
        <Component />
      </ErrorBoundary>
    </div>
  );
}
