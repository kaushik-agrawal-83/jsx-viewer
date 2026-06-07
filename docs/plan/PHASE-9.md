# Phase 9 — Sidebar Collapse + Polish

## Status
> 🔲 NOT_STARTED  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Goal
Complete sidebar collapse to icon rail (⌘B toggle), all visual polish (dot animations,
drag highlights, watch count badge, tab dot flash, session restore on reload), and a
clean "web prototype complete" state ready for Tauri migration in Phase 10.

## Demo Checkpoint
This phase completes the web prototype. A human should be able to:
- [ ] Press ⌘B → sidebar collapses to 44px icon rail showing dots only
- [ ] Hover over dot in collapsed rail → tooltip shows filename
- [ ] Press ⌘B again → sidebar expands
- [ ] Drag file onto collapsed rail → browse dialog opens (no drop zone visible)
- [ ] Watch count badge in toolbar shows correct count (# of actively watched files)
- [ ] Tab dot flashes briefly on file-change reload
- [ ] Dragging a file over the viewer → viewer dims to 50% opacity
- [ ] Session fully restores on reload: tabs, sidebar state, pane mode/ratio

---

## Tasks

### Sidebar Collapsed Icon Rail
- [ ] `Sidebar.tsx` — when `collapsed: true`:
  - Width fixed at 44px
  - Show vertical rail of `StatusDot` components (one per open file)
  - Each dot wrapped in `Tooltip` (hover → filename shown at right of rail)
  - Bottom of rail: `↓` icon (Lucide `Download`) → click opens `<input type="file">` browse dialog
  - `⊞` toggle icon at top (Lucide `PanelLeftOpen`) → calls `expand()`
- [ ] `Tooltip` component (if not already built):
  - Appears to the right of the dot on hover
  - `body-sm` text, `neutral-900` bg, `surface` text, `border-radius: md`
  - 200ms delay before show (no flicker on mouse pass)
  - Uses CSS positioning (no portal needed at this scale)

### ⌘B Keyboard Shortcut
- [ ] `frontend/src/hooks/useKeyboardShortcuts.ts`:
  - `useEffect` with `keydown` listener on `document`
  - `metaKey + key === 'b'` → `useSidebar.toggle()`
  - Clean up on unmount
- [ ] Wire into `App.tsx`

### Watch Count Badge
- [ ] `ViewerToolbar.tsx` — compute `watchingCount`:
  - Count tabs across both panes where `status === 'ok'` AND watching is enabled for that path
  - Display: `{n} watching` in `accent` color badge if `n > 0`; hidden if `n === 0`

### Tab Dot Flash Animation
- [ ] On file-change event, `useTabs.updateTabStatus(id, 'loading')` for 200ms then update to result
- [ ] `StatusDot` for `loading` state: fast pulse CSS animation (0.8s ease-in-out)
- [ ] After 200ms: update to `ok` or `error` based on transpile result

### Drag Highlight Polish
- [ ] `App.tsx` or top-level wrapper: listen for `dragover` on entire window
- [ ] If dragging `.jsx` file over viewer area (not sidebar): dim viewer to `opacity: 0.5`
- [ ] If dragging over sidebar: sidebar highlights (dashed `primary` border, `primary-subtle` bg)
- [ ] `dragleave` / `drop` → restore both to normal
- [ ] Drop zone text during drag: "Dropping: {filename}" if filename detectable

### Session Restore Completeness Audit
- [ ] `localStorage` keys verified (reference DESIGN.md §13 schema exactly):
  - `sidebar.width`, `sidebar.collapsed`
  - `panes.mode`, `panes.leftRatio`
  - `tabs.left` (array of paths), `tabs.right`, `tabs.activeLeft`, `tabs.activeRight`
- [ ] Reload sequence:
  1. Read sidebar state → apply width/collapsed
  2. Read panes state → apply mode/ratio
  3. Read tab paths → reconstruct tab objects (status: loading)
  4. Re-read each file via IOAdapter → update source + status
  5. All done → no empty flicker

### Final Polish Items
- [ ] `EmptyPane` — shown when pane has no tabs; Phase 0 styled (centered icon + text)
- [ ] `+` tab button tooltip: "Open file…"
- [ ] Sidebar section headers only show when section is non-empty
- [ ] Document title: `{activeFileName} — JSX Viewer` when file open; `JSX Viewer` otherwise
- [ ] Favicon: use the app icon (placeholder SVG ok for web phase)
- [ ] `body` background: `neutral-50` (no white flash on load)

---

## Testing Requirements (Vitest)

### Unit — `useKeyboardShortcuts.test.ts`
- [ ] `metaKey + b` event → `toggle()` called
- [ ] Other key combinations → not triggered

### Component — `Sidebar.test.tsx` (collapsed state)
- [ ] Width = 44px when `collapsed: true`
- [ ] Dots visible, filenames NOT visible in collapsed state
- [ ] Tooltip content matches filename

### Manual Verification (full web prototype smoke test)
- [ ] ⌘B collapse/expand
- [ ] Drag drop → dim viewer → drop → render
- [ ] Tab flash on file save
- [ ] Session restore across full reload (sidebar + panes + tabs)
- [ ] Watch count badge accurate

### Test Fixtures — Full Smoke Sequence

Use these files to run through all 5 UX states from DESIGN.md §6 in one pass.

**Step 1** — open `kpi-cards.jsx` (from Phase 5 fixtures). Verifies: state ① sidebar expanded, single pane renders.

**Step 2** — ⌘B to collapse. Verifies: state ② icon rail shows one dot, hover tooltip shows "kpi-cards.jsx".

**Step 3** — drag `broken-syntax.jsx` (from Phase 5 fixtures) onto the collapsed rail (browse dialog should open). Verifies: state ③ drag highlight, then red dot for error file.

**Step 4** — click `⊟ Split`, then browse-open `split-left.jsx` (from Phase 8 fixtures) in right pane. Verifies: state ④ both panes render different files.

**Step 5** — replace right pane file with `split-right.jsx` (Phase 8 error fixture). Verifies: state ⑤ right pane shows error card, left pane unaffected.

**Session restore** — after Step 4 (both panes populated), reload page (`⌘R`). Expected: both tabs restored, left pane renders, right pane shows "File not found" or re-renders if file still accessible.

---

## Done Gate
- [ ] All tests passing: `cd frontend && npm test`
- [ ] Zero TypeScript errors
- [ ] ⌘B shortcut works
- [ ] Collapsed rail shows dots + tooltips
- [ ] Watch count badge accurate
- [ ] Drag highlights correct (sidebar vs viewer)
- [ ] Session fully restores on reload
- [ ] `docker-compose up` → full app functional in browser
- [ ] **Web prototype is feature-complete per DESIGN.md**

## Dependencies
- **Requires complete:** Phase 8 — Split View
- **Enables:** Phase 10 — Tauri Migration

## Notes
- After this phase the web prototype is done. Do a full manual walkthrough of all 5 UX states from DESIGN.md §6 before marking complete.
- Document any known web-only limitations (e.g., "file watching requires Browse, not drag-drop") in a `docs/WEB-LIMITATIONS.md` file for reference when doing the Tauri migration in Phase 10.
- Check that `docker-compose up` still works cleanly after all the changes in Phases 3–8.
