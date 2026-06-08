import React, { useState, useCallback } from 'react';
import { transpile } from '../lib/transpiler';
import { evalComponent } from '../lib/renderer';
import { ErrorDisplay } from './Viewer/ErrorDisplay';
import type { ErrorInfo } from './Viewer/ErrorDisplay';
import { RuntimeError } from '../lib/renderer';

type SandboxError = { type: 'transpile' | 'runtime' } & ErrorInfo;

const PLACEHOLDER = `import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="p-8 flex flex-col items-center gap-4 bg-slate-900 min-h-screen">
      <h1 className="text-4xl font-bold text-white">Count: {count}</h1>
      <div className="flex gap-3">
        <button
          onClick={() => setCount(c => c - 1)}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
        >−</button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
        >+</button>
      </div>
      <p className="text-slate-400 text-sm">Click to increment or decrement</p>
    </div>
  );
}`;

class RenderErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (e: Error) => void },
  { caught: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (e: Error) => void }) {
    super(props);
    this.state = { caught: false };
  }
  static getDerivedStateFromError() {
    return { caught: true };
  }
  componentDidCatch(err: Error) {
    this.props.onError(err);
  }
  render() {
    if (this.state.caught) return null;
    return this.props.children;
  }
}

export function DevSandbox() {
  const [source, setSource] = useState(PLACEHOLDER);
  const [error, setError] = useState<SandboxError | null>(null);
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  const run = useCallback(() => {
    setError(null);
    setComponent(null);

    const result = transpile(source);
    if (!result.ok) {
      setError({ type: 'transpile', ...result.error });
      return;
    }

    try {
      const comp = evalComponent(result.code);
      setComponent(() => comp);
      setRenderKey(k => k + 1);
    } catch (err: unknown) {
      const e = err as Error;
      setError({ type: 'runtime', message: e.message });
    }
  }, [source]);

  const handleRuntimeError = useCallback((err: Error) => {
    const msg = err instanceof RuntimeError ? err.message : err.message;
    setError({ type: 'runtime', message: msg });
    setComponent(null);
  }, []);

  return (
    <div className="flex h-full">
      {/* Left: editor */}
      <div
        className="w-[380px] shrink-0 flex flex-col border-r"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Dev Sandbox
          </span>
          <button
            onClick={run}
            className="px-3 py-1 rounded-md text-xs font-semibold transition-colors"
            style={{
              background: '#818cf8',
              color: '#fff',
            }}
            onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.background = '#6366f1')}
            onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.background = '#818cf8')}
          >
            ▶ Render
          </button>
        </div>
        <textarea
          value={source}
          onChange={e => setSource(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent text-text-primary text-xs font-mono p-4 focus:outline-none"
          style={{ lineHeight: 1.7 }}
          placeholder="Paste JSX here…"
        />
      </div>

      {/* Right: preview */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface">
        <div
          className="flex items-center px-4 py-2 border-b shrink-0"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Preview
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {error && (
            <div className="p-4">
              <ErrorDisplay error={error} type={error.type} />
            </div>
          )}
          {Component && !error && (
            <RenderErrorBoundary key={renderKey} onError={handleRuntimeError}>
              <Component />
            </RenderErrorBoundary>
          )}
          {!Component && !error && (
            <div className="flex items-center justify-center h-full text-text-muted text-sm">
              Click ▶ Render to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
