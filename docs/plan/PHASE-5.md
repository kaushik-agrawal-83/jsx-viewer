# Phase 5 — Sidebar + Drag-Drop

## Status
> ✅ COMPLETE  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Goal
Full sidebar UI with file list (Open + Recent sections), drag-drop zone accepting `.jsx`
files from the OS, and a basic single-pane viewer that renders the dropped file using
the Phase 4 pipeline. File watching is NOT in this phase — that's Phase 8.

## Demo Checkpoint
- [ ] Drag a `.jsx` file from Finder onto the sidebar → file name appears in "Open" section with loading dot → file renders in viewer pane
- [ ] Drag second `.jsx` → appears in Open list
- [ ] Open section dot turns green on success, red on transpile error
- [ ] Sidebar resize handle draggable between 140px and 320px

---

## Tasks

### Hook — `useSidebar`
- [ ] `frontend/src/hooks/useSidebar.ts`:
  ```ts
  interface SidebarState {
    width: number;        // 140–320, default 200
    collapsed: boolean;   // default false
    hidden: boolean;      // only via ⌘B
  }
  ```
  - Persists `sidebar.width` and `sidebar.collapsed` to `localStorage`
  - Exposes: `setWidth(n)`, `collapse()`, `expand()`, `toggle()`, `hide()`, `show()`

### Hook — `useOpenFiles`
- [ ] `frontend/src/hooks/useOpenFiles.ts`:
  ```ts
  interface OpenFile {
    path: string;          // unique key; for drag-drop, use filename as key
    fileName: string;
    source: string;        // raw JSX content
    status: 'loading' | 'ok' | 'error';
    error?: TranspileError | RuntimeError;
  }
  ```
  - `openFromDrop(file: File): void` — reads via `FileReader.readAsText`, adds to state
  - `close(path: string): void`
  - Recent list: last 10 closed files (path + fileName, no source)
  - Persists open file paths to `localStorage` (source re-read on reload via IOAdapter)

### Component — `DropZone`
- [ ] `frontend/src/components/Sidebar/DropZone.tsx`:
  - 80px tall, dashed border (`neutral-200`), "↓ Drop .jsx here" text in `body-sm`
  - `onDragOver`: highlight (dashed `primary` border, `primary-subtle` bg), show filename from `event.dataTransfer.items`
  - `onDrop`: extract `File` objects, filter `.jsx` extension, call `openFromDrop` for each
  - `onDragLeave`: reset highlight
  - Also render a clickable "Browse…" link → `<input type="file" accept=".jsx,.tsx" multiple />`
  - **Whole sidebar also accepts drops** — dragover on sidebar body triggers same highlight

### Component — `FileList`
- [ ] `frontend/src/components/Sidebar/FileList.tsx`:
  - Section "Open" → maps `openFiles` to `FileListItem`
  - Section "Recent" → maps recent to `FileListItem` (grey dot, click re-opens)
  - Sections only shown if they have entries
  - Section header: `heading-lg` text in `secondary` color, 8px margin

### Component — `FileListItem`
- [ ] `frontend/src/components/Sidebar/FileListItem.tsx`:
  - Props: `fileName`, `status`, `isActive`, `onSelect`, `onClose`
  - Left: `StatusDot` component (8px, color from status)
  - Middle: `fileName` truncated with `text-ellipsis`
  - Right: `×` close button (visible on hover)
  - Active: `primary-subtle` background
  - Error: `error` dot, `text-red-600` filename

### Component — `StatusDot`
- [ ] `frontend/src/components/StatusDot.tsx`:
  - Props: `status: 'ok' | 'error' | 'loading' | 'watching' | 'recent'`
  - 8px circle, colors from Phase 0 dot spec
  - `watching`: CSS keyframe `pulse` animation

### Component — `Sidebar`
- [ ] `frontend/src/components/Sidebar/Sidebar.tsx`:
  - Props: `state: SidebarState`, `openFiles`, `recentFiles`, `onSelect`, `onClose`, `onDrop`
  - Width applied via inline style: `width: state.collapsed ? 44 : state.width`
  - `transition: width 0.2s cubic-bezier(.4,0,.2,1)`
  - In expanded mode: shows `FileList` + `DropZone`
  - In collapsed mode: shows dot rail (dots only, hover tooltip with filename)
  - `SidebarHandle` on right edge

### Component — `SidebarHandle`
- [ ] `frontend/src/components/Sidebar/SidebarHandle.tsx`:
  - 3px wide, full height, `cursor: col-resize`
  - `onMouseDown` → `document.mousemove` → update `sidebar.width` via `setWidth`
  - `onMouseUp` → remove listeners

### Layout — `App.tsx`
- [ ] Refactor `App.tsx` to flex row: `<Sidebar> | <ViewerArea>`
- [ ] `ViewerArea`: for now, single pane — renders active file from `openFiles`
- [ ] Wire `onDrop` from sidebar + `openFromDrop` → `useOpenFiles`
- [ ] Remove `DevSandbox` from Phase 4 (or keep behind DEV flag — move into sidebar footer)

---

## Testing Requirements (Vitest + @testing-library/react)

### Unit — `useSidebar.test.ts`
- [ ] Default width = 200
- [ ] `collapse()` sets `collapsed: true`; `expand()` reverses
- [ ] Width clamped to 140–320
- [ ] Values persisted to and restored from `localStorage`

### Unit — `useOpenFiles.test.ts`
- [ ] `openFromDrop` adds file to state with `status: 'loading'` then `'ok'`
- [ ] `close()` moves file to recent list
- [ ] Recent list capped at 10 entries

### Component — `DropZone.test.tsx`
- [ ] Renders "Drop .jsx here" text
- [ ] `onDragOver` with `.jsx` file → adds highlight class
- [ ] `onDrop` with non-jsx file → `openFromDrop` NOT called

### Component — `FileListItem.test.tsx`
- [ ] Renders `fileName`
- [ ] `status=error` → dot has error color class
- [ ] `×` click calls `onClose`
- [ ] Hover reveals `×` button

### Manual Verification
- [ ] Drag real `.jsx` file → renders in viewer
- [ ] Drag `.txt` file → silently ignored (no error)
- [ ] Sidebar resize handle drag → width changes smoothly
- [ ] Width persists after page reload

### Test Fixtures — Files to drag-drop

Save each as a `.jsx` file on disk, then drag into the sidebar.

**`kpi-cards.jsx`** — tests Tailwind + basic layout:
```jsx
export default function KpiCards() {
  const stats = [
    { label: 'Revenue', value: '$48,295', delta: '+12%', color: 'text-green-400' },
    { label: 'Users',   value: '3,847',   delta: '+8%',  color: 'text-blue-400'  },
    { label: 'Churn',   value: '2.4%',    delta: '-0.3%',color: 'text-red-400'   },
    { label: 'MRR',     value: '$12,100', delta: '+5%',  color: 'text-purple-400'},
  ];
  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">{s.label}</p>
            <p className="text-white text-2xl font-bold">{s.value}</p>
            <p className={`text-sm font-medium mt-1 ${s.color}`}>{s.delta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**`broken-syntax.jsx`** — tests error state + red dot in sidebar:
```jsx
export default function Oops() {
  return (
    <div>
      <h1>This is broken
      <p>Unclosed h1 tag above</p>
    </div>
  )
}
```

---

## Done Gate
- [ ] All tests passing: `cd frontend && npm test`
- [ ] Zero TypeScript errors
- [ ] Drag `.jsx` from Finder → renders in viewer pane
- [ ] Open + Recent sections populate correctly
- [ ] Status dots show correct colors
- [ ] Sidebar resize between 140–320px works and persists
- [ ] Phase 0 colors applied throughout (no hardcoded color values)

## Dependencies
- **Requires complete:** Phase 4 — Transpile Pipeline
- **Can run parallel with:** Phase 6 — Preview + Error Display
- **Enables:** Phase 7 — Tabs + Session Persistence

## Notes
- In this phase, file paths from drag-drop in the browser are filenames only (not full OS paths). Full path resolution requires Tauri (Phase 11) or the File System Access API. Use filename as the unique key in `useOpenFiles`.
- The `IOAdapter.readFile` is NOT used in this phase for drag-drop (FileReader API used directly). It will be used in Phase 8 for watcher-triggered re-reads and in Phase 7 for session restore.
- Whole-sidebar drop: add `onDragOver` / `onDrop` to the `Sidebar` wrapper div, not just `DropZone`.
