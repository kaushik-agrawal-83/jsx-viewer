# Phase 7 — Tabs + Session Persistence

## Status
> ✅ COMPLETE  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Goal
Full tab management for the viewer pane: open files appear as tabs, tabs can be switched
and closed, and the session (open tabs + active tab) is restored on page reload.

## Demo Checkpoint
- [ ] Drop 3 `.jsx` files → 3 tabs appear in tab strip
- [ ] Click tab → preview switches to that file
- [ ] Click `×` on tab → tab closes, adjacent tab becomes active
- [ ] Reload page → tabs restored, active tab renders again
- [ ] Tab dot reflects file status (pulse = ok/watching, red = error)

---

## Tasks

### Hook — `useTabs`
- [ ] `frontend/src/hooks/useTabs.ts`:
  ```ts
  interface Tab {
    id: string;           // uuid
    path: string;         // filename key (Phase 5 note — full path in Phase 11)
    fileName: string;
    paneId: 'left' | 'right';
    status: 'ok' | 'error' | 'loading' | 'missing';
    error?: TranspileError | RuntimeError;
    source?: string;      // cached source content
  }

  interface TabsState {
    left: Tab[];
    right: Tab[];
    activeLeft: string | null;   // tab id
    activeRight: string | null;
  }
  ```
  - `openTab(paneId, path, fileName, source)` — adds tab if not already open; if already open, focuses it
  - `closeTab(tabId)` — removes tab, selects adjacent tab in same pane
  - `setActive(paneId, tabId)` — sets `activeLeft` or `activeRight`
  - `updateTabStatus(tabId, status, error?)` — called by Preview after transpile/render
  - `updateTabSource(tabId, source)` — called by file watcher on change (Phase 8)
  - `migrateTabs(from: 'right', to: 'left')` — used by split-close in Phase 9
  - Persists to `localStorage` keys: `tabs.left` (array of paths), `tabs.right`, `tabs.activeLeft`, `tabs.activeRight`

### Session Restore
- [ ] On mount, `useTabs` reads `localStorage` and reconstructs tabs with `status: 'loading'`
- [ ] For each restored tab path, calls `IOAdapter.readFile(path)` — on web, `POST /api/files/read`
- [ ] On success: `updateTabSource` + `updateTabStatus('ok')`
- [ ] On failure (file not found / path inaccessible): `updateTabStatus('missing')`
- [ ] `missing` status: tab shows grey dot, preview shows `<MissingFile>` component

### Backend — File Read Endpoint
- [ ] `backend/src/routes/files.ts`:
  - `POST /api/files/read` — body: `{ path: string }` → reads file, returns `{ content: string }`
  - `400` if `path` is missing
  - `404` if file not found
  - `403` if path traverses outside allowed directory (path sanitization required)
- [ ] Mount at `backend/src/index.ts`: `app.use('/api/files', filesRouter)`

> **Security:** Validate that `path` is an absolute path and does not contain `..` sequences.
> The web server should only read files the user explicitly opened — log each read.

### Component — `MissingFile`
- [ ] `frontend/src/components/Viewer/MissingFile.tsx`:
  - "File not found — drop it here again" message
  - Lucide `FileX` icon
  - `neutral-400` text, centered in pane

### Component — `TabStrip`
- [ ] `frontend/src/components/Viewer/TabStrip.tsx`:
  - Props: `tabs: Tab[]`, `activeTabId: string | null`, `onSelect`, `onClose`, `onAdd`
  - Horizontal scrollable row of `Tab` components
  - Right-most: `+` add button → opens OS file picker (`<input type="file">`)
  - No tab selected → nothing active (empty pane state)

### Component — `Tab`
- [ ] `frontend/src/components/Viewer/Tab.tsx`:
  - Props: `tab: Tab`, `isActive`, `onSelect`, `onClose`
  - Left: `StatusDot` (status from tab)
  - Middle: `fileName` truncated, `max-width: 120px`
  - Right: `×` close (visible on hover or when active)
  - Active: bottom border `2px solid primary`, `surface` bg
  - Error: red dot, `text-red-600` label

### Wire into `App.tsx`
- [ ] Replace `useOpenFiles` with `useTabs` as the source of truth for open files
- [ ] `openFromDrop` in sidebar calls `tabs.openTab('left', path, fileName, source)`
- [ ] `Preview` receives `source` from `tabs.left[activeLeft]?.source`
- [ ] `Preview` calls `tabs.updateTabStatus` on transpile/render result
- [ ] `Sidebar.FileList` still shows distinct unique open files (de-dup across left+right panes)

---

## Testing Requirements (Vitest)

### Unit — `useTabs.test.ts`
- [ ] `openTab` adds to `left` array
- [ ] `openTab` same path twice → focuses existing tab, does not duplicate
- [ ] `closeTab` removes tab; adjacent tab becomes active
- [ ] `closeTab` last tab → `activeLeft = null`
- [ ] `updateTabStatus('ok')` → tab status updated
- [ ] Persistence: state serialized to localStorage on change
- [ ] Restore: hook reads localStorage on mount and reconstructs tab list

### Component — `TabStrip.test.tsx`
- [ ] Renders tab for each entry in `tabs`
- [ ] Click tab → `onSelect` called with tabId
- [ ] Click `×` → `onClose` called with tabId
- [ ] `+` button present

### Component — `Tab.test.tsx`
- [ ] Active tab has bottom border style
- [ ] Error tab has red dot
- [ ] Filename truncated to `max-width`

### Integration — Session Restore
- [ ] Set `localStorage` with two paths → mount app → both tabs appear
- [ ] File-not-found path → tab shows `missing` status

---

## Done Gate
- [ ] All tests passing: `cd frontend && npm test`
- [ ] Zero TypeScript errors
- [ ] Multi-tab workflow: open 3 files, switch, close, all work correctly
- [ ] Page reload restores tabs (files must be accessible via backend)
- [ ] Missing file (path deleted) → grey dot + "File not found" pane, no crash
- [ ] Tab status dots update correctly after transpile

## Dependencies
- **Requires complete:** Phase 5 (Sidebar), Phase 6 (Preview)
- **Enables:** Phase 8 — Split View

## Notes
- Session restore on web requires backend file access — the browser cannot re-read OS files without user re-dropping them, unless using File System Access API. The `/api/files/read` endpoint solves this for the web phase. In Phase 11 (Tauri), `readFile` IPC replaces the HTTP call transparently via the IOAdapter.
- `useTabs` is a superset of `useOpenFiles` from Phase 5. Migrate `useOpenFiles` state into `useTabs` rather than maintaining two sources.
- `path` sanitization in backend: use Node.js `path.resolve()` and check result against a whitelist (e.g., user's home dir or any absolute path they provide — the file was opened explicitly). Reject `..` anywhere in the raw input.
