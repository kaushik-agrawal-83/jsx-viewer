# Phase 6 — Preview + Error Display

## Status
> ✅ COMPLETE  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Goal
Isolated, robust preview rendering: a sandboxed div that mounts the transpiled component,
catches all errors (transpile + runtime), shows a styled error card, and injects Tailwind
CDN so artifact styles work without bleeding into viewer chrome.

## Demo Checkpoint
- [ ] Drag a `.jsx` file using Tailwind classes → renders with correct styles
- [ ] Drag a `.jsx` with `recharts` `<LineChart>` → chart renders
- [ ] Broken JSX → error card shows: error type, message, line/col if available
- [ ] Runtime error (e.g. `throw new Error('boom')` in render) → error card, other panes unaffected
- [ ] Fix the broken file content → re-render shows correctly (prep for Phase 8 watching)

---

## Tasks

### Component — `Preview`
- [ ] `frontend/src/components/Viewer/Preview.tsx`:
  - Props: `source: string | null`, `fileName: string`
  - Calls `transpile(source)` → if error, renders `<ErrorDisplay error={...} type="transpile" />`
  - If ok, calls `evalComponent(code)` → if throws, renders `<ErrorDisplay error={...} type="runtime" />`
  - Wraps render in `<ErrorBoundary>` to catch errors thrown during React render cycle
  - Renders `<Component />` inside a scrollable div with `overflow: auto`
  - **Tailwind CDN injection**: on mount, appends `<script src="https://cdn.tailwindcss.com">` to a contained `<style>` scope — see Notes for scoping strategy

### Tailwind Isolation Strategy
- [ ] Preview area wrapped in a div with `id="preview-root"` scoped reset
- [ ] Inject Tailwind CDN via `<script>` appended to `document.head` (once, idempotent check)
- [ ] Add `tailwind.config = { corePlugins: { preflight: false } }` inline config to prevent global CSS reset from breaking viewer chrome
- [ ] Viewer chrome uses explicit Tailwind classes only — no reliance on Tailwind's base reset

### Component — `ErrorBoundary`
- [ ] `frontend/src/components/Viewer/ErrorBoundary.tsx`:
  - React class component (required for `componentDidCatch`)
  - State: `{ hasError: boolean, error: Error | null }`
  - `componentDidCatch`: sets state
  - Renders `<ErrorDisplay>` when `hasError`, else renders `children`
  - Accepts `onError?: (err: Error) => void` callback (for updating tab status)
  - `resetErrorBoundary()` method — called when `source` prop changes (key prop on boundary)

### Component — `ErrorDisplay`
- [ ] `frontend/src/components/Viewer/ErrorDisplay.tsx`:
  - Props: `error: { message: string; line?: number; col?: number }`, `type: 'transpile' | 'runtime'`
  - Styled card: `error-subtle` bg, `error` border (2px), `border-radius: md`
  - Header: `✕ SyntaxError` or `✕ RuntimeError` in `error` color, `heading-md`
  - Body: error message in `mono` font, `body-sm` size
  - If `line` present: "Line {line}, Col {col}" in `secondary` color
  - Fix hint: "Fix the file and save to auto-reload" (greyed out for now — Phase 8 activates watching)

### Component — `EmptyPane`
- [ ] `frontend/src/components/Viewer/EmptyPane.tsx`:
  - Shown when no file is active in a pane
  - Centered: ↓ icon (Lucide `Download`) + "Drop a .jsx file to preview it"
  - Subtle style: `neutral-400` text, `body-md`

### Update `App.tsx` / Viewer area
- [ ] Replace raw render in Phase 5's viewer area with `<Preview source={activeFile?.source} fileName={activeFile?.fileName} />`
- [ ] Show `<EmptyPane />` when no active file

---

## Testing Requirements (Vitest + @testing-library/react)

### Unit — `ErrorDisplay.test.tsx`
- [ ] Renders "SyntaxError" for `type=transpile`
- [ ] Renders "RuntimeError" for `type=runtime`
- [ ] Shows line/col when provided
- [ ] Does not show line/col section when absent

### Unit — `ErrorBoundary.test.tsx`
- [ ] Child that throws → ErrorDisplay shown, not crash
- [ ] Child that does NOT throw → children rendered normally
- [ ] Key change (new source) → error cleared, child re-attempted

### Integration — `Preview.test.tsx`
- [ ] Valid JSX source → component renders in DOM
- [ ] Invalid JSX source → `ErrorDisplay` appears, `type=transpile`
- [ ] Source with runtime throw → `ErrorDisplay` appears, `type=runtime`
- [ ] `null` source → `EmptyPane` renders

### Manual Verification
- [ ] Tailwind CDN injected once (verify: inspect `document.head` — one `<script cdn.tailwindcss.com>`)
- [ ] Tailwind classes inside preview work (e.g., `className="bg-blue-500"`)
- [ ] Viewer chrome NOT affected by preview's Tailwind styles
- [ ] `recharts` `<LineChart>` renders with axes visible

### Test Fixtures

**Tailwind isolation test** — drop or paste this to verify Tailwind classes work in preview but don't bleed:
```jsx
export default function TailwindCheck() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h1 className="text-2xl font-bold text-white mb-2">Tailwind Working ✓</h1>
          <p className="text-slate-300 text-sm">
            If you see this card with gradient background and blur, Tailwind CDN is active inside the preview.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="px-3 py-1 bg-indigo-500 text-white text-xs rounded-full font-medium">indigo</span>
            <span className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full font-medium">purple</span>
            <span className="px-3 py-1 bg-pink-500 text-white text-xs rounded-full font-medium">pink</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```
**Expected:** Gradient background, glass card, colored badges — viewer chrome stays dark glass, unaffected.

**recharts LineChart test:**
```jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const data = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  revenue: Math.round(20000 + Math.random() * 30000),
  users: Math.round(500 + Math.random() * 1500),
}));

export default function LineChartDemo() {
  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h2 className="text-xl font-semibold mb-6">Monthly Metrics</h2>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
          <Line type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="users"   stroke="#4ade80" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```
**Expected:** Two lines (indigo + green) on dark chart. Uses recharts from registry.

**Runtime error test** — verify ErrorBoundary catches without crashing the page:
```jsx
export default function RuntimeBomb() {
  const data = null;
  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <h1>Will crash on render</h1>
      <p>{data.missingProperty}</p>
    </div>
  );
}
```
**Expected:** Error card with "RuntimeError" and null-access message. No full page crash.

---

## Done Gate
- [ ] All tests passing: `cd frontend && npm test`
- [ ] Zero TypeScript errors
- [ ] Tailwind works inside preview, does not bleed to chrome
- [ ] Transpile errors show error card with message + line
- [ ] Runtime errors show error card without crashing the app
- [ ] `recharts` + `lucide-react` render correctly in preview

## Dependencies
- **Requires complete:** Phase 4 — Transpile Pipeline
- **Can run parallel with:** Phase 5 — Sidebar + Drag-Drop
- **Enables:** Phase 7 — Tabs + Session Persistence

## Notes
- Use `key={source}` on `<ErrorBoundary>` so React unmounts + remounts when source changes, clearing the previous error state.
- Tailwind CDN in the preview means the component's Tailwind config (custom colors) is NOT available — only default Tailwind palette. Artifact components generated by Claude use only default palette, so this is acceptable for v1.
- Do not use `<iframe>` in this phase. Simple React subtree is sufficient. If Tailwind bleed becomes a real problem in Phase 9+, revisit per DESIGN.md §15 open question.
