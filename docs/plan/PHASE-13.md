# Phase 13 — File Watcher + Hot Reload (Deferred)

## Status
> 🔲 NOT_STARTED  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Deferral Note
> **Intentionally moved to last.** Core app (Phases 0–10) ships without hot reload. This phase
> adds it as an opt-in feature. Design it as toggleable — a "Watch for changes" toggle per-tab
> or a global setting — so users can enable/disable without restarting. Expand the scope here
> before starting: decide on toggleable UX, settings persistence, and whether to expose this
> in the web prototype (chokidar + WebSocket), Tauri (notify crate), or both.

## Goal
Edit a `.jsx` file in any text editor → save → preview reloads automatically within 500ms.
File watching is opt-in via a per-tab toggle (or global setting). Backend uses `chokidar`
(web) / `notify` crate (Tauri) for watching; changes push over WebSocket / Tauri IPC.
Frontend re-reads, re-transpiles, re-renders without user interaction.

## Demo Checkpoint
- [ ] Open a `.jsx` file (must be accessible on disk by backend)
- [ ] Edit and save the file in VS Code / any editor
- [ ] Preview auto-reloads within ~500ms
- [ ] Tab dot briefly flashes, then returns to ok/error state
- [ ] If saved with a syntax error → error card appears automatically
- [ ] Fix the error and save → preview recovers automatically, no interaction needed

---

## Tasks

### Backend — WebSocket Server
- [ ] Add `ws` package to `backend/package.json` deps
- [ ] `backend/src/ws-server.ts`:
  - Creates `WebSocketServer` attached to the Express HTTP server
  - Manages `Map<ws.WebSocket, Set<string>>` — client → watched paths
  - Protocol messages (JSON):
    - Client → Server: `{ type: 'watch', path: string }`
    - Client → Server: `{ type: 'unwatch', path: string }`
    - Server → Client: `{ type: 'file-changed', path: string }`
    - Server → Client: `{ type: 'watch-ack', path: string }`
  - On client disconnect: unwatch all paths held by that client
  - Shared `chokidar` watcher pool (one watcher per path, ref-counted)

### Backend — Chokidar Watcher Pool
- [ ] `backend/src/watcher-pool.ts`:
  - `WatcherPool` class: `Map<string, { watcher: FSWatcher, refCount: number, listeners: Set<() => void> }>`
  - `watch(path, listener)` — adds listener; if path not yet watched, creates `chokidar.watch(path, { usePolling: false, awaitWriteFinish: { stabilityThreshold: 300 } })`
  - `unwatch(path, listener)` — removes listener; if refCount hits 0, closes chokidar watcher
  - `unwatchAll(listeners)` — called on WebSocket disconnect
  - `chokidar` events forwarded: `change` only (not `add` or `unlink` — those are file-picker events)

### Backend — Integrate WS + Watcher
- [ ] `backend/src/index.ts` — start HTTP server first, pass to `WebSocketServer`
- [ ] On `ws: message` `watch`: validate path (same sanitization as `/api/files/read`), register in pool, send `watch-ack`
- [ ] On `ws: message` `unwatch`: remove from pool
- [ ] On `chokidar change` event: send `{ type: 'file-changed', path }` to all clients watching that path

### Frontend — `WebIOAdapter` (complete `watchFile`)
- [ ] `frontend/src/lib/web-adapter.ts` — implement `watchFile` and `unwatchFile`:
  - Singleton WebSocket connection to `ws://localhost:3001` (or `wss://` if needed)
  - `watchFile(path, onChange)`:
    - Send `{ type: 'watch', path }` message
    - Register `onChange` listener in `Map<path, Set<() => void>>`
    - On `file-changed` message matching path: call all registered `onChange` callbacks
    - Returns `() => unwatchFile(path, onChange)`
  - `unwatchFile(path, onChange)`: deregisters listener, if no listeners left sends `{ type: 'unwatch', path }`
  - Reconnect logic: on WebSocket close, attempt reconnect with 2s backoff (max 5 attempts)

### Frontend — `useFileWatcher` Hook
- [ ] `frontend/src/hooks/useFileWatcher.ts`:
  - Props: `path: string | null`, `onChanged: () => void`
  - On mount / path change: calls `adapter.watchFile(path, onChanged)`, stores unwatch fn
  - On unmount / path change away: calls unwatch fn
  - Used by `Preview` component to re-trigger transpile on file change

### Frontend — Integrate into Preview
- [ ] `frontend/src/components/Viewer/Preview.tsx` — add re-read + re-render on file change:
  - `useFileWatcher(path, () => adapter.readFile(path).then(updateSource))`
  - `updateSource(newSource)`: calls `transpile` → `evalComponent` → updates rendered component
  - Tab dot flash: set `status: 'loading'` for 200ms then update to result status
  - **Debounce 300ms** between file-change event and re-read (consistent with DESIGN.md §12)

### Web Limitation Note — Path Mapping
- In the web phase, drag-drop gives filenames, not full OS paths. File watching requires
  full paths (chokidar needs them). Solution: when a file is dropped, the frontend also
  calls `POST /api/files/resolve` with the filename, and the backend responds with the
  path IF it's registered in a "watched directory" list — OR the user manually provides
  a path via a text input in a settings panel.

  **Simpler alternative for web phase:** Only enable watching for files opened via the
  "Browse…" button (which can trigger a `showOpenFilePicker()` File System Access API
  call in Chrome, giving a `FileSystemFileHandle` that can be polled). Drag-drop files
  show a "Watching disabled — use Browse to enable auto-reload" tooltip.

  **Decision:** Implement the simpler alternative. File System Access API `watch` is
  Chrome-only but acceptable for the web prototype phase. Full path watching works in
  Phase 11 Tauri where OS paths are available.

### File System Access API — `FSAAdapter`
- [ ] `frontend/src/lib/fsa-adapter.ts` — `FSAIOAdapter`:
  - `openFile()`: calls `window.showOpenFilePicker({ types: [{ accept: { 'text/*': ['.jsx', '.tsx'] } }] })` → returns `FileSystemFileHandle`
  - `readFile(handle)`: `await handle.getFile()` → `FileReader.readAsText()`
  - `watchFile(handle, onChange)`: polls `handle.getFile()` every 500ms, compares `lastModified` timestamp, calls `onChange` if changed
  - Returns unwatch function that stops polling
- [ ] `DropZone.tsx` — "Browse…" button calls `FSAIOAdapter.openFile()`, opens resulting file, enables watching
- [ ] Drag-drop path: still works, but shows "Watching disabled" badge on tab (grey dot, no pulse)
- [ ] Browse path: watching enabled, tab shows blue pulse dot

---

## Testing Requirements

### Backend (Jest + Supertest + ws)
- [ ] `WatcherPool`: `watch` adds listener; `unwatch` removes; refCount 0 → watcher closed
- [ ] WebSocket: connect → send `watch` → receive `ack`
- [ ] WebSocket: disconnect → all paths unwatched

### Frontend (Vitest)
- [ ] `WebIOAdapter.watchFile`: registers listener; mock WS message → `onChange` called
- [ ] `WebIOAdapter.unwatchFile`: removes listener; no listeners → sends `unwatch` message
- [ ] `useFileWatcher`: mounts → calls `watchFile`; unmounts → calls unwatch

### Manual Verification
- [ ] Browse-open a `.jsx` → edit + save → preview auto-reloads within 500ms
- [ ] Tab dot flashes then settles
- [ ] Introduce syntax error → error card appears on save
- [ ] Fix error → preview recovers on next save

### Test Fixture — Hot Reload Script

Save this as `hot-reload-test.jsx` and browse-open it. Then make each edit in sequence to exercise the watcher.

**Initial content:**
```jsx
export default function HotReloadTest() {
  return (
    <div className="p-8 bg-slate-900 min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl">
        🔄
      </div>
      <h1 className="text-3xl font-bold text-white">Version 1</h1>
      <p className="text-slate-400">Save the file to trigger hot reload</p>
    </div>
  );
}
```

**Edit 1 — change "Version 1" → "Version 2", add green bg:**
Expected: preview updates within 500ms, tab dot flashes briefly.

**Edit 2 — introduce syntax error (remove a closing `>`):**
```jsx
<div className="p-8 bg-slate-900 min-h-screen"
```
Expected: error card appears automatically showing line number.

**Edit 3 — fix the error (restore `>`):**
Expected: preview recovers, renders cleanly, no user interaction needed.

---

## Done Gate
- [ ] All tests passing (backend + frontend)
- [ ] Zero TypeScript errors
- [ ] Browse-open file → edit → save → auto-reload ✓
- [ ] Error recovery on save ✓
- [ ] WebSocket reconnects after Docker restart (within 5 retries)
- [ ] Drag-drop files show "Watching disabled" indicator correctly

## Dependencies
- **Requires complete:** Phase 12 — Production Readiness (app ships first)
- **Enables:** Post-ship feature expansion

## Notes
- `chokidar` in Docker: bind-mount the host filesystem into the container so chokidar can watch host paths. `docker-compose.yml` needs a volume: `- /Users:/Users:ro` (or scoped to user's home). This is expected for a developer tool — document in README.
- File System Access API: supported in Chrome 86+, Edge 86+, not in Firefox/Safari. Acceptable for web prototype. Note in UI if browser doesn't support it.
- The 300ms debounce prevents partial-write reads when editors do atomic saves (write temp file + rename). `chokidar awaitWriteFinish` handles this on the backend. FSA polling at 500ms naturally avoids this.
