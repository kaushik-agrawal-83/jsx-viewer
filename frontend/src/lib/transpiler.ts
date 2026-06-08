import Babel from '@babel/standalone';

export type TranspileError = {
  message: string;
  line?: number;
  col?: number;
};

export type TranspileResult =
  | { ok: true; code: string }
  | { ok: false; error: TranspileError };

export function transpile(source: string): TranspileResult {
  try {
    const result = Babel.transform(source, {
      presets: [['react', { runtime: 'automatic' }]],
      plugins: ['transform-modules-commonjs'],
      filename: 'component.jsx',
    });
    return { ok: true, code: result?.code ?? '' };
  } catch (err: unknown) {
    const babelErr = err as {
      message: string;
      loc?: { line?: number; column?: number };
    };
    return {
      ok: false,
      error: {
        message: babelErr.message,
        line: babelErr.loc?.line,
        col: babelErr.loc?.column,
      },
    };
  }
}
