# Phase 4 — Transpile Pipeline

## Status
> 🔲 NOT_STARTED  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Goal
In-browser JSX transpilation pipeline: paste or load JSX source → Babel transpiles →
component evaluates → renders in a div. Also establishes the I/O adapter abstraction
so file reading/watching can be swapped from Node.js (web) to Tauri (Phase 11) without
touching UI components.

## Demo Checkpoint
At `http://localhost:5173`, a temporary test UI:
- [ ] Paste JSX into a textarea → click "Render" → component appears in preview div
- [ ] Paste invalid JSX → error card shows message + line number
- [ ] Import `lucide-react` icon in JSX → renders (not placeholder)
- [ ] Import unknown lib → renders `Unknown: some-lib` placeholder box

## Test Fixtures

Paste each snippet into the DevSandbox textarea to verify the pipeline.

### Fixture A — Basic React + Tailwind + useState
```jsx
export default function Counter() {
  const [count, setCount] = React.useState(0);
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
}
```
**Expected:** Dark bg, counter heading, two buttons, interactive.

### Fixture B — lucide-react + recharts (tests registry)
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

const data = [
  { day: 'Mon', value: 42 },
  { day: 'Tue', value: 67 },
  { day: 'Wed', value: 55 },
  { day: 'Thu', value: 80 },
  { day: 'Fri', value: 71 },
  { day: 'Sat', value: 38 },
  { day: 'Sun', value: 29 },
];

export default function WeeklyChart() {
  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="text-indigo-400 w-5 h-5" />
        <h2 className="text-xl font-semibold">Weekly Activity</h2>
        <Activity className="text-green-400 w-4 h-4 ml-auto" />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          />
          <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```
**Expected:** Dark chart with indigo bars, lucide icons in header, tooltip on hover.

### Fixture C — Unknown import (tests placeholder)
```jsx
import SomeLib from 'some-unknown-package';
import { helper } from 'another-missing-lib';

export default function UnknownTest() {
  return (
    <div className="p-8 bg-slate-900 min-h-screen flex flex-col gap-4">
      <h2 className="text-white text-xl font-bold">Unknown Import Test</h2>
      <SomeLib />
      <helper.Foo />
    </div>
  );
}
```
**Expected:** Two dashed-border placeholder boxes labeled "Unknown: some-unknown-package" and "Unknown: another-missing-lib". No crash.

### Fixture D — Intentionally broken (tests error display)
```jsx
export default function Broken() {
  return (
    <div className="p-4">
      <h1>Missing closing tag
      <p>This JSX is malformed</p>
    </div>
  );
}
```
**Expected:** Error card with "SyntaxError", message text, and a line number. No crash.

### Fixture E — Runtime error (tests ErrorBoundary)
```jsx
export default function RuntimeBomb() {
  const obj = null;
  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <h1>About to throw...</h1>
      <p>{obj.nonExistent}</p>
    </div>
  );
}
```
**Expected:** Error card with "RuntimeError" and "Cannot read properties of null". Other panes (if any) unaffected.

---

## Tasks

### I/O Adapter Interface (critical abstraction)
- [ ] `frontend/src/lib/io-adapter.ts` — define the interface:
  ```ts
  export interface IOAdapter {
    readFile(path: string): Promise<string>;
    watchFile(path: string, onChange: () => void): Promise<() => void>; // returns unwatch fn
    unwatchFile(path: string): Promise<void>;
  }
  ```
- [ ] `frontend/src/lib/web-adapter.ts` — WebIOAdapter implementing IOAdapter:
  - `readFile`: `POST /api/files/read` with `{ path }` → returns file content string
  - `watchFile`: connects WebSocket to backend, registers path, calls `onChange` on message
  - `unwatchFile`: sends unwatch message to WebSocket
- [ ] `frontend/src/lib/adapter-context.tsx` — React context providing active `IOAdapter` instance
- [ ] `frontend/src/main.tsx` — wrap app in `<AdapterProvider adapter={new WebIOAdapter()} />`

> **Why this abstraction:** Phase 11 (Tauri) swaps `WebIOAdapter` for `TauriIOAdapter`
> without touching any component code. All file I/O goes through this single seam.

### Transpiler
- [ ] Add `@babel/standalone` to `frontend/package.json` deps
- [ ] `frontend/src/lib/transpiler.ts`:
  ```ts
  export type TranspileResult =
    | { ok: true; code: string }
    | { ok: false; error: TranspileError };

  export interface TranspileError {
    message: string;
    line?: number;
    col?: number;
  }

  export function transpile(source: string): TranspileResult
  ```
  - Uses `Babel.transform` with preset `react` + custom `esmToCommonJS` plugin
  - `esmToCommonJS` plugin: converts `import X from 'Y'` → `const X = require('Y')`
  - Catches Babel parse/transform errors, extracts `.loc.line` / `.loc.column`

### Registry
- [ ] `frontend/src/lib/registry.ts` — install packages and build import map:
  - Add to `frontend/package.json` deps: `lucide-react`, `recharts`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`
  - Export `resolve(specifier: string): unknown` function
  - Map:
    - `react` → `React` (the React module)
    - `react-dom` → `ReactDOM`
    - `lucide-react` → all named exports from `lucide-react`
    - `recharts` → all named exports from `recharts`
    - `clsx` → `clsx`
    - `tailwind-merge` → `tailwindMerge`
    - `class-variance-authority` → `cva`
    - `@radix-ui/react-slot` → `{ Slot }`
    - `@/components/ui/*` → shadcn stubs (see below)
    - `@/lib/utils`, `@/lib/cn` → `{ cn }` from `clsx` + `tailwind-merge`
    - Unknown → `{ default: UnknownLibPlaceholder(specifier) }` component

### shadcn/ui Stubs
- [ ] `frontend/src/lib/shadcn-stubs.tsx` — hand-rolled stub components:
  - `Button`, `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`
  - `Badge`, `Input`, `Label`, `Textarea`, `Select`
  - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
  - Each stub: renders a semantically correct HTML element with Phase 0 Tailwind classes
  - All accept standard HTML props + `className` override

### Renderer
- [ ] `frontend/src/lib/renderer.ts`:
  ```ts
  export function evalComponent(code: string): React.ComponentType
  ```
  - Creates `module = { exports: {} }`, `req = registry.resolve`
  - `new Function('require', 'module', 'exports', code)(req, module, module.exports)`
  - Returns `module.exports.default`
  - Wraps in try/catch → throws `RuntimeError { message, stack }`

### Temporary Test UI (removed in Phase 5)
- [ ] `frontend/src/components/DevSandbox.tsx` — visible only in dev:
  - Textarea for JSX input, "Render" button
  - Calls `transpile()` → if ok, calls `evalComponent()` → renders `<Component />`
  - Shows `ErrorDisplay` on transpile or runtime error
- [ ] Wire into `App.tsx` behind `import.meta.env.DEV` guard

---

## Testing Requirements (Vitest)

### Unit Tests — `frontend/src/lib/__tests__/transpiler.test.ts`
- [ ] Valid JSX → `{ ok: true, code: string }` where code is non-empty
- [ ] `import` statement converted to `require()` in output code
- [ ] Invalid JSX (missing closing tag) → `{ ok: false, error: { message, line } }`
- [ ] Self-closing component renders correctly

### Unit Tests — `frontend/src/lib/__tests__/registry.test.ts`
- [ ] `resolve('react')` returns object with `createElement`
- [ ] `resolve('lucide-react')` returns object with at least one icon function
- [ ] `resolve('unknown-lib')` returns object with `default` being a React component
- [ ] `resolve('@/components/ui/button')` returns object with `Button` component

### Unit Tests — `frontend/src/lib/__tests__/renderer.test.ts`
- [ ] Valid transpiled code → returns a React component (function or class)
- [ ] `evalComponent` output renders without error when mounted in test
- [ ] Invalid code (throws in body) → throws `RuntimeError`

### Integration Test — `frontend/src/lib/__tests__/pipeline.test.ts`
- [ ] Full pipeline: JSX string → `transpile` → `evalComponent` → render → DOM has content
- [ ] JSX using `lucide-react` → renders without Unknown placeholder

---

## Done Gate
- [ ] All unit + integration tests passing: `cd frontend && npm test`
- [ ] Zero TypeScript errors: `cd frontend && npx tsc --noEmit`
- [ ] DevSandbox demo: paste JSX → renders
- [ ] DevSandbox demo: invalid JSX → error card with line number
- [ ] `lucide-react` icon renders in sandbox
- [ ] Unknown import shows placeholder div, does not crash

## Dependencies
- **Requires complete:** Phase 3 — Release Management
- **Enables:** Phase 5 (Sidebar), Phase 6 (Preview) — these can run in parallel

## Notes
- `@babel/standalone` is ~800KB. Load it via the frontend bundle (not CDN) for offline use.
- The `esmToCommonJS` Babel plugin must handle: default imports, named imports, namespace imports (`import * as`), and re-exports. Reference HN-Tran/jsx-viewer for a working implementation.
- The I/O adapter interface (`io-adapter.ts`) is the seam for Phase 11 migration. Do NOT implement file reads inline in components.
- Tailwind CDN injection into preview div is deferred to Phase 6 (Preview component).
