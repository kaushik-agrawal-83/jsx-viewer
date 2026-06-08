# Phase 8 — Split View

## Status
> ✅ COMPLETE

## Goal
Side-by-side viewing of two JSX files: toggle split mode from toolbar, each pane has
its own independent tab strip, panes are separated by a draggable divider. Closing the
right pane merges its tabs into the left pane.

## Demo Checkpoint
- [ ] Click `⊟ Split` → viewer splits into two panes with divider at 50/50
- [ ] Each pane shows its own tab strip; drag file onto right pane → opens in right pane
- [ ] Drag divider left/right → pane sizes update
- [ ] Double-click divider → resets to 50/50
- [ ] Click `⊠` in right pane tab strip → right pane closes, its tabs migrate to left pane
- [ ] Entering split mode auto-collapses sidebar to icon rail
- [ ] Errors in one pane do NOT affect the other pane

---

## Tasks

### Hook — `usePanes`
- [ ] `frontend/src/hooks/usePanes.ts`:
  ```ts
  interface PanesState {
    mode: 'single' | 'split';
    leftRatio: number;   // 0.3–0.7, default 0.5
    focusedPane: 'left' | 'right';
  }
  ```
  - `enterSplit()` — sets `mode: 'split'`, collapses sidebar (`useSidebar.collapse()`)
  - `exitSplit()` — sets `mode: 'single'`, migrates right tabs to left (`useTabs.migrateTabs`)
  - `setRatio(n)` — clamps to 0.3–0.7, updates `leftRatio`
  - `resetRatio()` — sets to 0.5
  - `setFocused(pane)` — tracks which pane last had interaction
  - Persists `panes.mode` + `panes.leftRatio` to `localStorage`

### Component — `ViewerToolbar`
- [ ] `frontend/src/components/Viewer/ViewerToolbar.tsx`:
  - Left: nothing (or app name if titlebar not present)
  - Right: `[⊞ Single] [⊟ Split]` toggle buttons, active state = `primary` bg
  - Right: watch count badge (`n watching` in `accent` color) — count of tabs with `watching` status across all panes
  - Height: 40px, `neutral-100` background, `border-bottom: 1px solid neutral-200`

### Component — `PaneContainer`
- [ ] `frontend/src/components/Viewer/PaneContainer.tsx`:
  - Props: `mode`, `leftRatio`, `focusedPane`, and both panes' tab/content data
  - Single mode: renders one `Pane` at full width
  - Split mode: renders `[Pane left] [PaneDivider] [Pane right]` as flex row
  - Pane widths: `flex-basis: calc(${leftRatio * 100}% - 2px)` for left, remainder for right
  - `onPaneClick(pane)` → `setFocused(pane)` — click anywhere in pane focuses it

### Component — `PaneDivider`
- [ ] `frontend/src/components/Viewer/PaneDivider.tsx`:
  - 4px wide, full height, `cursor: col-resize`, `neutral-200` bg, hover `primary` bg
  - `onMouseDown` → `document.mousemove` → compute new ratio from mouse X position, call `setRatio`
  - `onMouseUp` → remove listeners
  - `onDblClick` → `resetRatio()`

### Component — `Pane`
- [ ] `frontend/src/components/Viewer/Pane.tsx`:
  - Props: `paneId: 'left' | 'right'`, `tabs`, `activeTabId`, `isFocused`, `showClosePane: boolean`, handlers
  - Renders `<TabStrip>` + `<Preview>` stacked vertically
  - `showClosePane`: shows `⊠` button in tab strip right edge (only for right pane in split mode)
  - `onClosePane` → `usePanes.exitSplit()`
  - Focused pane: `border: 2px solid primary-subtle` outline; unfocused: `border: 2px solid transparent`
  - Clicking inside pane → `setFocused(paneId)`

### Drop Target — Right Pane
- [ ] Viewer area (or right pane) accepts drag-drop when in split mode
- [ ] Dragging onto left pane → opens in left pane tabs
- [ ] Dragging onto right pane → opens in right pane tabs
- [ ] Visual: pane being dragged over highlights (dashed `primary` border)
- [ ] Whole viewer also highlights during drag (dim left pane slightly when hovering right)

### Sidebar Integration
- [ ] `FileList` clicking a file: if already open in any pane → focus that tab + pane; if not open → open in `focusedPane`
- [ ] `Sidebar.FileList` shows unique file list (de-dup across both panes — same file can be open in both)

### Wire into `App.tsx`
- [ ] Replace flat viewer area with `<ViewerToolbar>` + `<PaneContainer>`
- [ ] Pass `usePanes` state and `useTabs` state into `PaneContainer`
- [ ] `enterSplit` / `exitSplit` buttons in `ViewerToolbar`

---

## Testing Requirements (Vitest)

### Unit — `usePanes.test.ts`
- [ ] `enterSplit()` sets `mode: 'split'`
- [ ] `exitSplit()` sets `mode: 'single'`
- [ ] `setRatio(0.2)` clamped to 0.3
- [ ] `setRatio(0.8)` clamped to 0.7
- [ ] `resetRatio()` → 0.5
- [ ] Persistence: mode + ratio in localStorage

### Unit — `useTabs.migrateTabs.test.ts`
- [ ] Right pane tabs appended to left pane tabs array
- [ ] Right pane tabs cleared after migration
- [ ] `activeLeft` set to first migrated tab if left was empty

### Component — `PaneDivider.test.tsx`
- [ ] Renders with `col-resize` cursor
- [ ] `dblClick` → `resetRatio` called

### Component — `PaneContainer.test.tsx`
- [ ] Single mode: only one Pane rendered
- [ ] Split mode: two Panes + PaneDivider rendered
- [ ] Left pane width reflects `leftRatio`

### Manual Verification
- [ ] Error in right pane → left pane continues rendering normally
- [ ] Divider drag → smooth resize, no flicker
- [ ] Both panes independently show different files (file watching requires Phase 13)
- [ ] Close right pane → left pane has all tabs (none lost)

### Test Fixtures — Side-by-Side Pair

Save both files, open `split-left.jsx` in the left pane and `split-right.jsx` in the right pane.

**`split-left.jsx`** — bar chart:
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Q1', revenue: 42000 },
  { name: 'Q2', revenue: 68000 },
  { name: 'Q3', revenue: 55000 },
  { name: 'Q4', revenue: 91000 },
];

export default function LeftPane() {
  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h2 className="text-lg font-semibold mb-4">Quarterly Revenue — Left Pane</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: '#1e293b', borderRadius: 8 }} />
          <Bar dataKey="revenue" fill="#818cf8" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**`split-right.jsx`** — error state (verifies isolation):
```jsx
export default function RightPaneError() {
  throw new Error('Right pane crashed — left pane should still render');
}
```
**Expected:** Left pane shows bar chart. Right pane shows error card. Dragging divider resizes both independently.

---

## Done Gate
- [ ] All tests passing: `cd frontend && npm test`
- [ ] Zero TypeScript errors
- [ ] Single/Split toggle works
- [ ] Divider drag + double-click reset works
- [ ] Right pane close migrates tabs correctly
- [ ] Drop onto each pane opens in correct pane
- [ ] Sidebar auto-collapses on split entry
- [ ] Errors isolated per pane

## Dependencies
- **Requires complete:** Phase 7 — Tabs + Session Persistence
- **Enables:** Phase 9 — Sidebar Collapse + Polish

## Notes
- `focusedPane` determines where sidebar file-clicks and new drops land. Default `'left'`. Clicking inside a pane sets focus for that pane.
- The right pane has no initial file — it shows `EmptyPane` until a file is dropped or dragged there from the sidebar/left pane.
- Sidebar auto-collapse on split entry: call `useSidebar.collapse()` inside `usePanes.enterSplit()`. Track `autoCollapsed: boolean` in `usePanes` state so that exiting split can auto-expand IF the sidebar was auto-collapsed (not manually collapsed by user).
