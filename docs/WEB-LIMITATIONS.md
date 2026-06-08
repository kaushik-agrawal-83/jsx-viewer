# Web Prototype Limitations

Known limitations of the web phase (phases 1–9). To be resolved in Phase 10 — Tauri Migration.

## File System Access

- **No file watching** — Files opened via drag-drop or browse dialog are read once. Changes to the file on disk are not reflected automatically. Requires Tauri's `notify` crate (Phase 13).
- **No persistent file paths** — The path stored is `file.name` (filename only, not an absolute path). Session restore re-reads files via `IOAdapter.readFile(fileName)`, which cannot locate files on reload in the web phase. Restored tabs show `MissingFile`. Tauri will resolve this with native FS access.
- **Browse dialog scope limited** — `<input type="file">` provides file content but not a stable filesystem path. Multi-file drag-drop works; directory watching does not.

## Watching / Badge

- **Watch count badge always 0** — The "watching" status (pulsing dot + badge) requires Tauri file-watch IPC events. Badge activates in Phase 13.

## Native Features

- **No native titlebar** — The macOS traffic-light buttons (🔴🟡🟢) are absent. The toolbar simulates the titlebar.
- **⌘B is DOM-only** — Registered via `document.addEventListener('keydown')`. Cannot be a system-level shortcut outside the browser tab.
- **No tray / dock icon** — Favicon is a placeholder SVG. Real icon ships with the Tauri bundle.
- **No auto-update** — Tauri plugin `tauri-plugin-updater` is wired in Phase 10.
