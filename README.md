# JSX Viewer

A native macOS app for previewing `.jsx` and `.tsx` components instantly — drag a file in, see it render. React, Tailwind, Recharts, Lucide, and shadcn/ui are pre-bundled; no install required.

## Supported Libraries

| Import | Library |
|---|---|
| `react`, `react-dom` | React 18 |
| `lucide-react` | Lucide icons |
| `recharts` | Recharts |
| `tailwindcss` (via CDN) | Tailwind CSS |
| `@radix-ui/react-slot` | Radix slot |

Unknown imports render as a visible placeholder — the app never crashes on a missing library.

---

## Make Workflows

All commands run from the project root.

| Command | When to use |
|---|---|
| `make dev` | **Daily development.** Opens native Tauri window with hot-reload. Frontend changes reflect instantly (Vite HMR); Rust changes recompile automatically (~10–30s). |
| `make app` | **Ship a build.** Full production compile → `.dmg` in `frontend/src-tauri/target/release/bundle/dmg/`. Takes a few minutes. |
| `make open` | Same as `make app`, then opens the DMG folder in Finder. |
| `make check` | **Before committing.** Runs TS type-check, all tests, and lint. Prints the Rust command to run separately (requires `cargo` in PATH). |
| `make install` | Install/update npm dependencies only. |
| `make clean` | Delete `dist/` and `target/` to force a clean rebuild. |

### Choosing between `make dev` and `make app`

Use `make dev` for everything except:
- Testing Finder "Open With" / file association behaviour
- Testing the first-launch "Set as Default" prompt
- Verifying the DMG install or uninstall

Those require a bundled `.app` installed in `/Applications` and won't work in dev mode.

---

## Development

### Web dev mode (Docker)

**Prerequisites:** Docker Desktop

```bash
docker-compose up
```

Open [http://localhost:5173](http://localhost:5173). The backend runs at port 3001. File watching uses the browser File System Access API — you must grant permission when prompted.

> Note: `docker-compose.yml` and `backend/` are web-dev-only scaffolding. They are not used in the native Tauri app.

### Tauri dev mode (native)

**Prerequisites:** Rust (stable), Node.js 20+, Xcode Command Line Tools

```bash
cd frontend
npm install
npm run tauri dev
```

The app opens as a native macOS window with full file system access and OS-level drag-and-drop.

---

## Build

### Produce a `.dmg`

```bash
cd frontend
npm run tauri build
```

Output: `frontend/src-tauri/target/release/bundle/dmg/JSX Viewer_0.1.0_x64.dmg`

### Code signing (required for distribution)

Unsigned builds work for local use. To distribute via GitHub Releases or share with others, macOS Gatekeeper requires code signing and notarization:

1. Enroll in the Apple Developer Program
2. Set environment variables before building:
   ```bash
   export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
   export APPLE_ID="you@example.com"
   export APPLE_PASSWORD="app-specific-password"
   export APPLE_TEAM_ID="TEAMID"
   ```
3. Run `npm run tauri build` — Tauri handles signing and notarization automatically

> `LSSetDefaultRoleHandlerForContentType` (used by the "Set as Default" prompt) also requires the app to be code-signed and installed in `/Applications`.

---

## Known Limitations

- **Web mode file watching** requires the browser File System Access API (Chrome/Edge only; not available in Safari or Firefox).
- **"Set as Default" prompt** requires a signed build installed in `/Applications` to take effect.
- Components that import native Node.js modules or make network requests will not render.
