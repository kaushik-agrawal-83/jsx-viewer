# Phase 11 — macOS File Association

## Status
> ✏️ CODE_COMPLETE  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Goal
`.jsx` and `.tsx` files in Finder open in JSX Viewer via double-click (when set as
default) or right-click → Open With. App handles cold-start and warm (already running)
file opens. Includes first-launch prompt to set as default, and a custom document icon
in Finder. Full spec from DESIGN.md §A.

## Demo Checkpoint
- [ ] Right-click `.jsx` in Finder → "Open With" → "JSX Viewer" appears
- [ ] Click "Open With JSX Viewer" → file renders in a new tab (app launches if not running)
- [ ] App already running → second double-click opens in new tab (no second window)
- [ ] First launch → prompt appears: "Set JSX Viewer as default for .jsx?"
- [ ] Click "Set as Default" → subsequent double-clicks auto-open in JSX Viewer

---

## Tasks

### tauri.conf.json — File Association Registration
- [ ] Add to `frontend/src-tauri/tauri.conf.json`:
  ```json
  {
    "bundle": {
      "fileAssociations": [
        {
          "ext": ["jsx", "tsx"],
          "name": "JSX Component",
          "role": "Viewer",
          "rank": "Alternate"
        }
      ]
    }
  }
  ```
- [ ] Note: Tauri v2 generates `CFBundleDocumentTypes` + `UTExportedTypeDeclarations` in `Info.plist` from this config automatically

### Rust — `RunEvent::Opened` Handler
- [ ] `frontend/src-tauri/src/lib.rs` — add `OpenedUrls` state:
  ```rust
  use std::sync::Mutex;
  pub struct OpenedUrls(pub Mutex<Vec<String>>);
  ```
- [ ] `.manage(OpenedUrls(Mutex::new(vec![])))`
- [ ] In `.run()` callback:
  ```rust
  .run(|app, event| {
    if let tauri::RunEvent::Opened { urls } = event {
      let paths: Vec<String> = urls.iter()
        .filter_map(|u| u.to_file_path().ok())
        .map(|p| p.to_string_lossy().into_owned())
        .collect();
      app.state::<OpenedUrls>().0.lock().unwrap().extend(paths.clone());
      app.emit("opened-files", paths).ok();
    }
  })
  ```

### Rust — `opened_files` Command
- [ ] `frontend/src-tauri/src/commands.rs`:
  ```rust
  #[tauri::command]
  pub fn opened_files(app: tauri::AppHandle) -> Vec<String> {
    let state = app.state::<OpenedUrls>();
    let mut lock = state.0.lock().unwrap();
    let paths = lock.clone();
    lock.clear();   // consume — only read once
    paths
  }
  ```
- [ ] Register in `invoke_handler`

### Rust — First-Launch Default Prompt (macOS only)
- [ ] `frontend/src-tauri/src/commands.rs`:
  ```rust
  #[tauri::command]
  pub fn set_as_default_handler() -> Result<(), String>
  ```
  - Calls `LSSetDefaultRoleHandlerForContentType` via `core_services` crate or `std::process::Command` with `duti` / `lsregister`
  - Simpler approach: spawn `swift` one-liner:
    ```
    swift -e 'import AppKit; LSSetDefaultRoleHandlerForContentType("com.jsx-viewer.jsx-component" as CFString, .viewer, Bundle.main.bundleIdentifier! as CFString)'
    ```
  - Returns `Ok(())` on success, `Err(reason)` on failure
- [ ] `frontend/src-tauri/src/commands.rs` — `has_prompted_default` command: read/write a flag to `tauri::api::path::app_config_dir()` / `default-prompted.flag`

### Frontend — `useFinderOpen` Hook
- [ ] `frontend/src/hooks/useFinderOpen.ts`:
  ```ts
  export function useFinderOpen(onPaths: (paths: string[]) => void) {
    useEffect(() => {
      // Cold start: read paths buffered before frontend mounted
      invoke<string[]>('opened_files').then(paths => {
        if (paths.length > 0) onPaths(paths);
      });
      // Warm: listen for files opened while app is running
      const unlisten = listen<string[]>('opened-files', (e) => {
        onPaths(e.payload);
      });
      return () => { unlisten.then(f => f()); };
    }, []);
  }
  ```
- [ ] Wire into `App.tsx`:
  ```ts
  useFinderOpen((paths) => {
    paths.forEach(path => tabs.openTab('left', path, basename(path)));
  });
  ```

### Frontend — First-Launch Prompt Component
- [ ] `frontend/src/components/DefaultHandlerPrompt.tsx`:
  - Modal dialog shown on first launch if `has_prompted_default` returns false
  - Content from DESIGN.md §A4 (app icon + text + note + two buttons)
  - "Set as Default" → `invoke('set_as_default_handler')` → close modal
  - "No thanks" → close modal
  - Modal styled with Phase 0 tokens: `surface` bg, `neutral-900` overlay, `border-radius: lg`, shadow `lg`
- [ ] `App.tsx` — on mount, `invoke('has_prompted_default')`:
  - If false: show `<DefaultHandlerPrompt>` after 1s delay (let app render first)
  - If true: skip
- [ ] App menu item "Manage .jsx Association…" → re-shows prompt (set `showPrompt: true`)

### Document Icon (`jsx-doc.icns`)
- [ ] Create `frontend/src-tauri/icons/jsx-doc.icns`:
  - Design: React atom (⚛) on dark `neutral-900` background with document page shape
  - Required sizes: 16, 32, 128, 256, 512px
  - Tooling: use `iconutil` (macOS) or a design tool export
  - Placeholder: copy app icon for now; replace with designed icon before release
- [ ] Reference in `tauri.conf.json` `bundle.icon` array

---

## Testing Requirements

### Rust Tests
- [ ] `opened_files` command: state pre-loaded → returns paths → second call returns empty (consumed)
- [ ] `has_prompted_default`: returns false first time, true after `set_prompted`

### Frontend Tests (Vitest — mock Tauri invoke)
- [ ] `useFinderOpen`: `invoke('opened_files')` returns paths → `onPaths` called
- [ ] `useFinderOpen`: `'opened-files'` event fires → `onPaths` called
- [ ] `DefaultHandlerPrompt` renders "Set as Default" + "No thanks" buttons
- [ ] "No thanks" → modal closes without calling `set_as_default_handler`

### Manual Verification (requires built + installed `.dmg`)
- [ ] Right-click `.jsx` in Finder → "Open With" → "JSX Viewer" in list
- [ ] Cold launch: double-click while app not running → app opens, file renders
- [ ] Warm launch: double-click while app running → new tab opens, no second window
- [ ] First-launch prompt appears once and only once
- [ ] "Set as Default" → subsequent double-click auto-opens in JSX Viewer

---

## Done Gate
- [ ] All Rust tests pass
- [ ] All frontend tests pass
- [ ] `.jsx` appears in "Open With" → JSX Viewer after fresh install
- [ ] Cold + warm open both work correctly
- [ ] First-launch prompt shown once; not shown again after dismiss
- [ ] `npm run tauri build` → `.dmg` installs and all above works

## Dependencies
- **Requires complete:** Phase 10 — Tauri Migration
- **Enables:** Phase 12 — Production Readiness

## Notes
- `rank: "Alternate"` in file association: JSX Viewer appears in Open With but does NOT steal the user's `.jsx` default (usually VS Code). Only "Set as Default" promotes it.
- Single-instance on macOS: handled natively by macOS — double-click while running routes to existing process via `RunEvent::Opened`. No `tauri-plugin-single-instance` needed on macOS.
- The `LSSetDefaultRoleHandlerForContentType` approach requires the app to be code-signed or running from Applications folder. Document this requirement.
- See DESIGN.md §A7 for complete behavior matrix (cold/warm, drag dock, multi-select, .tsx files).
