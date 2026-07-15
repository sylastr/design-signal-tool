export type Tier = "must-fix" | "should-consider" | "nice-to-have"

/** The three text paragraphs that make up a single suggestion card. */
export type SectionKey = "observation" | "rationale" | "suggested_action"

/** Platform-level analysis preferences configured in Settings → Analysis. */
export interface AnalysisPrefs {
  /** Which severity tiers are included in results. */
  tiers: Record<Tier, boolean>
  /** Which paragraphs render on each suggestion card. */
  sections: Record<SectionKey, boolean>
  /** Max number of suggestions the AI can return (1-7). */
  maxSuggestions: number
}

/** Display order + labels for the tier toggles. */
export const TIER_ORDER: { key: Tier; label: string }[] = [
  { key: "must-fix", label: "Must-fix" },
  { key: "should-consider", label: "Should-consider" },
  { key: "nice-to-have", label: "Nice-to-have" },
]

/** Display order + labels/descriptions for the paragraph toggles. */
export const SECTION_ORDER: { key: SectionKey; label: string; description: string }[] = [
  { key: "observation", label: "Observation", description: "The headline finding — what was observed." },
  { key: "rationale", label: "Rationale", description: "The reasoning and context grounding the finding." },
  {
    key: "suggested_action",
    label: "Suggested action",
    description: "The concrete next step to take.",
  },
]

export interface Annotation {
  number: number
  location: { x: number; y: number; w: number; h: number } // 0-1 normalized; x,y = center
  tier: Tier
  skill: string
  observation: string
  rationale: string
  suggested_action: string
}

export interface AnalysisResult {
  artifact_summary: string
  /** Punchy 2-3 sentence executive verdict on the whole review, for a quick assessment. */
  feedback_summary?: string
  /** 3-5 ultra-short action cues telling the designer what to change. */
  consider?: string[]
  annotations: Annotation[]
}

export interface Artifact {
  id: string
  name: string
  dataUrl: string // in-memory only, not persisted
}

export interface Skill {
  id: string
  name: string
  /** One-line summary of what the lens evaluates, shown on selection cards. */
  description?: string
  instructions: string
  /** Selected for the current analysis run (per-session, chosen in the wizard). */
  active: boolean
  custom?: boolean
  /** Hidden from the wizard at a platform level via Setup. Distinct from active. */
  hidden?: boolean
  /** True when a built-in skill has been customized (has a saved override). */
  edited?: boolean
}

export interface SavedContext {
  id: string
  name: string
  text: string
  /** Hidden from the wizard at a platform level via Setup. */
  hidden?: boolean
  /**
   * Where the entry is managed. "global" entries are created/edited in
   * Settings and are read-only in the wizard; "local" entries are created in
   * the wizard and fully editable there. Missing = global (legacy entries).
   */
  scope?: "global" | "local"
}

/* Real, opinionated instruction blocks — these are composed into the system prompt.
   All skills start inactive: the stepped flow requires the user to deliberately
   pick at least one lens before analysis, which keeps critiques focused instead
   of generic. */
export const DEFAULT_SKILLS: Skill[] = [
  {
    id: "heuristic",
    name: "Heuristic Usability",
    description: "Checks the design against Nielsen's 10 usability heuristics.",
    active: false,
    instructions:
      "Evaluate against Nielsen's 10 usability heuristics: (1) Visibility of system status, (2) Match between system and the real world, (3) User control and freedom, (4) Consistency and standards, (5) Error prevention, (6) Recognition rather than recall, (7) Flexibility and efficiency of use, (8) Aesthetic and minimalist design, (9) Help users recognize, diagnose, and recover from errors, (10) Help and documentation. Name the specific heuristic each observation violates or upholds.",
  },
  {
    id: "a11y",
    name: "Accessibility (WCAG 2.1 AA)",
    description: "Audits contrast, focus, target size, and WCAG 2.1 AA criteria.",
    active: false,
    instructions:
      "Audit against WCAG 2.1 AA. Check color contrast (4.5:1 for normal text, 3:1 for large text and UI components), visible focus indicators, target size (min 24x24px), text alternatives for non-text content, information not conveyed by color alone, logical heading/reading order, and form labels. Cite the specific success criterion (e.g. 1.4.3 Contrast, 2.4.7 Focus Visible, 1.4.1 Use of Color) for each finding.",
  },
  {
    id: "hierarchy",
    name: "Visual Hierarchy & Layout",
    description: "Assesses Gestalt grouping, typographic scale, and scanning order.",
    active: false,
    instructions:
      "Assess visual hierarchy and layout using Gestalt principles (proximity, similarity, common region, continuity, figure/ground) and typographic scale. Evaluate whether the primary action is the most salient element, whether grouping reflects real relationships, whether alignment and spacing follow a consistent grid, and whether contrast and size guide the eye in priority order. Flag competing focal points and weak scanning paths.",
  },
  {
    id: "tr-brand",
    name: "Saffron Design System",
    description:
      "Checks a screen against Thomson Reuters' Saffron design system — color, typography, spacing, iconography, navigation, and component consistency.",
    active: false,
    instructions: `You are evaluating a screenshot against Saffron, Thomson Reuters' design system. You only have the image and whatever project context has been provided — no access to the Figma file, no component/layer inspection, no token bindings. Every finding must be something a reviewer could actually see by looking at the screenshot. Do not assert facts you can't verify from the image (e.g. don't claim "this hex is hardcoded, not token-bound" — you can't see that. Instead say "this color doesn't match Saffron's documented palette" or "this looks visually inconsistent with the token below").

If a finding could plausibly be an intentional exception, say so and lower the tier rather than flagging it as must-fix. When in doubt, hedge — a wrong "this violates Saffron" is worse than a missed one.

This skill covers brand and design-system conventions only. Contrast/WCAG conformance belongs to the Accessibility skill — don't duplicate it here beyond noting if a color choice plausibly reads as low-contrast.

### Color
Saffron's core palette (compare observed colors against these; treat as "should read as close to," not pixel-exact — you're eyeballing a screenshot, not sampling pixels):

| Purpose | Token | Hex |
|---|---|---|
| Heavy text | text/heavy | #212223 |
| Strong text | text/strong | #404040 |
| Subtle text | text/subtle | #666666 |
| Disabled text | text/disabled | #8a8a8a |
| Knockout (on-dark) text | text/knockout | #ffffff |
| Default background | bg/default | #fcfcfc |
| Subtle background | bg/subtle | #f7f7f7 |
| Strong background | bg/strong | #f2f2f2 |
| Inverse background | bg/inverse | #212223 |
| Subtle border | border/subtle | #e5e5e5 |
| Strong border | border/strong | #d2d2d2 |
| Stronger border | border/stronger | #8a8a8a |
| Success | status/success | #387c2b (bg #eaffe5) |
| Warning | status/warning | #ab3300 (bg #fff8e5) |
| Info | status/info | #0062c4 (bg #edf6ff) |
| Primary interactive (Racing Green) | interactive/primary | #123021 (hover #1d4b34) |
| Accent orange | core/orange/500 | #d64000 |
| Accent orange (hover/pressed) | core/orange/600 | #ab3300 |
| Accent orange, deep | core/orange/800 | #561a00 |
| Accent orange, tint | core/orange/100 | #f8eadd |

Rules to check visually:
- **60/30/10 balance.** Background neutrals dominate (~60% of the surface), Racing Green is the secondary structural color (~30%, e.g. dark headers, nav, inverse cards), orange is a light accent reserved for primary actions and active states (~10%). Flag a screen where orange is spread across many elements decoratively, appears as a background fill rather than an accent, or is absent from the screen's actual primary action.
- **Orange is applied through the brand tier, not raw.** Orange should show up specifically as button fills, links, active-state indicators, or small accent details — not as a general decorative color (e.g. large orange banners, orange body text, orange icons used purely for style). Flag decorative-only orange use as a should-consider.
- **One orange primary action per view.** Multiple orange-filled buttons competing for attention in the same view is a must-fix — Saffron expects a single clear primary CTA with secondary/tertiary actions styled more quietly.
- **Semantic colors stay semantic.** Success/warning/info hues should only appear on states matching their meaning (a green badge for "approved," a warning-orange banner for an error) — flag green/red/blue used purely decoratively or for unrelated meanings.
- **Status colors match the table above.** A red used for "error" that isn't in TR's warning-orange range, or a success state that doesn't read close to #387c2b, is worth flagging as should-consider (not must-fix, since exact hex matching can't be confirmed from a screenshot).
- **Color is never the only signal.** If status, errors, or selection state are communicated by color alone with no icon, label, or pattern backing it up, flag it — this is a should-consider under this skill (full accessibility contrast checking still belongs to the Accessibility skill).
- **Consistent purpose per color.** The same color should mean the same thing everywhere in the flow — flag a color that's used for one meaning on one screen and a different meaning elsewhere (e.g. orange marking "active" on one screen and "error" on another).

### Typography
- Two-typeface system: **Clario** for headings, buttons, and interactive labels; **Source Sans Pro** for body copy, labels, and everything else. Flag if a heading and its surrounding body text look like the same typeface, or if a heading-style treatment appears on body copy.
- **Font count.** No more than 2–3 distinct typefaces total across the product. Any third or fourth unrelated typeface appearing anywhere in the flow is a flag — this is the single strongest visual tell of an off-system font.
- **Legacy font.** If you recognize a typeface that looks distinctly different from Clario/Source Sans Pro's clean, modern sans style (e.g. an older serif or a dated system font), flag it as a possible legacy font in need of migration — treat this as a should-consider since you can't confirm the font name from an image.
- **Weight restraint.** Weights should be limited to regular and semibold. Bold should be rare and clearly intentional (e.g. a single emphasized figure or a critical warning). Flag pervasive or repeated bold use across a screen.
- **Hierarchy.** One dominant heading treatment per screen, stepping down clearly to subheads and body — flag a screen with no clear size/weight distinction between heading and body, or with three or more competing "heading-like" styles fighting for attention.
- **Size.** Body text should not look smaller than roughly 14px equivalent — flag noticeably tiny body copy, captions, or form labels.
- **Line height and length.** Paragraphs and long text blocks should have visibly comfortable line spacing (roughly 1.2x the text size or more) and shouldn't run edge-to-edge in very wide containers — flag cramped line spacing or a text block that reads as a single unbroken wide line with no comfortable measure.
- **Consistency of use.** The same text role (e.g. a card title, a table header, a form label) should look identical in size/weight/color everywhere it repeats — flag a role that's styled differently from screen to screen.

### Spacing & layout
Saffron spacing is a 4px grid:

| Token | Value | Token | Value |
|---|---|---|---|
| 05 (half-step) | 2px | 6 | 24px |
| 1 | 4px | 8 | 32px |
| 2 | 8px | 10 | 40px |
| 3 | 12px | 12 | 48px |
| 4 | 16px | 16 | 64px |
| 5 | 20px | 20 | 80px |
| — | — | 24 | 96px |

You can't measure exact pixels from a screenshot, so don't cite specific px values as fact — instead flag spacing that visually reads as arbitrary or uneven (inconsistent gaps between similar elements, ragged alignment, gaps that don't scale in clean multiples of each other) as a should-consider, and name the 4px-grid convention as the principle.
- **Grid & alignment.** Elements should align to a shared grid/baseline — Saffron's standard is a 12-column grid with consistent container max-widths. Flag visible misalignment, or content that appears to sit outside the rest of the page's grid.
- **Visual grouping.** Spacing should make related elements read as a group and unrelated elements read as separate — flag a layout where spacing doesn't clearly signal what belongs together (e.g. a label sitting closer to the wrong field, or uniform gaps that don't distinguish sections from each other).
- **Breathing room.** Sections and components should have enough whitespace that nothing feels crowded or ambiguously connected to its neighbor — flag areas that look visually cramped relative to the rest of the screen.
- **Density.** Compact, tightly-packed layouts (small row height, dense tables, minimal padding) are appropriate only for data-heavy or space-constrained screens (e.g. a large table, a narrow sidebar, mobile). Flag compact-looking density on general-purpose or low-density content screens as inconsistent with Saffron's density guidance.
- **Density consistency across a flow.** If a component type (e.g. a table or button group) appears at one density on one screen and a different density on the next screen in the same flow, flag it as an inconsistency.
- **Density inheritance.** Within a single screen, child elements inside a compact-density container should also read as compact — flag a component that looks like standard density sitting inside an otherwise compact section, or vice versa.

### Iconography
Saffron's icon size tokens (for reference — compare relative sizing, not exact pixels):

| Token | Size | Notes |
|---|---|---|
| xs | 12px | below minimum, rarely used |
| sm | 14px | below minimum, rarely used |
| md | 16px | default size |
| lg | 20px | |
| xl | 24px | |
| 2xl | 40px | |

- **Style consistency.** Icons should share one visual style — TR's standard is Font Awesome Sharp: a thin/light line style for default state, switching to a filled/solid variant only for selected or active state. Flag icons that look stylistically mismatched (mixed line weights, rounded vs. sharp corners, or an icon that clearly comes from a different set than the rest of the screen).
- **State convention.** Check whether selected/active icons (e.g. a chosen tab, a toggled filter) actually switch to a filled style versus the surrounding unselected icons staying in outline style — flag a screen where selected and unselected icons look identical, since that removes a wayfinding cue.
- **Single fill color.** Each icon should read as one flat color — flag any icon that appears to use two or more fill colors within itself.
- **Size consistency.** Icon sizing should be consistent within a flow — flag icons that look noticeably larger or smaller than their peers doing the same job (e.g. one nav icon rendered visibly bigger than the others beside it).
- **Minimum size.** Icons that look smaller than the 16px "md" default (i.e. approaching the 12–14px range) are a flag — small decorative-only icons are the exception, functional icons below this size are not.
- **Labeling.** Standalone icons with no obvious universal meaning (i.e. not a settings gear, search, close X, or similar near-universal symbol) should carry a text label or tooltip. Flag ambiguous unlabeled icons, especially for less common actions.
- **Recognizability.** An icon should be immediately readable for what it does — flag icons that are abstract, decorative, or likely to be misread (e.g. two different icons that look nearly identical but trigger different actions).

### Navigation
- **Product header.** Every screen should carry a product header (logo/product name plus a small set of global actions — Saffron caps this at 5 product-specific actions). Flag its absence, or a header that changes structure between screens in the same flow.
- **Breadcrumbs.** Expected once the information hierarchy goes deeper than 2 levels (e.g. Home > Section > Detail). Flag missing breadcrumbs in a deep hierarchy, and flag breadcrumbs that appear on some screens in a deep flow but not others.
- **Tabs.** Where tabs are used to switch between views at the same level, the active tab should be visually distinct (weight, underline, or color) from inactive tabs. Flag tab sets with no clear active/inactive distinction.
- **Side navigation.** If present, it shouldn't feel overloaded — Saffron caps this at roughly 10 items per level. Note that side nav isn't always expected: a flat, task-focused product (e.g. a single linear workflow) may not need one — only flag its absence if the product's structure looks like it has enough sections/depth to warrant one.
- **Active/current state.** The active or current nav item must be clearly marked — ideally with Saffron's active-state orange (#d64000) as a border or underline, distinct from plain hover styling. Flag if no page in the flow shows a discernible "you are here" signal, or if the active indicator is inconsistent in style from screen to screen.
- **Consistent placement.** Header and nav placement should be identical across every screen in the same product — flag any screen where it shifts position, height, or structure relative to the rest of the flow.
- **Wayfinding & IA logic.** A user should be able to tell where they are and how to get to related areas at a glance. Flag navigation groupings that look arbitrary or unpredictable for the stated user base (e.g. unrelated items grouped together, or a structure that doesn't match how the described users would expect to find things), and flag any screen where it's genuinely unclear what page or state the user is looking at.

### Component & pattern consistency
You cannot tell from a screenshot whether something is a live Saffron component instance or a detached recreation — don't claim either. Only flag what's visually inconsistent:
- **Button hierarchy.** Buttons should show a clear primary/secondary/tertiary visual hierarchy (typically: solid fill for primary, outlined or lighter treatment for secondary, text-only or minimal styling for tertiary). Flag multiple buttons styled as equally "primary" in one view, or a hierarchy that's inconsistent between similar screens (e.g. "Save" is primary-styled on one screen and secondary-styled on an equivalent screen elsewhere).
- **Pattern reuse.** Recurring patterns (cards, table rows, form fields, modals, empty states) should look identical wherever they repeat across the product. Flag a one-off component that looks structurally different from an equivalent pattern used elsewhere in the same set of screens — this is usually the clearest sign of a custom/detached recreation rather than a shared component.
- **Visual fidelity to the system.** If a screen's component styling looks meaningfully off from TR's established look (heavier or different shadows, different corner radii, unfamiliar button shapes, spacing that doesn't match sibling screens), flag it as a design-system deviation and suggest checking it against the Saffron component library rather than asserting it's a detached instance.
- **Sticky elements.** Sticky headers, toolbars, or banners should be used sparingly and should stay visually small relative to the screen (Saffron's guidance: no more than roughly 20% of the viewport height, and generally no more than one sticky element per page beyond the product header/side nav). Flag a screen with multiple stacked sticky elements, or a sticky element that consumes a large portion of the visible screen and pushes content down.
- **Custom vs. standard patterns.** Where a screen appears to solve a problem with a bespoke widget when a standard pattern (table, card grid, form, modal) would normally cover it, flag it as worth documenting/justifying — Saffron expects custom patterns to have a clear rationale, not to replace an existing standard component without reason.

### Writing the finding
For every flagged item in this skill, the rationale must name the specific Saffron convention involved (e.g. "Saffron reserves orange for primary actions and active states" rather than "branding is inconsistent"). Tier guidance:
- **Must-fix** — only for clear, high-confidence violations visible in the screenshot (e.g. two competing orange primary buttons, missing product header, an obviously different icon set mixed in).
- **Should-consider** — visually plausible but not fully confirmable from the image (e.g. a color that's close to but not exactly a Saffron token, spacing that looks uneven).
- **Nice-to-have** — minor polish items (e.g. slight icon size drift, a component that's 90% consistent with its peers).`,
  },
  {
    id: "jtbd",
    name: "Jobs-to-be-Done",
    description: "Frames critique around the user's core job and moment of decision.",
    active: false,
    instructions:
      "Frame the critique around the user's job-to-be-done: the progress they are trying to make in a given circumstance. For each observation, ask whether the design advances or obstructs the core job, whether it surfaces the right information at the moment of decision, and whether secondary tasks distract from the primary job. Anchor findings to the supplied project context about target users and their goals; if the job is unclear from context, say so.",
  },
  {
    id: "content",
    name: "Content & Microcopy",
    description: "Evaluates clarity, voice, labels, and error/empty-state copy.",
    active: false,
    instructions:
      "Evaluate the interface's language and content design: clarity and scannability of labels, headings, and body copy; consistency of terminology and voice; specific, actionable button and link text (avoid vague 'Submit' or 'Click here'); human error messages that explain cause and recovery; reading level appropriate to the audience; and empty, loading, and success states that guide the user. Flag jargon, ambiguity, and copy that assumes context the user lacks.",
  },
]
