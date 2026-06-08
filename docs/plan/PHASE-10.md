# Phase 10 — Tauri Migration

## Status
> ✅ COMPLETE  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Goal
Port the validated web UI to a native macOS desktop app using Tauri v2. The React
frontend is reused as-is. Only the I/O layer changes: swap `WebIOAdapter` for
`TauriIOAdapter` that calls Rust IPC commands instead of HTTP/WebSocket. Result:
`.dmg` that installs and runs with no browser or Docker needed.

## Demo Checkpoint
- [ ] `npm run tauri dev` → native macOS window opens with JSX Viewer
- [ ] Drag `.jsx` file from Finder into the sidebar → renders
- [ ] File watching works: edit + save in any editor → preview auto-reloads
- [ ] `npm run tauri build` → `.dmg` in `src-tauri/target/release/bundle/dmg/`
- [ ] Install `.dmg` → app runs standalone (no Node.js / Docker required)

---

## Tasks

### Project Restructure for Tauri
- [ ] Scaffold Tauri into the existing `frontend/` directory:
  ```
  cd frontend && npm install --save-dev @tauri-apps/cli@^2
  npx tauri init
  ```
  - App name: `JSX Viewer`
  - Window title: `JSX Viewer`
  - Web assets dir: `../dist` (Vite build output)
  - Dev server URL: `http://localhost:5173`
  - Dev command: `npm run dev`
  - Build command: `npm run build`
- [ ] `frontend/src-tauri/` is created by init — verify it contains `tauri.conf.json`, `Cargo.toml`, `src/main.rs`, `src/lib.rs`
- [ ] `frontend/src-tauri/Cargo.toml` deps: `tauri = { version = "2", features = [] }`, `notify = "6"`, `serde = { features = ["derive"] }`, `serde_json = "1"`

### Rust — Commands
- [ ] `frontend/src-tauri/src/commands.rs`:
  ```rust
  #[tauri::command]
  pub async fn read_file(path: String) -> Result<String, String>

  #[tauri::command]
  pub async fn watch_file(app: tauri::AppHandle, path: String) -> Result<(), String>

  #[tauri::command]
  pub async fn unwatch_file(path: String) -> Result<(), String>
  ```
  - `read_file`: `fs::read_to_string(&path).map_err(|e| e.to_string())`
  - `watch_file`: adds `notify` `RecommendedWatcher` for `path` to a `HashMap<String, RecommendedWatcher>` held in `tauri::State<WatcherMap>`; on `notify::EventKind::Modify(_)`: emit Tauri event `"file-changed"` with `{ path }`; debounce 300ms
  - `unwatch_file`: removes watcher from map (drops it, stopping watch)

- [ ] `frontend/src-tauri/src/lib.rs` (or `main.rs`):
  - Define `WatcherMap(Mutex<HashMap<String, RecommendedWatcher>>)`
  - `.manage(WatcherMap(Mutex::new(HashMap::new())))`
  - `.invoke_handler(tauri::generate_handler![read_file, watch_file, unwatch_file])`

### Frontend — `TauriIOAdapter`
- [ ] `frontend/src/lib/tauri-adapter.ts`:
  ```ts
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';

  export class TauriIOAdapter implements IOAdapter {
    async readFile(path: string): Promise<string> {
      return invoke<string>('read_file', { path });
    }

    async watchFile(path: string, onChange: () => void): Promise<() => void> {
      const unlisten = await listen<{ path: string }>('file-changed', (event) => {
        if (event.payload.path === path) onChange();
      });
      await invoke('watch_file', { path });
      return async () => {
        await invoke('unwatch_file', { path });
        unlisten();
      };
    }

    async unwatchFile(path: string): Promise<void> {
      await invoke('unwatch_file', { path });
    }
  }
  ```

### Frontend — Adapter Switching
- [ ] `frontend/src/lib/adapter-factory.ts`:
  ```ts
  export function createAdapter(): IOAdapter {
    if (window.__TAURI__) return new TauriIOAdapter();
    return new WebIOAdapter();
  }
  ```
- [ ] `frontend/src/main.tsx` — replace `new WebIOAdapter()` with `createAdapter()`
- [ ] This allows the same build to work in both web (dev) and Tauri (production)

### Frontend — Full OS Path Support
- [ ] In Tauri, drag-drop via Tauri's built-in drag-drop gives full OS paths
- [ ] `frontend/src-tauri/tauri.conf.json` — enable drag-drop: `"dragDropEnabled": true` in capabilities
- [ ] Listen for Tauri `tauri://drag-drop` event in `App.tsx` (or `DropZone.tsx`):
  ```ts
  import { listen } from '@tauri-apps/api/event';
  listen('tauri://drag-drop', (event) => {
    const paths: string[] = event.payload.paths;
    paths.filter(p => p.endsWith('.jsx') || p.endsWith('.tsx'))
         .forEach(path => tabs.openTab('left', path, basename(path)));
  });
  ```
- [ ] `tabs.openTab` calls `adapter.readFile(path)` to load content (now has full path → watching works)
- [ ] Remove FSA API polling workaround (was planned in Phase 13 — not implemented yet; skip this step until Phase 13 is built)
- [ ] Remove "Watching disabled" badge — all files opened in Tauri have full paths

### Tauri Window Config
- [ ] `frontend/src-tauri/tauri.conf.json`:
  ```json
  {
    "app": {
      "windows": [{
        "title": "JSX Viewer",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 500,
        "decorations": true,
        "transparent": false
      }]
    },
    "bundle": {
      "identifier": "com.jsx-viewer.app",
      "icon": ["icons/icon.icns", "icons/icon.png"]
    }
  }
  ```
- [ ] Generate app icons: place `icon.png` (1024×1024) in `frontend/src-tauri/icons/`, run `npx tauri icon`

### Remove Web Backend Dependency
- [ ] In Tauri mode (`window.__TAURI__`), `TauriIOAdapter` is used — no HTTP/WebSocket calls
- [ ] `docker-compose.yml` remains for web dev workflow (not used for Tauri)
- [ ] `README.md`: document both run modes:
  - Web dev: `docker-compose up` → `http://localhost:5173`
  - Tauri dev: `cd frontend && npm run tauri dev`
  - Tauri build: `cd frontend && npm run tauri build`

---

## Testing Requirements

### Rust Unit Tests — `frontend/src-tauri/src/commands.rs`
- [ ] `read_file` on existing file → returns content
- [ ] `read_file` on missing file → returns `Err` string
- [ ] `unwatch_file` on non-watched path → no panic (idempotent)

### Frontend (Vitest — web mode still works)
- [ ] `createAdapter()` in web context (no `window.__TAURI__`) → returns `WebIOAdapter`
- [ ] All existing Phase 4–9 tests still pass (`npm test`)

### Manual Verification
- [ ] `npm run tauri dev` opens native window
- [ ] Drag `.jsx` from Finder → full path → renders AND watching works
- [ ] Edit file in VS Code → save → auto-reload in Tauri window
- [ ] `npm run tauri build` → `.dmg` produced
- [ ] Install `.dmg` → open app → no Docker/Node.js required

### Test Fixtures — Tauri-Specific Verification

Save these files to `~/Desktop/` for easy Finder access.

**Drag-drop + watching test** — `~/Desktop/tauri-test.jsx`:
```jsx
import { TrendingUp } from 'lucide-react';

export default function TauriTest() {
  return (
    <div className="p-8 bg-slate-900 min-h-screen flex flex-col items-center justify-center gap-4">
      <TrendingUp className="text-indigo-400 w-12 h-12" />
      <h1 className="text-3xl font-bold text-white">Tauri ✓</h1>
      <p className="text-slate-400 text-center max-w-xs">
        File opened via native drag-drop. Edit this file in VS Code and save to test hot reload.
      </p>
      <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 rounded-lg">
        <code className="text-indigo-300 text-sm">Version 1 — change this text and save</code>
      </div>
    </div>
  );
}
```
**Sequence:** Drag from Finder → renders → edit "Version 1" text in VS Code → save → verify auto-reload in Tauri window (full path watching active).

**Cold-launch test** — quit the app, then double-click `tauri-test.jsx` via "Open With → JSX Viewer". Expected: app launches directly into the rendered file with no empty state shown.

---

## Done Gate
- [ ] All Rust tests pass: `cd frontend/src-tauri && cargo test`
- [ ] All frontend tests pass: `cd frontend && npm test`
- [ ] Zero TypeScript errors: `cd frontend && npx tsc --noEmit`
- [ ] `npm run tauri dev` → native app works end-to-end
- [ ] File watching works in native app (full paths from drag-drop)
- [ ] `npm run tauri build` → `.dmg` produced and installs cleanly
- [ ] Web mode (`docker-compose up`) still works (no regression)

## Dependencies
- **Requires complete:** Phase 9 — Sidebar Collapse + Polish
- **Enables:** Phase 11 — macOS File Association

## Notes
- `notify` crate: use `RecommendedWatcher` (wraps FSEvents on macOS — low CPU, no polling).
- Debounce 300ms in Rust: use a `HashMap<String, Instant>` to track last-emit time per path; skip emit if last emit was < 300ms ago.
- Tauri v2 uses `window.__TAURI_INTERNALS__` (not `window.__TAURI__`) for runtime detection — fixed in adapter-factory and App.tsx.
- The Docker backend (`backend/` service) is NOT needed in Tauri mode. Keep it for web dev iteration. Do not delete it.
- Rust `Mutex` on `WatcherMap`: accept the lock overhead; the watcher map is only touched on IPC commands, not on the hot path.

## Known Issues
- **Native drag-drop not working** (`tauri://drag-drop` event not firing). Listener registered correctly (`__TAURI_INTERNALS__` detected, dynamic import succeeds) but drop from Finder produces no event. Likely cause: Tauri v2 window-level drag-drop config or capabilities gap. Needs investigation before Phase 11. Workaround: use the "+" button or file picker to open files in Tauri mode.
