# Phase 0 — UX Design Freeze

## Status
> ✅ COMPLETE  
> Agent: update → 🔄 IN_PROGRESS → ✅ COMPLETE

## Goal
Lock all visual design decisions before any code is written. Every subsequent phase
references this document for UI consistency.

## Design Inspiration
- **opendesigner.io** — dark base `#1a1a1a`, rust `#cc6633` accent, flat functional, high contrast
- **trellis** — glass sidebar `bg-slate-900/40 backdrop-blur-3xl`, blue active-indicator strip, gradient blobs, colored dot shadows, `rounded-xl` elements
- **existing mockup** (`docs/jsx-viewer-finder-mockup.html`) — deep dark navy `#0a0a0d`, indigo `#5a6add`, macOS Finder chrome language, heavy shadows `0 24px 60px rgba(0,0,0,0.6)`

**Resulting aesthetic: dark glass.** Deep dark shell, frosted-glass sidebar, indigo primary, warm rust for CTAs, trellis-style left-edge active indicator and colored dot shadows.

---

## Color Palette

### Foundation (dark-first)
| Token | Hex / Value | Usage |
|-------|-------------|-------|
| `app-bg` | `#080810` | Root `<body>` background |
| `surface` | `#0f0f1c` | Viewer pane background |
| `surface-raised` | `#141428` | Cards, menus, dropdowns |
| `surface-glass` | `rgba(255,255,255,0.04)` + `backdrop-blur-xl` | Sidebar, toolbar |
| `border` | `rgba(255,255,255,0.08)` | All dividers, edges |
| `border-strong` | `rgba(255,255,255,0.14)` | Active pane ring, focused elements |

### Primary — Indigo (from mockup's `#5a6add`, brightened for dark bg)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#818cf8` | Active tabs, watch dot, active indicator strip |
| `primary-dark` | `#6366f1` | Hover on primary buttons |
| `primary-glow` | `rgba(129,140,248,0.15)` | Active list item bg, drop zone fill |
| `primary-ring` | `rgba(129,140,248,0.35)` | Focus rings, active pane border |

### Accent Warm — Rust (from opendesigner's `#cc6633`)
| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#f97316` | "Set as Default" CTA, first-launch prompt primary button |
| `accent-glow` | `rgba(249,115,22,0.15)` | Accent button hover bg |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#4ade80` | OK status dot |
| `success-glow` | `rgba(74,222,128,0.20)` | OK dot shadow |
| `error` | `#f87171` | Error tab, error dot, error card border |
| `error-glow` | `rgba(248,113,113,0.20)` | Error dot shadow |
| `error-subtle` | `rgba(248,113,113,0.10)` | Error card background |
| `warning` | `#fb923c` | Loading dot fast-pulse |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#f1f5f9` | Headings, active filenames, focused tab label |
| `text-secondary` | `#94a3b8` | Inactive tab labels, secondary UI text |
| `text-muted` | `#475569` | Section headers (OPEN / RECENT), placeholder text |
| `text-mono` | `#a5b4fc` | Error messages, file paths (indigo-300 on dark) |

---

## Glassmorphism Spec (Sidebar + Toolbar)

```css
/* Sidebar panel */
background: rgba(255, 255, 255, 0.04);
backdrop-filter: blur(24px) saturate(180%);
-webkit-backdrop-filter: blur(24px) saturate(180%);
border-right: 1px solid rgba(255, 255, 255, 0.08);

/* Toolbar */
background: rgba(8, 8, 16, 0.80);
backdrop-filter: blur(12px);
border-bottom: 1px solid rgba(255, 255, 255, 0.07);

/* Dropdown / context menus */
background: rgba(20, 20, 40, 0.85);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.10);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.60);
```

**Decorative gradient blob (sidebar)** — from trellis:
```css
/* Positioned absolute in sidebar bottom-left corner */
background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
width: 200px; height: 200px;
filter: blur(40px);
pointer-events: none;
```

---

## Typography

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| `heading-xl` | 18px | 600 | App title in toolbar |
| `heading-lg` | 13px | 600 | Section labels (OPEN, RECENT) — uppercase, letter-spacing 0.08em |
| `heading-md` | 14px | 500 | Tab labels, active filename |
| `body-md` | 14px | 400 | Default sidebar text, file list items |
| `body-sm` | 12px | 400 | Status captions, tooltip text, watch count badge |
| `mono` | 13px | 400 | Error messages, file paths |

- **Heading + Body font:** `Inter` (weights 400, 500, 600) — Google Fonts
- **Mono font:** `JetBrains Mono` (weight 400) — Google Fonts, fallback `monospace`
- Section labels: uppercase, `letter-spacing: 0.08em`, `text-muted` color (matches trellis style)

---

## Active Indicator Strip (from trellis)

Sidebar file items and nav items use a **left-edge vertical bar** for active state:

```css
/* Left edge strip — absolute positioned inside file list item */
width: 2px;
height: 24px;
background: #818cf8;   /* primary */
border-radius: 0 2px 2px 0;
left: 0;
top: 50%;
transform: translateY(-50%);
```

Combined with active item background:
```css
background: rgba(129, 140, 248, 0.15);  /* primary-glow */
border-radius: 8px;  /* rounded-lg */
```

---

## Status Dot Spec (with colored shadows from trellis)

| State | Color | Shadow | Animation |
|-------|-------|--------|-----------|
| Watching + OK | `primary` `#818cf8` | `0 0 6px rgba(129,140,248,0.50)` | Slow pulse 2s |
| OK, not watching | `success` `#4ade80` | `0 0 6px rgba(74,222,128,0.40)` | None |
| Error | `error` `#f87171` | `0 0 6px rgba(248,113,113,0.40)` | None |
| Loading | `warning` `#fb923c` | None | Fast pulse 0.8s |
| Recent (closed) | `#334155` (slate-700) | None | None |

Dot size: **8px** diameter, `border-radius: 9999px`.

Pulse keyframe:
```css
@keyframes dot-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
  50%       { opacity: 0.5; box-shadow: 0 0 2px currentColor; }
}
```

---

## Spacing & Sizing Tokens

- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Sidebar expanded width: 200px (min 140px, max 320px)
- Sidebar collapsed width: 44px
- Tab strip height: 36px
- Viewer toolbar height: 44px (slightly taller for breathing room)
- Drop zone height: 80px
- Pane divider width: 4px (hover expands to 6px)
- Border radius: `sm`=4px, `md`=8px, `lg`=12px, `xl`=16px, `full`=9999px
- Shadows (calibrated for dark):
  - `sm`: `0 1px 3px rgba(0,0,0,0.40)`
  - `md`: `0 4px 12px rgba(0,0,0,0.50)`
  - `lg`: `0 10px 30px rgba(0,0,0,0.60)`
  - `xl`: `0 24px 60px rgba(0,0,0,0.70)` — modals, menus (from mockup)

---

## Component Inventory

### Base Components
- [ ] Button — variants: `primary` (indigo), `accent` (rust), `ghost`, `icon`, `destructive`
- [ ] Tooltip (hover → filename in collapsed rail; 200ms delay)
- [ ] Toast (Finder-open notification; glass style)
- [ ] StatusDot (8px dot + colored shadow per state above)
- [ ] Badge (watch count; `primary-glow` bg, `primary` text)
- [ ] Divider (`border` color, 1px)

### App-Specific Components
- [ ] Sidebar — glass panel, expanded / collapsed / hidden states + gradient blob
- [ ] FileList — Open section + Recent section with uppercase section labels
- [ ] FileListItem — active indicator strip + dot + filename + ×
- [ ] DropZone — dashed `border-primary/30` normal, `border-primary` on drag + `primary-glow` fill
- [ ] SidebarHandle — 3px target, `cursor: col-resize`
- [ ] ViewerToolbar — glass bar, Single/Split toggle pills, watch count badge
- [ ] PaneContainer — flex row housing pane(s) + divider
- [ ] Pane — focused ring `border-primary-ring`, tab strip + preview area
- [ ] PaneDivider — 4px, `cursor: col-resize`, hover `bg-primary/40`
- [ ] TabStrip — horizontal scroll row, glass bg
- [ ] Tab — indicator dot + filename + × (active: bottom border `2px solid primary`)
- [ ] Preview — dark `surface` bg, renders artifact
- [ ] ErrorDisplay — glass card, `error` left border 3px, error-subtle bg, `text-mono` message
- [ ] EmptyPane — centered drop hint, `text-muted`
- [ ] DefaultHandlerPrompt — modal, glass card, centered (Phase 10)

---

## Screen Wireframes

All screens: dark `#080810` root, glass sidebar, dark `#0f0f1c` viewer.

### ① Default — Sidebar expanded, single pane

```
┌──────────────────────────────────────────────────────────────────┐  app-bg #080810
│  [glass toolbar: blur+dark]     ⚛ JSX Viewer      [⊞ ][⊟ ]    │  44px
├──────────────────────────────────────────────────────────────────┤
│ GLASS SIDEBAR (200px)         │ VIEWER (surface #0f0f1c)         │
│ rgba(255,255,255,0.04)        │                                  │
│ backdrop-blur: 24px           │  [●tab][●tab][+]          36px  │
│                               ├──────────────────────────────────│
│  OPEN ←(muted uppercase)      │                                  │
│  ■  dashboard.jsx       ×     │   [rendered JSX artifact        │
│  ●  chart-widget.jsx    ×     │    on dark surface bg]          │
│                               │                                  │
│  RECENT                       │                                  │
│  ·  auth-form.jsx             │                                  │
│  ·  kpi-cards.jsx             │                                  │
│                               │                                  │
│  ┌──────────────────────┐     │                                  │
│  │ ↓  Drop .jsx here    │     │                                  │
│  │ dashed primary/30    │     │                                  │
│  └──────────────────────┘     │                                  │
│  ░░ gradient blob (corner) ░░ │                                  │
└─────────────────────3px──────┴──────────────────────────────────┘
                       ↑ handle

■ = active indicator strip (primary left border) + primary-glow bg
● = status dot with colored shadow
```

### ② Sidebar collapsed to icon rail

```
┌────────────────────────────────────────────────────────────────┐
│ [glass toolbar]                                        [⊞][⊟] │
├────────────────────────────────────────────────────────────────┤
│[44px glass]│  VIEWER FULL WIDTH                                │
│ ▶  ← expand│  [●tab][●tab][+]                                 │
│ ■  ← primary│  ──────────────────────────────                 │
│ ●           │  [rendered]                                      │
│ ●           │                                                  │
│ ·           │                                                  │
│ ↓           │                                                  │
└─────────────┴──────────────────────────────────────────────────┘
```

### ③ Drag active

```
┌──────────────────────────────────────────────────────────────────┐
│ [toolbar]                                                        │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR:                        │ VIEWER (opacity: 0.35)         │
│ border: 1.5px dashed primary    │                                │
│ bg: primary-glow                │  [dimmed — drawn back]         │
│                                 │                                │
│  ↓ Dropping: my-widget.jsx      │                                │
│                                 │                                │
│  ┌──────────────────────────┐   │                                │
│  │  primary dashed border   │   │                                │
│  └──────────────────────────┘   │                                │
└─────────────────────────────────┴──────────────────────────────┘
```

### ④ Split view

```
┌──────────────────────────────────────────────────────────────────┐
│ [toolbar]                               [⊞ Single ][⊟ Split ●] │
├──────────────────────────────────────────────────────────────────┤
│[44px]│ LEFT PANE                │4px│ RIGHT PANE                 │
│      │ ring: primary-ring       │↕↕ │ ring: border (unfocused)   │
│  ■   │ [■tab][tab][+]           │   │ [●tab][+]            [⊠]  │
│  ●   │ ───────────────────────  │   │ ──────────────────────────│
│  ●   │ [rendered]               │   │ [rendered]                │
└──────┴──────────────────────────┴───┴───────────────────────────┘
                           ↑ hover → bg-primary/40
```

### ⑤ Error state

```
┌──────────────────────────────────────────────────────────────────┐
│ [toolbar]                                                        │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR              │  [●tab][✕ broken.jsx — error red][+]     │
│  ✕ broken.jsx        │  ───────────────────────────────────────  │
│  (error dot +glow)   │  ┌────────────────────────────────────┐  │
│                      │  │ border-left: 3px solid #f87171     │  │
│                      │  │ bg: rgba(248,113,113,0.10)          │  │
│                      │  │ ✕  SyntaxError                     │  │
│                      │  │    Unexpected token (line 12:4)    │  │
│                      │  │    [text-mono #a5b4fc]             │  │
│                      │  └────────────────────────────────────┘  │
└──────────────────────┴──────────────────────────────────────────┘
```

---

## Tailwind Config — Extended Tokens

All the tokens above mapped to `tailwind.config.ts` extensions:

```ts
extend: {
  colors: {
    'app-bg': '#080810',
    surface: {
      DEFAULT: '#0f0f1c',
      raised: '#141428',
    },
    primary: {
      DEFAULT: '#818cf8',
      dark: '#6366f1',
      glow: 'rgba(129,140,248,0.15)',
      ring: 'rgba(129,140,248,0.35)',
    },
    accent: {
      DEFAULT: '#f97316',
      glow: 'rgba(249,115,22,0.15)',
    },
    success: {
      DEFAULT: '#4ade80',
      glow: 'rgba(74,222,128,0.20)',
    },
    error: {
      DEFAULT: '#f87171',
      glow: 'rgba(248,113,113,0.20)',
      subtle: 'rgba(248,113,113,0.10)',
    },
    warning: '#fb923c',
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
      muted: '#475569',
      mono: '#a5b4fc',
    },
  },
  backdropBlur: {
    xs: '4px',
    glass: '24px',
  },
  boxShadow: {
    'dot-primary': '0 0 6px rgba(129,140,248,0.50)',
    'dot-success':  '0 0 6px rgba(74,222,128,0.40)',
    'dot-error':    '0 0 6px rgba(248,113,113,0.40)',
    'xl-dark':      '0 24px 60px rgba(0,0,0,0.70)',
    'menu':         '0 8px 32px rgba(0,0,0,0.60)',
  },
  keyframes: {
    'dot-pulse': {
      '0%, 100%': { opacity: '1' },
      '50%':      { opacity: '0.4' },
    },
  },
  animation: {
    'dot-pulse-slow': 'dot-pulse 2s ease-in-out infinite',
    'dot-pulse-fast': 'dot-pulse 0.8s ease-in-out infinite',
  },
}
```

---

## Assets Checklist

- [ ] App icon — ⚛ atom on `#080810` background, indigo `#818cf8` ring glow — `icon.svg`, `icon.png` (1024×1024)
- [ ] Favicon — 16×16, 32×32 from icon
- [ ] JSX document icon for Finder — `jsx-doc.icns` (16, 32, 128, 256, 512px) — Phase 10
- [ ] Fonts — Google Fonts: `Inter` 400/500/600, `JetBrains Mono` 400
- [ ] Icons library — `lucide-react` (already in registry)

---

## Done Gate

- [ ] All color tokens documented with hex codes
- [ ] Glass/blur CSS rules specified (not just color names)
- [ ] Tailwind config extension table complete
- [ ] Typography scale complete with font families named
- [ ] Active indicator strip spec documented
- [ ] Status dot colored-shadow spec documented
- [ ] All 5 major screens wireframed
- [ ] Component inventory finalized
- [ ] Gradient blob decorative element specified
- [ ] Asset list defined
- [ ] No open UX questions remain (or explicitly deferred)
