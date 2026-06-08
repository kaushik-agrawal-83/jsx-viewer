.PHONY: app dev check install clean open

# ── Primary target ──────────────────────────────────────────────────────────
# Build a production .dmg. Install it from frontend/src-tauri/target/release/bundle/dmg/
app: install
	cd frontend && npm run tauri build
	@echo ""
	@echo "✓ DMG ready:"
	@ls -1 frontend/src-tauri/target/release/bundle/dmg/*.dmg 2>/dev/null || true

# Open the output folder in Finder after building
open: app
	open frontend/src-tauri/target/release/bundle/dmg/

# ── Dev mode ────────────────────────────────────────────────────────────────
# Native Tauri window with hot-reload
dev: install
	cd frontend && npm run tauri dev

# ── Validation ──────────────────────────────────────────────────────────────
# Run all checks: TS, tests, lint (Rust checks require cargo in PATH)
check:
	cd frontend && npx tsc --noEmit
	cd frontend && npm test -- --run
	cd frontend && npm run lint
	@echo ""
	@echo "✓ TS, tests, lint all passed"
	@echo "  Rust: cd frontend/src-tauri && cargo clippy -- -D warnings && cargo test"

# ── Helpers ─────────────────────────────────────────────────────────────────
install:
	cd frontend && npm install

clean:
	rm -rf frontend/dist
	rm -rf frontend/src-tauri/target
