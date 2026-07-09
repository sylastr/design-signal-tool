# Saffron Design System - Quick Reference

Expert guidance for Thomson Reuters Saffron Design System in React applications.
When this guidance is active, Saffron is the **canonical and only** UI source —
no shadcn/ui, Radix, Material, raw HTML controls, or Tailwind utility styling.

## Packages

```bash
npm install @thomsonreuters/saffron-core-components-prototyping-only \
            @thomsonreuters/saffron-core-styles-prototyping-only
```

- `@thomsonreuters/saffron-core-components-prototyping-only` — the components
  (FAST custom elements). Consume the React wrappers at the `/react` subpath.
- `@thomsonreuters/saffron-core-styles-prototyping-only` — normalize, web fonts
  (Clario, Source Sans 3, Font Awesome), and all `--saf-*` design tokens.

## Imports

```tsx
import { SafButton, SafTextField, SafDialog } from '@thomsonreuters/saffron-core-components-prototyping-only/react'
// Stylesheet, imported ONCE in the root layout:
import '@thomsonreuters/saffron-core-styles-prototyping-only/index.css'
```

Types (enums/prop types) come from the package root:

```tsx
import type { TextAppearance, ButtonAppearance } from '@thomsonreuters/saffron-core-components-prototyping-only'
```

## Key Points
- Components use the `Saf` prefix (SafButton, SafTextField, SafDialog).
- **NOT ShadCN/MUI** — Microsoft FAST web components via a React wrapper.
- **Use slots**, not compound children, for structured content.
- **Always use `--saf-*` design tokens**, never hardcode values.
- **Client-side only.** Components register against `customElements` on import,
  which throws during SSR. Keep all Saffron usage in a client-only boundary
  (`"use client"` + `next/dynamic` with `{ ssr: false }`).
- Saffron ships a **single light theme** — there is no dark mode; do not invent one.

## Stop signals — scan your diff before finishing

Each item is presumed wrong. Replace with the Saffron equivalent or justify it:

- `<table>` / `<thead>` / `<tbody>`     → `SafTable`
- `<nav>` sidebar                       → `SafSideNav` + `SafMenuItem`
- `<nav>` breadcrumb                    → `SafBreadcrumb` + `SafBreadcrumbItem`
- `<header>` (app chrome)               → `SafProductHeader`
- `<footer>` (app chrome)               → `SafFooter`
- `role="tab"` / tab strip              → `SafTabs` + `SafTab` + `SafTabPanel`
- `<button>`                            → `SafButton`
- `<div role="button">` card            → `SafActionCard`
- key/value summary of `<div>`s         → `SafDescriptionList`
- `<hr>` / bordered divider `<div>`     → `SafDivider`
- `<input>` / `<textarea>` / `<select>` → `SafTextField` / `SafSelect` / etc.
- `<a>` styled as a link                → `SafAnchor`
- `<img>` avatar                        → `SafAvatar`
- `className="ct-*"`                    → a real `Saf*` component
- a hex literal (`#...`)                 → `var(--saf-color-*)` (one exception below)
- `px` in a `style` prop / CSS          → `var(--saf-spacing-*)` / size props
- an `appearance` not in the canonical list → a valid `TextAppearance`

Note: hand-rolled CSS grid/flex for **page layout** is fine — Saffron ships no
layout primitives (`SafGrid`/`SafStack`/`SafFlex`/`SafBox`/`SafSplitLayout` do
not exist), so token-based CSS is the expected way to lay out a page. The only
shipped structural primitives are `SafContainer`, `SafDivider`, and
`SafLayoutGrid`/`SafLayoutGridItem`.

The one sanctioned hex literal: `themeColor` in `app/layout.tsx` viewport
metadata (browser chrome color), which cannot reference a CSS variable.

## Dialog Pattern (slots, not compound components)
```tsx
<SafDialog open={isOpen}>
  <div slot="header">Title</div>
  <div slot="content">Content</div>
  <div slot="actions">
    <SafButton>Cancel</SafButton>
  </div>
</SafDialog>
```

## Components that DON'T exist
Do NOT use: `SafModal`, `SafPopover`, `SafSkeleton`, `SafPrompt`,
`SafGrid`, `SafStack`, `SafFlex`, `SafBox`, `SafSplitLayout`.
Use instead: `SafDialog`, `SafTooltip`, `SafDrawer`, `SafAIPrompt`,
and token-based CSS (or `SafLayoutGrid`) for layout.

## Accessibility (WCAG 2.1 AA)
- Labels on all inputs (`label` or `aria-label`)
- Keyboard navigation (Tab/Enter/Space/Arrows)
- 4.5:1 contrast, 24×24px touch targets, visible focus indicators

```tsx
<SafTextField label="Email" required aria-describedby="hint" />
<SafButton iconOnly aria-label="Save"><SafIcon iconName="floppy-disk" aria-hidden /></SafButton>
```

## Design Tokens
```tsx
// WRONG: hardcoded values
<div style={{ color: '#008a00', padding: '16px' }} />

// CORRECT: use tokens (spacing is a numeric scale, e.g. --saf-spacing-4 = 16px)
<div style={{ color: 'var(--saf-color-primary)', padding: 'var(--saf-spacing-4)' }} />
```

## Verify before you use
Confirm component names, props, enum values, icon names, and token names against
source before using them, in this order of authority:
1. The **Ask Saffron MCP** (`get-saffron-code`, `get-saffron-components-list`,
   `get-saffron-tokens`, etc.).
2. The installed package's `dist` / type declarations.
3. If still unverifiable, do not guess — flag it `[VERIFY]` and tell the user.

## Reference files
- `component-reference.md` — examples
- `available-components.md` — full list + canonical `TextAppearance` values
- `component-conventions.md` — prop conventions + coverage map
- `icon-reference.md` — icon names
- `saffron-setup.md` — setup + verification order
