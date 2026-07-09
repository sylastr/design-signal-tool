# Saffron UI Setup Guide

Setup guide for using the Saffron Design System in React / Next.js projects.

## Packages

```bash
pnpm add @thomsonreuters/saffron-core-components-prototyping-only \
         @thomsonreuters/saffron-core-styles-prototyping-only
```

- `@thomsonreuters/saffron-core-components-prototyping-only` — React wrappers for
  Saffron web components (Microsoft FAST elements). Import wrappers from the
  `/react` subpath; import types from the package root.
- `@thomsonreuters/saffron-core-styles-prototyping-only` — normalize, web fonts
  (Clario, Source Sans 3, Font Awesome), and all `--saf-*` design tokens.

## Stylesheet (import once, in the root layout)

The correct export path is `/index.css` — NOT `/dist/index.css`.

```tsx
// app/layout.tsx
import "@thomsonreuters/saffron-core-styles-prototyping-only/index.css"
import "./globals.css" // your custom CSS LAST
```

## Component imports

```tsx
import {
  SafButton, SafTextField, SafSelect, SafOption,
  SafCheckbox, SafRadio, SafRadioGroup, SafDialog,
} from "@thomsonreuters/saffron-core-components-prototyping-only/react"

import type { TextAppearance, ButtonAppearance } from
  "@thomsonreuters/saffron-core-components-prototyping-only"
```

## Critical: client-side only (no SSR)

Saffron components register against `customElements` on import, which throws
during SSR (`ReferenceError: document is not defined`). All Saffron usage MUST
run only in the browser. In the Next.js App Router:

```tsx
// A small client-only gate; render Saffron UI inside it.
"use client"
import { useEffect, useState } from "react"

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <>{children}</> : null
}
```

Alternatively, load the Saffron island via `next/dynamic` with `{ ssr: false }`
from within a Client Component (`"use client"` is required for that option).

## Design tokens

Saffron exposes CSS variables as `--saf-*`. Use them for all colors, spacing,
radius, and fonts — never hardcode.

- Color: `var(--saf-color-*)` — semantic aliases (`--saf-color-background-default`,
  `--saf-color-text-heavy`, `--saf-color-border-subtle`) plus named ramps
  (`--saf-color-sky-500`, `--saf-color-green-400`, …).
- Spacing: a numeric 4px scale — `--saf-spacing-1` (4px) … `--saf-spacing-4`
  (16px) … `--saf-spacing-10` (40px). There is no `-small`/`-medium`/`-large`.
- Radius: `--saf-border-radius-xxs|xs|sm|md|circle`.
- Fonts: applied by the stylesheet (Clario for headings, Source Sans 3 for body);
  use `SafText` with an `appearance` rather than setting font-family by hand.

There is a single light theme. Do NOT invent a dark mode or `[data-theme="dark"]`
overrides — Saffron does not ship one.

The one sanctioned hex literal is `themeColor` in the `viewport` export
(browser chrome color), which cannot reference a CSS variable:

```tsx
// value of --saf-color-sky-500; keep in sync if the token changes
export const viewport = { themeColor: "#0874e3" }
```

## Basic examples

```tsx
<SafTextField label="Email" type="email" required />
<SafButton appearance="primary" type="submit">Sign In</SafButton>
```

Button appearances are `primary | secondary | tertiary | inline`
(there is NO `outline` or `ghost`). Many components accept
`density="compact | standard"`.

### Dialog (slots, not compound children)

```tsx
<SafDialog open={isOpen}>
  <div slot="header">Confirm</div>
  <div slot="content">Are you sure you want to proceed?</div>
  <div slot="actions">
    <SafButton appearance="secondary" onClick={() => setIsOpen(false)}>Cancel</SafButton>
    <SafButton appearance="primary" onClick={confirm}>Confirm</SafButton>
  </div>
</SafDialog>
```

## Verify before you use — authority order

Confirm component names, props, slots, enum values, icon names, and tokens
against a source of truth, in this order:

1. **Ask Saffron MCP** — preferred authority (`get-saffron-code`,
   `get-saffron-components-list`, `get-saffron-tokens`, `get-saffron-a11y-attributes`).
   Use whenever reachable.
2. **Installed package** — if the MCP is unavailable, grep the installed
   `dist`/types (e.g. `TextAppearanceEnum` and `ButtonAppearanceEnum` in the
   `.d.ts` files, the React wrapper exports in `dist/esm/react.js`). These are
   authoritative when present.
3. **`[VERIFY]` flag** — if neither is available, do not guess. Mark the usage
   `[VERIFY]` and tell the user what you could not confirm.

Documentation here is a convenience, not the source of truth. If a doc and the
package disagree, the package wins.

## Troubleshooting

- **`document is not defined` / SSR crash** → Saffron ran on the server. Wrap it
  in the client-only boundary above.
- **`Package path ./dist/index.css is not exported`** → use
  `@thomsonreuters/saffron-core-styles-prototyping-only/index.css`.
- **Styles missing** → import the Saffron stylesheet before your own CSS, in the
  root layout.
- **Component renders nothing** → use the `Saf*` React wrapper from `/react`, not
  the raw `<saf-*>` web-component tag.

## Next steps

1. `available-components.md` — full list + canonical `TextAppearance` values
2. `component-reference.md` — component examples
3. `component-conventions.md` — prop conventions + coverage map
4. `icon-reference.md` — icon names
