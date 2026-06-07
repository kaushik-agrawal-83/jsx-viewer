# JSX Viewer — Design Document

> Render Claude-generated JSX artifacts locally. Drag-drop a file, see it live.

---

## 1. Overview

Claude Code and claude.ai generate rich JSX artifacts — dashboards, charts, UI prototypes —
that can't be previewed without a dev environment. JSX Viewer is a native macOS (and
cross-platform) desktop app that closes that gap with zero configuration.

**Core loop:**
1. Drop a `.jsx` file onto the sidebar
2. It renders immediately — React, Tailwind, Recharts, Lucide, shadcn/ui all pre-bundled
3. Edit the file in any text editor → viewer reloads automatically
4. Multiple files open as tabs; optional side-by-side split view

**Guiding principles:**
- Zero configuration. Install the `.dmg`, drag a file, done.
- Never crash on bad imports. Unknown libraries render as visible placeholders.
- Minimal UI. The artifact is the UI — the viewer chrome should disappear.

---

## 2. Layout Model

```
┌──────────────────────────────────────────────────────────────────┐
│  🔴 🟡 🟢                    JSX Viewer                         │  ← native titlebar
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR (resizable/collapsible) │ VIEWER TOOLBAR                 │
│                                 │ [⊞ Single] [⊟ Split]  ● watch │
│  Files                          ├─────────────────┬──────────────│
│  ─────                          │ PANE LEFT       │ PANE RIGHT   │
│  ● dashboard.jsx (watching)     │ [Tab][Tab][+]   │ [Tab][+]  ⊠ │
│  ● chart-widget.jsx             │ ─────────────── │ ─────────────│
│  ● data-table.jsx               │                 │              │
│                                 │  [rendered]     │  [rendered]  │
│  Recent                         │                 │              │
│  ○ auth-form.jsx                │                 │              │
│  ○ kpi-cards.jsx                │                 │              │
│                                 │                 │              │
│  ┌──────────────────┐           │                 │              │
│  │  ↓ Drop .jsx     │           │                 │              │
│  └──────────────────┘           │                 │              │
└─────────────────────────────────┴─────────────────┴──────────────┘
         ↑ drag handle                    ↑ pane divider (draggable)
```

### Sidebar states

| State | Width | Behavior |
|---|---|---|
| **Expanded** | 200px default (140–320 range) | Full file list + filenames + drop zone |
| **Collapsed** | 44px icon rail | Status dots only, hover = tooltip with name |
| **Hidden** | 0px | Keyboard shortcut ⌘B only; drag handle still accessible |

**Auto-collapse rule:** Entering split view mode automatically collapses sidebar to icon rail to maximize viewer space. Expanding sidebar in split mode is allowed but not the default.

### Viewer pane states

| Mode | Panes | Behavior |
|---|---|---|
| **Single** | 1 | Full viewer width after sidebar. Tabs across top. |
| **Split** | 2 | Divider at 50% default, drag to resize. Each pane has own tab strip. |

---

## 3. Architecture

Tauri v2 native app.

```
┌──────────────────────────────────────────────────────┐
│  React / TypeScript frontend                         │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Sidebar   │  │ Viewer/Panes │  │  Tab mgr    │  │
│  │  FileList  │  │  Preview     │  │  Error UI   │  │
│  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘  │
│        │    Tauri IPC   │                  │         │
├────────┼────────────────┼──────────────────┼─────────┤
│  Rust / Tauri backend   │                  │         │
│  ┌─────┴────────────────┴──────────────────┴──────┐  │
│  │  commands.rs                                    │  │
│  │  read_file / watch_file / unwatch_file          │  │
│  │  notify crate → "file-changed" events           │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Why Tauri:** Native file system access, `notify` crate for solid file watching,
ships as `.dmg`/`.exe`/`.AppImage` — no runtime deps, low memory vs Electron.

---

## 4. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Desktop shell | Tauri v2 | Native, lightweight, macOS-native file ops |
| Frontend | React 18 + TypeScript | Matches artifact ecosystem |
| Build | Vite | Fast dev, Tauri-compatible |
| Styling | Tailwind CSS v3 | Matches artifacts |
| JSX transpiler | `@babel/standalone` | In-browser, no per-file build step |
| File watcher | `notify` crate (Rust) | Cross-platform, reliable |
| Session storage | `localStorage` | Tab restore on relaunch |

---

## 5. Project Structure

```
jsx-viewer/
├── src/
│   ├── App.tsx                      # Root: layout orchestration
│   ├── components/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx          # Container: expanded / collapsed / hidden
│   │   │   ├── FileList.tsx         # Open + Recent sections with status dots
│   │   │   ├── DropZone.tsx         # Bottom drop target; whole sidebar accepts drops
│   │   │   └── SidebarHandle.tsx    # Drag-to-resize edge
│   │   ├── Viewer/
│   │   │   ├── ViewerToolbar.tsx    # Single/Split toggle, watch count
│   │   │   ├── PaneContainer.tsx    # Flex row; manages pane split + divider
│   │   │   ├── Pane.tsx             # One preview pane: tab strip + preview area
│   │   │   ├── PaneDivider.tsx      # Drag-to-resize between split panes
│   │   │   ├── TabStrip.tsx         # Tabs for one pane
│   │   │   ├── Preview.tsx          # Sandboxed render + ErrorBoundary
│   │   │   └── ErrorDisplay.tsx     # Transpile + runtime error card
│   ├── hooks/
│   │   ├── useSidebar.ts            # Width, collapsed state, persist to localStorage
│   │   ├── usePanes.ts              # Single/split mode, pane sizes
│   │   ├── useTabs.ts               # Per-pane tab state, session persistence
│   │   └── useFileWatcher.ts        # Tauri "file-changed" event listener
│   └── lib/
│       ├── transpiler.ts            # Babel standalone pipeline
│       ├── registry.ts              # Import → pre-bundled lib map
│       └── renderer.ts              # new Function() eval + React mount
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   └── commands.rs              # read_file, watch_file, unwatch_file
│   ├── Cargo.toml                   # notify = "6"
│   └── tauri.conf.json
└── package.json
```

---

## 6. UX States (5 screens — see mockup HTML)

### ① Sidebar expanded, single pane (default)

- Sidebar 200px, file list + drop zone footer
- Viewer: full remaining width, single pane, tabs across top
- Status dots: blue pulse = watching, green = ok, red = error, grey = recent/closed
- Toolbar: `⊞ Single` active, `⊟ Split` inactive, watch count right

### ② Sidebar collapsed to icon rail

- 44px rail, dots only, hover shows filename tooltip
- Toggle button (⊞) at top re-expands
- ⌘B keyboard shortcut to toggle
- Drop icon at rail bottom opens browse dialog
- Dropping onto rail still works

### ③ Drag active — file hovering

- Whole sidebar highlights (dashed blue border)
- Drop zone text updates to dragged filename
- Viewer dims to 50% opacity to draw attention to drop target
- Dropping onto viewer area also works → opens in focused pane's tabs

### ④ Side-by-side split

- Toolbar: `⊟ Split` active
- Two pane areas separated by draggable divider (default 50/50)
- Each pane has its own tab strip
- Right pane has `⊠` close-split button in tab strip right edge
- Closing right pane merges its tabs into left pane
- Sidebar auto-collapses to rail on enter split mode

### ⑤ Error in one pane, other ok

- Error pane: red tab dot, muted red tab label, error card in preview area
- Other pane: fully unaffected, continues watching
- Sidebar: errored file shows red dot + muted red filename
- Auto-recovers: fix file → save → pane reloads without interaction

---

## 7. Component: Sidebar

### Resize behavior
- Drag handle is a 3px target on right edge of sidebar
- Min width: 140px. Max width: 320px.
- Width persisted to `localStorage` key `sidebar.width`
- Collapsed state persisted to `localStorage` key `sidebar.collapsed`
- Animation: `transition: width 0.2s cubic-bezier(.4,0,.2,1)`

### File list sections
```
Open         ← currently open files (one per unique path)
─────────
● dashboard.jsx       ← blue dot = watching
● chart-widget.jsx    ← green dot = ok, not currently in active tab
✕ broken.jsx          ← red dot = error

Recent       ← previously opened, now closed (last 10)
─────────
○ auth-form.jsx       ← grey dot, click to re-open
```

Clicking any file: if already open in any pane → focus that tab. If not open → open in
focused pane's tab strip.

### Drop zone
- Pinned to sidebar bottom, ~80px tall in expanded mode
- Entire sidebar body also accepts drops (dragover → highlight)
- In collapsed mode: `↓` icon in rail bottom opens browse dialog on click

---

## 8. Component: Viewer / Panes

### Single/Split toggle
- `⊞ Single` / `⊟ Split` buttons in viewer toolbar
- Split: inserts `PaneDivider` between two `Pane` components
- `usePanes` hook manages: `mode: 'single' | 'split'`, `leftRatio: number` (0.3–0.7)
- Pane sizes = `flex-basis` computed from ratio; divider drag updates ratio

### Tab strip (per pane)
```typescript
interface Tab {
  id: string;
  path: string;
  fileName: string;
  paneId: 'left' | 'right';
  status: 'ok' | 'error' | 'loading' | 'missing';
  error?: TranspileError | RuntimeError;
}
```
- Dot colors: blue pulse (watching + ok), green (ok, not active watch?), red (error)
- `×` close: removes tab, stops watching that path (if not open in other pane)
- `+` add: opens OS file picker

### Pane divider
- 4px wide, `cursor: col-resize`
- Drag updates `leftRatio` in `usePanes`
- Double-click: reset to 50/50

---

## 9. Data Flow

### File open
```
Drop/browse → path acquired
    → useTabs: add tab in focused pane (status: 'loading')
    → read_file(path) IPC → Rust fs::read_to_string
    → transpile(source) → Babel + esmToCommonJS plugin
    → evalComponent(transpiled) → new Function() + registry
    → React.render(<Component />) in Preview div
    → tab status → 'ok'
    → watch_file(path) IPC → Rust notify watcher starts
```

### Hot reload
```
User saves file on disk
    → notify watcher fires Write event
    → debounce 300ms
    → Rust emits Tauri event: "file-changed" { path }
    → useFileWatcher matches path to open tabs (may be in both panes)
    → re-transpile + re-render each matching tab
    → tab dot flashes briefly
```

### Tab close
```
User clicks × on tab
    → check: is path open in any other tab?
    → if no other tab: unwatch_file(path) IPC
    → remove tab from pane state
    → session storage updated
    → if pane now empty: show empty pane hint
```

### Split close (right pane → single)
```
User clicks ⊠
    → right pane tabs migrate into left pane tab strip (appended)
    → right pane watchers remain active (tabs moved, not closed)
    → mode → 'single'
    → sidebar expands if it was auto-collapsed by entering split mode
```

---

## 10. Transpilation Pipeline

`src/lib/transpiler.ts`
```typescript
function transpile(source: string): TranspileResult {
  try {
    const result = Babel.transform(source, {
      presets: ['react'],
      plugins: [esmToCommonJSPlugin],
      filename: 'component.jsx',
    });
    return { ok: true, code: result.code };
  } catch (e: any) {
    return { ok: false, error: { message: e.message, line: e.loc?.line, col: e.loc?.column } };
  }
}
```

`src/lib/renderer.ts`
```typescript
function evalComponent(code: string): React.ComponentType {
  const module = { exports: {} as any };
  const req = (specifier: string) => registry.resolve(specifier);
  new Function('require', 'module', 'exports', code)(req, module, module.exports);
  return module.exports.default;
}
```

**Error boundaries:** `<ErrorBoundary>` wraps each `<Preview>` — catches component
render throws and displays runtime error card without crashing the app.

---

## 11. Library Support (Core v1)

| Import | Library |
|---|---|
| `react`, `react-dom` | React 18 |
| `lucide-react` | All icons |
| `recharts` | All chart types |
| `@/components/ui/*` | shadcn/ui stubs |
| `@/lib/utils`, `@/lib/cn` | cn utility |
| `clsx` | clsx |
| `tailwind-merge` | tailwind-merge |
| `class-variance-authority` | cva |
| `@radix-ui/react-slot` | Radix slot |

**Unknown imports:** render as `<div style="border:2px dashed #f0b429">Unknown: {specifier}</div>`

**Future (v2):** D3, Three.js, Plotly, Lodash, Papaparse, mathjs, SheetJS — addable
without architecture changes, just expand registry.

---

## 12. File Watcher Spec

- Crate: `notify` v6
- Mode: `RecommendedWatcher` (FSEvents on macOS)
- Watcher map: `HashMap<String, RecommendedWatcher>` keyed by absolute path
- One watcher per unique path (not per tab — shared if same file in both panes)
- Events forwarded: `tauri::Manager::emit_all("file-changed", FileChangedPayload { path })`
- Debounce: 300ms (prevents mid-write partial reads)
- Cleanup: watcher dropped on last tab holding that path closes; all watchers dropped on app exit

---

## 13. Session Persistence

On every state change, write to `localStorage`:
```json
{
  "sidebar.width": 200,
  "sidebar.collapsed": false,
  "panes.mode": "single",
  "panes.leftRatio": 0.5,
  "tabs.left": ["/abs/path/dashboard.jsx", "/abs/path/chart.jsx"],
  "tabs.right": [],
  "tabs.activeLeft": "/abs/path/dashboard.jsx",
  "tabs.activeRight": null
}
```

On launch: restore from storage → re-read + re-watch each path. Files no longer on
disk: tab shows "File not found — drop it here again" with grey dot.

---

## 14. macOS File Association (Bonus — post-v1)

1. Register `.jsx` / `.tsx` UTI in `tauri.conf.json` → `Info.plist`
2. `CFBundleDocumentTypes` entry covering `public.source-code`
3. Tauri `on_open_urls` handler receives file path on launch or activation
4. App running: emit IPC to frontend → open in focused pane's tab strip
5. Cold launch: start → open file tab automatically

**Installer prompt:** "Make JSX Viewer the default handler for .jsx files?
(You can change this later in Finder → Get Info.)"

---

## 15. Open Questions

| Question | Options | Recommendation |
|---|---|---|
| Tailwind in preview | CDN at runtime vs PostCSS at build | CDN `<script>` injected into preview div — simpler, matches claude.ai |
| shadcn/ui fidelity | Full Radix vs hand-rolled stubs | Hand-rolled stubs — avoids 300KB+ Radix bundle |
| Preview isolation | React subtree vs `<iframe srcdoc>` | Start with subtree; migrate to iframe if Tailwind bleeds into viewer chrome |
| Tab drag between panes | Implement in v1 or defer | Defer — complex, not blocking for split view usefulness |
| Sidebar hidden mode | Full hide vs 44px min | 44px min (icon rail) as effective minimum; full hide via ⌘B |

---

## 16. Prior Art

- **HN-Tran/jsx-viewer** (v0.1.2, Mar 2026) — closest prior art. Tauri + Babel + module
  registry. No file watching, no sidebar, no split view. Good reference for transpile pipeline.
- **claudio-silva/claude-artifact-runner** — npx/Docker approach. Copy-paste workflow.
  Useful for library version parity.

---

## 17. Implementation Order

1. **Scaffold** — `npm create tauri-app`, Vite + React + TS
2. **Transpile pipeline** — `transpiler.ts` + `registry.ts` + `renderer.ts`, core libs
3. **Sidebar** — FileList + DropZone + resize handle, single file open
4. **Preview + error display** — `Preview.tsx`, `ErrorBoundary`, `ErrorDisplay.tsx`
5. **Tabs** — `useTabs`, `TabStrip`, session persist
6. **File watcher** — `notify` commands, `useFileWatcher`, hot reload, status dots
7. **Split view** — `usePanes`, `PaneContainer`, `PaneDivider`, pane toolbar
8. **Sidebar collapse** — icon rail, ⌘B shortcut, auto-collapse on split
9. **Polish** — watch count badge, tab dot animations, drag-highlight on drop, session restore
10. **macOS file association** — UTI registration, `on_open_urls` (bonus)

---

## §A. macOS File Association (Promoted to Core Feature)

> Replaces the stub in §14. This is a first-class feature, implemented alongside the
> core tab/watcher work, not deferred.

### A1. What it enables

- `.jsx` and `.tsx` files in Finder show a **custom JSX Viewer document icon**
- **Right-click → Open With → JSX Viewer** always available after install
- **Double-click** opens in JSX Viewer (when set as default)
- App already running → file opens in a **new tab** in the focused pane, app comes to front
- App not running → **cold launch** directly into the rendered file, no empty state shown
- **Multi-select + Enter** in Finder → each file becomes a separate tab

---

### A2. Registration — tauri.conf.json

```json
{
  "bundle": {
    "fileAssociations": [
      {
        "ext": ["jsx", "tsx"],
        "name": "JSX Component",
        "role": "Viewer",
        "rank": "Alternate",
        "exportedType": {
          "identifier": "com.jsx-viewer.jsx-component",
          "conformsTo": ["public.source-code", "public.plain-text"]
        }
      }
    ]
  }
}
```

**`rank: "Alternate"`** — safe default. JSX Viewer appears in "Open With" submenu
but does NOT hijack the user's existing `.jsx` default (typically VS Code or Cursor).
User can promote to default via the first-launch prompt or Finder Get Info.

**`exportedType`** — required because `.jsx` is not a built-in Apple UTI. Declares a
custom type that conforms to `public.source-code` so other apps (editors, Spotlight)
still recognise it correctly.

Tauri CLI auto-generates the corresponding `CFBundleDocumentTypes` and
`UTExportedTypeDeclarations` entries in `Info.plist` from the above.

---

### A3. Custom Document Icon

Finder shows a per-file-type icon next to `.jsx` files when JSX Viewer is registered.

Deliver as `src-tauri/icons/jsx-doc.icns` with sizes: 16, 32, 128, 256, 512 px.
Reference in `tauri.conf.json`:
```json
{ "bundle": { "icon": ["icons/jsx-doc.icns"] } }
```

Design direction: the app icon (⚛ React atom on dark background) with a document
page shape — consistent with how Preview's icon relates to PDF file icons in Finder.

---

### A4. First-Launch Prompt

Shown **once**, on first run after install. Persisted to app prefs so it never
re-appears unless the user resets from the app menu.

```
┌──────────────────────────────────────────────────────┐
│  [App icon]  Open .jsx files with JSX Viewer?        │
│              Double-clicking .jsx in Finder will open │
│              it directly in JSX Viewer.               │
│                                                       │
│  ℹ Note: Your code editor is unaffected. You can     │
│    reverse this from Finder → Get Info → Open With.  │
│                                                       │
│  [No thanks]          [Set as Default for .jsx]      │
└──────────────────────────────────────────────────────┘
```

**"Set as Default"** → calls `LSSetDefaultRoleHandlerForContentType` via the Rust
backend to promote rank from `Alternate` to `Owner`.

**"No thanks"** → stays `Alternate`. App still appears in Open With submenu.

App menu item **"Manage .jsx Association…"** re-shows this prompt at any time.

---

### A5. Runtime Event Handling — Rust

`RunEvent::Opened` is the single event that covers both cold start and warm (app
already running). Pattern from Tauri v2 official docs:

```rust
use std::sync::Mutex;
use tauri::Manager;

struct OpenedUrls(Mutex<Vec<tauri::Url>>);

#[tauri::command]
fn opened_urls(app: tauri::AppHandle) -> Vec<String> {
    app.state::<OpenedUrls>()
        .0.lock().unwrap()
        .iter()
        .map(|u| u.to_file_path().unwrap().to_string_lossy().into_owned())
        .collect()
}

pub fn run() {
    tauri::Builder::default()
        .manage(OpenedUrls(Mutex::new(vec![])))
        .invoke_handler(tauri::generate_handler![
            read_file, watch_file, unwatch_file, opened_urls
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri app")
        .run(|app, event| {
            if let tauri::RunEvent::Opened { urls } = event {
                use tauri::Emitter;
                // Store for cold-start frontend read
                app.state::<OpenedUrls>()
                    .0.lock().unwrap()
                    .extend(urls.clone());
                // Emit for warm-start frontend listener
                app.emit("opened", urls).unwrap();
            }
        });
}
```

---

### A6. Runtime Event Handling — Frontend

`src/hooks/useFinderOpen.ts`

```typescript
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

export function useFinderOpen(onPaths: (paths: string[]) => void) {
  useEffect(() => {
    // Cold start: read paths stored before frontend mounted
    invoke<string[]>('opened_urls').then(paths => {
      if (paths.length > 0) onPaths(paths);
    });

    // Warm: listen for files opened while app is running
    const unlisten = listen<string[]>('opened', event => {
      onPaths(event.payload);
    });

    return () => { unlisten.then(f => f()); };
  }, []);
}
```

`onPaths` callback (in `App.tsx`):
```typescript
useFinderOpen((paths) => {
  paths.forEach(path => {
    tabs.openInFocusedPane(path);   // reuses existing tab if already open
  });
});
```

---

### A7. Behaviour Matrix

| Trigger | App state | Result |
|---|---|---|
| Double-click `.jsx` (JSX Viewer = default) | Not running | Cold launch → file renders immediately |
| Double-click `.jsx` (JSX Viewer = default) | Running | New tab in focused pane, app comes to front |
| Right-click → Open With → JSX Viewer | Either | Same as above |
| Select 3 `.jsx` files → Enter | Either | 3 new tabs, each rendered |
| Drag `.jsx` onto Dock icon | Running | New tab, same warm path |
| Drag `.jsx` onto Dock icon | Not running | Cold launch with that file |
| `.tsx` file (also registered) | Either | Same as `.jsx` — both extensions handled |

---

### A8. Single-Instance Note

macOS natively prevents launching a second JSX Viewer instance when one is already
running and the file is opened via Finder/Open With. The Apple Event system routes
directly to the existing process → `RunEvent::Opened`. **No `tauri-plugin-single-instance`
required on macOS** for this feature. The plugin is only needed if supporting
Windows/Linux CLI-driven opens.

---

### A9. Updated Implementation Order

Replacing the §17 order — file association moves from step 10 to step 8:

1. **Scaffold** — `npm create tauri-app`, Vite + React + TS
2. **Transpile pipeline** — `transpiler.ts` + `registry.ts` + `renderer.ts`, core libs
3. **Sidebar** — FileList + DropZone + resize handle, single file open
4. **Preview + error display** — `Preview.tsx`, `ErrorBoundary`, `ErrorDisplay.tsx`
5. **Tabs** — `useTabs`, `TabStrip`, session persist
6. **File watcher** — `notify` commands, `useFileWatcher`, hot reload, status dots
7. **Split view** — `usePanes`, `PaneContainer`, `PaneDivider`, toolbar
8. **File association** — `tauri.conf.json` registration, `RunEvent::Opened` Rust handler,
   `useFinderOpen` hook, first-launch prompt, document icon `.icns`
9. **Sidebar collapse** — icon rail, ⌘B shortcut, auto-collapse on split
10. **Polish** — watch count badge, toast on Finder-open, session restore, animations
