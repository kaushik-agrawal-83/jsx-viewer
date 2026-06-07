# Phase 2 — Pre-commit Hooks + CI

## Status
> ✅ COMPLETE  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Goal
Lock code quality gates before any feature work begins: local pre-commit hooks (lint,
type-check, test, conventional commit format) and GitHub Actions CI that mirror them
server-side. Broken code cannot reach `main`.

## Demo Checkpoint
- [ ] Make a commit with a bad message (e.g. `"wip"`) → commitlint blocks it
- [ ] Stage a TypeScript type error → `npm run pre-commit` fails locally
- [ ] Push a branch with a lint error → GitHub Actions CI fails, PR blocked
- [ ] `feat(phase-1): add docker scaffold` → all hooks pass, commit created

---

## Tasks

### Install husky + lint-staged + commitlint

- [ ] `cd frontend && npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional`
- [ ] Init husky: `npx husky init` → creates `.husky/` directory
- [ ] Add `"prepare": "husky"` to `frontend/package.json` scripts

### Commit-msg Hook (commitlint)

- [ ] `frontend/.husky/commit-msg`:
  ```sh
  #!/usr/bin/env sh
  npx --no -- commitlint --edit "$1"
  ```
- [ ] `frontend/commitlint.config.js`:
  ```js
  module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
      'type-enum': [2, 'always', [
        'feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'test', 'perf', 'ci', 'revert'
      ]],
      'scope-empty': [1, 'never'],        // warn (not error) if scope missing
      'subject-min-length': [2, 'always', 10],
    },
  };
  ```
- [ ] Valid format: `type(scope): description` e.g. `feat(phase-4): add transpile pipeline`
- [ ] Invalid formats that must be blocked: `"wip"`, `"fix stuff"`, `"PHASE 4"`

### Pre-commit Hook (lint + type-check on staged files)

- [ ] `frontend/.husky/pre-commit`:
  ```sh
  #!/usr/bin/env sh
  cd frontend
  npx lint-staged
  ```
- [ ] `frontend/package.json` — add `lint-staged` config:
  ```json
  {
    "lint-staged": {
      "src/**/*.{ts,tsx}": [
        "eslint --max-warnings 0",
        "bash -c 'npx tsc --noEmit'"
      ],
      "src/**/*.{ts,tsx,js,json,css}": [
        "prettier --check"
      ]
    }
  }
  ```
- [ ] Note: `tsc --noEmit` runs on whole project (not just staged files) — acceptable cost at project scale

### Linting + Formatting Config (if not already from Phase 1)

- [ ] `frontend/.eslintrc.cjs` — base config:
  ```js
  module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react-hooks'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react-hooks/recommended',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  };
  ```
- [ ] `frontend/.prettierrc`:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 100,
    "tabWidth": 2
  }
  ```
- [ ] `frontend/package.json` scripts:
  ```json
  {
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "type-check": "tsc --noEmit"
  }
  ```

### GitHub Actions — Frontend CI

- [ ] `.github/workflows/ci.yml`:
  ```yaml
  name: CI

  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]

  jobs:
    frontend:
      name: Frontend
      runs-on: ubuntu-latest
      defaults:
        run:
          working-directory: frontend

      steps:
        - uses: actions/checkout@v4

        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'
            cache-dependency-path: frontend/package-lock.json

        - name: Install dependencies
          run: npm ci

        - name: Type check
          run: npx tsc --noEmit

        - name: Lint
          run: npm run lint

        - name: Format check
          run: npm run format:check

        - name: Test
          run: npm test -- --run

    backend:
      name: Backend
      runs-on: ubuntu-latest
      defaults:
        run:
          working-directory: backend

      steps:
        - uses: actions/checkout@v4

        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'
            cache-dependency-path: backend/package-lock.json

        - name: Install dependencies
          run: npm ci

        - name: Type check
          run: npx tsc --noEmit

        - name: Lint
          run: npm run lint

        - name: Test
          run: npm test -- --run
  ```

### Rust CI (added in Phase 10 — note only)

> Rust jobs for `cargo clippy` and `cargo test` are added to this workflow in
> Phase 10 (Tauri Migration) when `frontend/src-tauri/` first exists.
> Placeholder comment in `ci.yml` marks where to add it.

- [ ] Add placeholder comment in `ci.yml` after `backend` job:
  ```yaml
  # rust: job added in Phase 10 (Tauri migration)
  ```

---

## Testing Requirements

### Manual Verification

**Test 1 — commitlint blocks bad message:**
```sh
cd frontend
git add .
git commit -m "wip"
# Expected: commitlint error: "subject may not be empty / type may not be empty"
```

**Test 2 — commitlint accepts good message:**
```sh
git commit -m "feat(phase-2): add pre-commit hooks and CI"
# Expected: commit created successfully
```

**Test 3 — lint-staged catches type error:**

Create `frontend/src/bad.ts`:
```ts
const x: string = 42;  // type error
export default x;
```
```sh
git add frontend/src/bad.ts
git commit -m "feat(test): trigger type error"
# Expected: pre-commit hook fails with TypeScript error, commit blocked
# Cleanup: delete bad.ts
```

**Test 4 — GitHub Actions passes on clean push:**
- Push this phase's changes on a branch
- Open PR → verify CI green on all jobs (frontend, backend)

---

## Done Gate
- [ ] `npx commitlint --from HEAD~1` passes on the phase commit
- [ ] `npm run lint` — zero errors: `cd frontend && npm run lint`
- [ ] `npm run type-check` — zero errors: `cd frontend && npm run type-check`
- [ ] `npm test -- --run` — all pass
- [ ] Bad commit message → blocked by commit-msg hook
- [ ] Type error in staged file → blocked by pre-commit hook
- [ ] GitHub Actions CI green on push to PR branch

## Dependencies
- **Requires complete:** Phase 1 — Docker Web Scaffold
- **Enables:** Phase 3 — Release Management, Phase 4 — Transpile Pipeline (parallel)

## Notes
- `lint-staged` runs only on staged files for lint/format. `tsc --noEmit` always scans the full project — no way to scope it to staged files with `tsc` alone. This is fine: the project is small and `tsc` is fast.
- `@commitlint/config-conventional` enforces the Angular/Conventional Commits spec. This is the format release-please (Phase 3) requires for automatic changelog generation.
- Husky `prepare` script runs on `npm install` — new contributors get hooks automatically.
- The `--run` flag on `npm test` prevents Vitest from starting in watch mode in CI.
- Backend `npm run lint` and `npm test` assume backend also has ESLint + Vitest configured (set up in Phase 1 along with the Express backend).
