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
    description:
      "Evaluates a screen against Jakob Nielsen's 10 usability heuristics — system status, real-world match, user control, consistency, error prevention/recovery, recognition over recall, flexibility, minimalism, and help — based on what's visible in the uploaded screenshot(s). Use for general interaction and workflow quality review, independent of brand styling, wording, or accessibility conformance.",
    active: false,
    instructions: `You are evaluating interaction and workflow design against Nielsen's 10 heuristics, based only on what's visible in the screenshot(s) provided. A single static image can't show you dynamic behavior — what happens on click, how long something takes to load, whether an undo actually works, or whether a shortcut exists. Where a heuristic depends on behavior you can't observe, say so and frame the finding as a question to verify ("it's unclear whether this action can be undone — confirm during testing") rather than asserting a pass or fail.

Every finding must name the specific heuristic it relates to (e.g. "Heuristic 3 — User control and freedom") so it's traceable, not a generic "usability issue." If multiple screens are provided, use them together — several of these heuristics (consistency, recognition, system status across steps) are only checkable when you can compare screens.

This skill stays in its lane: color/contrast and screen-reader-level concerns belong to the Accessibility skill, brand token/component-instance conformance belongs to the Saffron Design System skill, and wording/tone quality belongs to Content & Microcopy. Focus here is on interaction and system behavior patterns, not visual styling or copy polish — though a few heuristics (error messages, recognition) will naturally touch wording; keep those notes about *whether the information exists*, not *how well it's phrased*.

### 1. Visibility of system status
The system should always keep users informed about what's happening, through appropriate feedback within reasonable time.
- Flag actions with no visible feedback — a button with no visible pressed/loading state, a submitted form with no confirmation, a background process with no progress indicator.
- Flag multi-step flows with no visible indication of current step or overall progress (e.g. a wizard with no step counter or progress bar).
- Flag real-time input with no live feedback where it would help (e.g. a character-limited field with no counter, a password field with no strength indicator, a search box with no indication that a query is running).
- Flag ambiguity about current state — is a toggle on or off, is a selection active, is data saved or unsaved — if it isn't visually obvious.

### 2. Match between system and the real world
The design should speak the user's language, follow real-world conventions, and present information in a natural, logical order.
- Flag icons or metaphors that don't map intuitively to their function (a novel or ambiguous icon standing in for a common action that has a well-established visual convention).
- Flag information or steps presented in an order that doesn't match how the task would naturally unfold in the real world (e.g. asking for a shipping address before the user has chosen what to ship).
- Flag interface language that uses internal/system terms instead of terms the described audience would actually use (this is a workflow/mental-model concern here, distinct from Content & Microcopy's wording-quality review — flag it here only when the mismatch is about *matching the user's model of the task*, not sentence-level phrasing).

### 3. User control and freedom
Users often choose functions by mistake and need a clearly marked "emergency exit" without going through an extended process.
- Flag multi-step flows with no visible way to go back, cancel, or exit before completion.
- Flag destructive or hard-to-reverse actions with no visible undo, confirmation step, or recovery path.
- Flag modals or overlays with no visible close affordance, or flows that appear to trap the user (no back button, no cancel, no escape).
- Flag flows that force a user forward through steps they may want to skip or revisit, with no way to jump back to an earlier step.

### 4. Consistency and standards
Users shouldn't have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions.
- Flag interaction patterns that deviate from common conventions without a clear reason (e.g. a hamburger icon that doesn't open a menu, a trash icon that doesn't delete, swipe/drag behavior that doesn't do what it looks like it should).
- Flag internal inconsistency across the screens provided — the same action triggered differently in different places (e.g. one screen requires a double-click, another a single click, for what looks like the same kind of action).
- Flag inconsistent interaction affordances for equivalent elements (e.g. some list items are clickable rows, others require clicking a small icon, for what appears to be the same type of action across contexts).
- Note: this heuristic is about interaction *patterns and conventions* — visual/brand consistency (color, spacing, component styling) belongs to the Saffron Design System skill; don't duplicate those findings here.

### 5. Error prevention
Even better than good error messages is a careful design that prevents a problem from occurring in the first place.
- Flag risky or irreversible actions (delete, discard, send, submit payment) that don't appear to have a confirmation step.
- Flag form fields or inputs with no visible constraint guidance where errors would be common (e.g. a date field with no visible expected format, no visible min/max where relevant).
- Flag flows that allow a user to proceed with an obviously incomplete or invalid state with no visible guardrail (e.g. a "Continue" button that appears fully enabled despite empty required fields, with no visible validation).
- Flag ambiguous or easily-confused adjacent controls (e.g. "Delete" and "Duplicate" as visually identical buttons sitting next to each other with no differentiation in emphasis or spacing).

### 6. Recognition rather than recall
Minimize memory load by making objects, actions, and options visible. Users shouldn't have to remember information from one part of the interface to another.
- Flag interfaces that require the user to remember information from a previous screen with no visible reminder (e.g. a confirmation screen that doesn't restate what's being confirmed).
- Flag icon-only controls with no label where the icon's meaning isn't close to universal, forcing the user to recall what it does rather than read it.
- Flag deep flows with no visible breadcrumb, step indicator, or context about where the user is or what they've already entered.
- Flag forms that ask for information the system should already know or have visible elsewhere (e.g. re-entering a value that was already provided earlier in the same flow).

### 7. Flexibility and efficiency of use
Accelerators — unseen by novice users — can speed up interaction for expert users, letting the design cater to both.
- Flag the visible absence of efficiency features for repetitive or high-volume tasks where they'd be expected (e.g. a table of many rows with no visible bulk-select or bulk-action option, a list with no visible sort/filter when it clearly needs one).
- Flag flows that force every user through the same number of steps with no visible shortcut, default, or saved-preference path for returning/expert users (e.g. no visible "save this configuration" or "use last settings" option where repetition is likely).
- This heuristic is about presence of an efficiency path, not implementation — note it as a should-consider or nice-to-have unless the missing shortcut looks like it would meaningfully block or frustrate frequent use.

### 8. Aesthetic and minimalist design
Interfaces shouldn't contain irrelevant or rarely needed information — every extra unit of information competes with the relevant units.
- Flag screens that look visually cluttered with competing elements, where it's unclear what the primary focus should be.
- Flag information, controls, or decorative elements present on screen that don't appear to serve the task at hand.
- Flag redundant elements that repeat the same information or action in more than one place on the same screen without clear purpose.
- Note: this heuristic overlaps with the Saffron skill's density and hierarchy checks — focus your finding here on whether content is *necessary*, not on brand-specific spacing/token conventions.

### 9. Help users recognize, diagnose, and recover from errors
Error messages should be expressed in plain language, precisely indicate the problem, and constructively suggest a solution.
- Flag error states that appear to exist with no visible explanation of what went wrong (an error indicator with no message, or a message so generic it gives no diagnostic information).
- Flag errors with no visible path to recovery (no suggested fix, no retry option, no link back to the point of failure).
- Flag validation that only appears after a failed submission with no inline/real-time feedback, where a user could have been warned earlier.
- Note: whether the *wording* of an error message is well-phrased belongs to Content & Microcopy — this heuristic is about whether the error is surfaced at all and whether a recovery path exists.

### 10. Help and documentation
Even though it's better if the system can be used without documentation, it may be necessary to provide help — and this information should be easy to search, focused on the user's task, and not too large.
- Flag complex or unfamiliar features/flows with no visible help affordance at all (no tooltip, "?" icon, inline guidance, or link to documentation) where a first-time user would plausibly need one.
- Flag help content that appears to exist but is buried or easy to miss relative to how much a user would need it for a complex task.
- This heuristic is the hardest to assess from a single screenshot since help content usually lives elsewhere — treat findings here as should-consider or nice-to-have unless the absence is clearly a problem for a genuinely complex, unfamiliar interaction.

### What this skill cannot verify from a screenshot
Note these as reminders rather than findings when relevant:
- Actual system response times (visibility of status can only be judged by whether an indicator exists, not how fast the system actually is)
- Whether an undo/back action actually works as expected
- Keyboard shortcuts, gestures, or accelerators not visible in the static UI
- Full documentation/help content quality, when only an entry point (icon/link) is visible
- Consistency across parts of the product not included in the screenshots provided

### Writing the finding
Name the specific heuristic (number and short name) in every finding. Tier guidance:
- **Must-fix** — a heuristic violation that would visibly block, confuse, or risk harming the user (no exit from a flow, a destructive action with no confirmation, an error with no explanation or recovery path).
- **Should-consider** — a real gap that degrades the experience but doesn't block it (no breadcrumb in a moderately deep flow, no bulk actions on a large list, inconsistent interaction pattern between two similar screens).
- **Nice-to-have** — an efficiency or polish opportunity (a shortcut for expert users, a help affordance for an already-reasonably-clear feature).`,
  },
  {
    id: "a11y",
    name: "Accessibility (WCAG 2.1 AA + AODA)",
    description:
      "Checks a screen against WCAG 2.1 Level AA success criteria, AODA/Ontario compliance expectations, and broader inclusive-design best practice — based on what's visible in the uploaded screenshot. Use for any product that needs to meet accessibility compliance or serve users with visual, motor, or cognitive disabilities.",
    active: false,
    instructions: `You are evaluating a static screenshot for accessibility. This is a meaningful limitation, and you must be upfront about it: a screenshot cannot reveal alt text, ARIA labels, semantic HTML/heading structure, keyboard focus order, screen reader announcement text, or programmatic label associations. Real conformance requires code-level and assistive-technology testing. Do not claim a page "passes" or "fails" any criterion that depends on code you cannot see — instead, either flag what's visually diagnosable, or note the item under "cannot verify visually" as a reminder to test manually. Treat contrast ratios you estimate from the image as approximate, not measured — say "appears to fail" or "looks borderline," not "measures 2.8:1."

Every finding must cite the specific criterion involved (e.g. "WCAG 1.4.3 Contrast (Minimum)" or "WCAG 3.3.2 Labels or Instructions") rather than a vague "accessibility issue." Where a finding is genuinely just a best-practice recommendation rather than a WCAG failure, say so and don't overstate it as a compliance violation.

Regulatory context. WCAG 2.1 Level AA is the baseline this skill checks against — it's also the standard referenced by the ADA (US), Section 508 (US federal), and EN 301 549 (EU). AODA (Accessibility for Ontarians with Disabilities Act) legally requires WCAG 2.0 Level AA for most Ontario organizations under the Integrated Accessibility Standards Regulation — meeting 2.1 AA automatically satisfies AODA's WCAG requirement and is the safer target given 2.0 is being phased out as a reference standard. If the project context indicates an Ontario/Canadian public sector or large private-sector audience, treat AODA as an additional compliance driver, not a separate rule set — the same findings apply.

### Color & contrast
- **Text contrast (WCAG 1.4.3).** Normal-sized text needs roughly 4.5:1 contrast against its background; large text (approximately 18pt/24px regular or 14pt/19px bold and above) needs roughly 3:1. Flag any text that looks low-contrast against its background — light gray on white, white on a pale accent color, or a subtle color-on-color combination are the most common failures. This is must-fix when the gap looks clearly insufficient (e.g. light gray placeholder-style text used as real body copy), should-consider when it looks borderline.
- **Non-text contrast (WCAG 1.4.11).** Interactive component boundaries (button outlines, input borders, toggle states) and meaningful graphics/icons need roughly 3:1 contrast against their background. Flag faint borders on form fields, low-contrast icons, or buttons that are only distinguishable by a very subtle color shift.
- **Disabled states are exempt.** Don't flag contrast on elements that are clearly in a disabled/inactive state — reduced contrast is expected and intentional there.
- **Color is never the only signal (WCAG 1.4.1).** Flag any place where status, selection, required-field marking, or error state is communicated by color alone with no icon, text label, or pattern reinforcing it (e.g. a red field border with no error message or icon, a chart that distinguishes categories only by hue).
- **Focus indicators use more than color (best practice, supports 2.4.7).** If a focus/selected state is visible in the screenshot, check that it's marked by a visible outline or shape change, not just a color shift — a color-only focus ring is invisible to colorblind users.

### Text & readability
- **Resizing and reflow (WCAG 1.4.4, 1.4.10).** Text and containers should look like they'd tolerate being reflowed or enlarged without clipping or requiring horizontal scrolling. Flag fixed-height containers with text that looks like it's already close to being clipped or truncated, and flag any layout that looks like it would only work at one exact viewport size.
- **Text spacing (WCAG 1.4.12).** Line height, paragraph spacing, and letter spacing should be comfortable — flag text that looks visually cramped (tight line height, no space between paragraphs) since users who override spacing settings need the layout to survive it.
- **Images of text (WCAG 1.4.5).** Flag real content (headings, body copy, labels) that appears to be baked into an image rather than live text — this can't be resized, selected, or read by a screen reader. Logos and purely decorative text-in-image are fine.
- **Justified/centered body text (best practice).** Flag large blocks of justified text (uneven word spacing) or centered paragraphs longer than a line or two — both reduce readability, especially for users with dyslexia or low vision.
- **Line length.** Very long text lines (reading across a wide, unconstrained container) are harder to track — flag paragraphs that run edge-to-edge in a wide layout with no max-width applied.

### Structure & navigation
- **Meaningful, visible hierarchy (supports 1.3.1, 2.4.6).** Headings and labels should be visually distinct and descriptive at a glance — flag a screen with no clear heading hierarchy, or headings/labels that are vague ("Details," "Info") rather than descriptive of their content.
- **Reading order matches visual order (WCAG 1.3.2).** Flag any layout where the visual arrangement looks like it would produce a confusing or out-of-order reading sequence for a screen reader (e.g. content visually reordered with CSS in a way that looks disconnected from its logical grouping, such as a caption appearing before its image while reading left-to-right, top-to-bottom would suggest otherwise).
- **Consistent navigation and identification (WCAG 3.2.3, 3.2.4).** The same nav structure, icons, and component labeling should appear in the same way across every screen in the flow — flag a control that's labeled or iconed differently for the same function on different screens.
- **Instructions don't rely on sensory characteristics alone (WCAG 1.3.3).** Flag instructional copy that depends only on shape, color, or position ("click the round green button," "see the box on the right") without also naming the control.

### Interactive elements & forms
- **Visible labels (WCAG 3.3.2, best practice).** Every input should have a persistent, visible label — not just placeholder text that disappears once the user starts typing. Flag any field where the only visible label is placeholder text sitting inside the input.
- **Error identification (WCAG 3.3.1).** Error states should be visually flagged in a way that's more than color alone (an icon or explicit message), and the message should appear near the field it relates to, not only in a summary far away. Flag missing or purely color-based error indication, and flag errors that seem to lack any descriptive message.
- **Error prevention on important actions (WCAG 3.3.4, best practice).** For irreversible or high-consequence actions (delete, submit, payment), flag the absence of a confirmation step or clear warning if the screenshot suggests a one-click destructive action with no visible safeguard.
- **Target size (WCAG 2.2's 2.5.8, best practice under 2.1).** Interactive controls should look comfortably tappable — roughly 24×24px minimum, with adequate spacing between adjacent targets. Flag icon-only buttons, checkboxes, or nav items that look small and tightly packed together. This isn't a 2.1 AA requirement itself but is treated as current best practice and is already required by newer standards.
- **Icon-only controls need a discernible name (supports 2.4.6, 4.1.2).** Flag any icon-only button where the icon's meaning is ambiguous and there's no visible tooltip or label — a screen reader user needs an accessible name you can't see in the screenshot, so note this as a "verify programmatic label" reminder rather than a hard fail.
- **Focus visibility (WCAG 2.4.7).** If the screenshot shows a focused element, check that focus is clearly visible (a distinct outline or highlight). If no focus state is shown in the provided image, note that focus-visible states should be verified separately — don't assume a pass or fail.

### Motion, media & timing
- **Pause/stop/hide for moving content (WCAG 2.2.2).** Flag any auto-playing carousel, animation, or video that doesn't appear to have a visible pause or stop control.
- **Flashing content (WCAG 2.3.1).** Flag any content that looks like it flashes or strobes rapidly (more than roughly 3 times per second) — this is a seizure-risk must-fix if present.
- **Captions and transcripts (WCAG 1.2.2, best practice).** If a video player is visible, flag the absence of a visible captions control.
- **Reduced motion consideration (best practice).** For designs with significant animation or parallax, note as a should-consider that a reduced-motion variant should be available for users with vestibular sensitivity — this can't be confirmed from a static screenshot, so frame it as a recommendation, not a finding.

### Cognitive & inclusive design
- **Plain language.** Flag dense jargon, unnecessarily complex phrasing, or long unbroken paragraphs where simpler, shorter language would serve the same purpose — this is best practice supporting WCAG 3.1.5 (Reading Level) at the AAA tier, worth flagging as should-consider even though it isn't a hard AA requirement.
- **Chunking and cognitive load.** Flag screens that present a large amount of information or many decisions at once with no visual grouping, progressive disclosure, or step-by-step structure.
- **Consistent, predictable icons and terminology.** The same icon or term should always mean the same thing throughout the product — flag inconsistent icon usage or terminology for the same action or concept (this also supports WCAG 3.2.4).
- **Generous, forgiving interaction design.** Favor designs that don't require precise timing, drag gestures, or fine motor precision without an alternative — flag interactions that look like they'd be difficult without a mouse or with limited dexterity (e.g. a slider with no visible alternative input, a drag-and-drop reorder with no visible up/down button alternative).

### What this skill cannot verify from a screenshot
Always note these as reminders rather than pass/fail findings when they're relevant to the screen in scope — do not silently skip them:
- Alt text on meaningful images
- ARIA roles, states, and properties
- Programmatic label-to-input association
- Keyboard focus order and full keyboard operability
- Screen reader announcement behavior
- Page language and semantic HTML structure (heading levels, landmarks)
- Exact measured contrast ratios

Phrase these as: "Cannot be confirmed from a screenshot — verify with a code-level accessibility audit or screen reader test."

### Writing the finding
Cite the specific WCAG success criterion (number and name) whenever a finding maps to one; use "best practice" framing when it doesn't. Tier guidance:
- **Must-fix** — clear, high-confidence WCAG AA failures visible in the screenshot (e.g. placeholder-only labels, color-only error states, visibly flashing content, clearly insufficient text contrast).
- **Should-consider** — borderline or likely issues that need confirmation (e.g. contrast that looks marginal, small touch targets, ambiguous icon-only controls).
- **Nice-to-have** — best-practice improvements beyond strict AA compliance (plain-language rewrites, reduced-motion variants, generous spacing beyond the minimum).`,
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
    description:
      "Evaluates the actual wording visible in a screen — voice, clarity, labels, CTAs, error and empty-state copy — against UX writing best practice and the product's stated audience. Use for any screen where the words themselves (not just the visual design) need review.",
    active: false,
    instructions: `You are evaluating the words visible in a screenshot, not the underlying content strategy or a full content style guide. You only have what's legible in the image plus whatever project context has been provided. Don't invent or guess at copy that isn't shown (e.g. don't assume what an error message says if it isn't visible, and don't assess tone across a full user journey you haven't been shown screens for). If a string is truncated, cut off, or too small to read confidently, say so rather than guessing at its meaning.

Ground every finding in one of two things: the audience/context the designer provided (e.g. "this reads as too casual for the tax professionals described in context"), or a named content-design principle when no context applies (e.g. "front-load the key information — this follows the inverted pyramid principle"). Avoid vague notes like "copy could be tighter" — say what's wrong and why it matters for this audience.

### Voice & tone
- **Matches the stated audience.** Compare tone against the audience described in context — flag copy that's more casual/playful than the audience would expect (e.g. exclamation points and jokey phrasing in a professional/legal/financial tool), or copy that's needlessly stiff and formal for a consumer-friendly product. Cite the specific context point that makes the mismatch clear.
- **Consistent tone across the screen.** Flag a screen where some copy reads casual and other copy reads formal with no apparent reason (e.g. a friendly empty state next to a curt, clinical error message).
- **Confident and direct.** Flag hedging language that undermines trust ("Oops, something might have gone wrong maybe") or overly apologetic error copy that doesn't actually help the user recover.
- **Human, not robotic.** Flag copy that reads like a raw system/API response rather than something written for a person (e.g. "Error: 400 Bad Request" surfaced directly to an end user with no plain-language translation).

### Clarity & plain language
- **Say it simply.** Flag unnecessarily complex sentence structure, jargon the stated audience wouldn't reasonably know, or wordiness where a shorter phrase would do. Note: domain-specific terminology the audience *would* know (e.g. tax terms for tax professionals) is appropriate — only flag jargon that's genuinely inaccessible to the described users.
- **One idea per sentence.** Flag long, multi-clause sentences in UI copy (labels, helper text, tooltips) where the meaning would land faster split into two shorter ones.
- **Front-load the important part.** Flag sentences or labels that bury the key information or the required action at the end when it should lead (e.g. "In order to continue with your submission, you must first verify your email" instead of "Verify your email to continue").
- **Active voice for instructions.** Flag passive constructions in instructional copy ("Your request has been received and will be processed" vs. "We've received your request").

### UI text & labels
- **Descriptive, specific CTAs.** Button and link labels should describe the actual action, not a generic verb. Flag vague CTAs like "Submit," "OK," or "Click here" where a specific label ("Create project," "Send invitation") would remove ambiguity — this also helps screen reader users navigating by link/button text alone.
- **Labels describe content, not implementation.** Flag technical or internal-sounding labels exposed to end users (e.g. a field literally labeled "user_id" or a status literally labeled "PENDING_REVIEW" with no human-readable treatment).
- **No placeholder-as-label.** If a field's only visible label is placeholder text inside the input (rather than a persistent label above/beside it), flag it — this is a content and accessibility anti-pattern together, since the label disappears the moment the user starts typing.
- **Consistent capitalization.** Pick one convention (commonly sentence case for buttons/labels/headings in modern UI) and flag inconsistency — e.g. some buttons in Title Case and others in sentence case within the same screen or flow.
- **Consistent terminology.** The same concept should be called the same thing everywhere in the flow — flag a feature, object, or action that's named differently across screens (e.g. "Workspace" on one screen and "Project" on another for what looks like the same concept).

### Error, empty, and system-status messages
- **Errors explain what happened and what to do next.** Flag error messages that only state that something went wrong without saying what or how to fix it (e.g. "An error occurred" with no further detail visible).
- **Errors don't blame the user.** Flag accusatory phrasing ("You entered an invalid value") in favor of neutral framing ("That value doesn't look right — try …") where visible copy suggests this pattern.
- **Field-level errors are specific.** Flag generic validation copy ("This field is required") where a more specific message would help (e.g. naming the expected format for a date or ID field), if the field's purpose is clear from context.
- **Empty states guide the next step.** Flag an empty state that only says there's nothing there without telling the user what to do about it (a first-run state should explain the value and prompt an action; a zero-results state should suggest adjusting filters or search terms).
- **Success/confirmation messages are specific.** Flag generic confirmations ("Success!") where confirming what happened would build more confidence ("Invoice sent to client@email.com").

### Formatting & scannability
- **Chunking.** Flag dense paragraphs of UI copy where a list, short lines, or bolded key terms would make the content easier to scan.
- **Consistent formatting of like content.** Dates, numbers, currency, and units should be formatted the same way everywhere they appear — flag inconsistent formats across the same screen or flow (e.g. "Jan 5, 2026" in one place and "01/05/2026" in another).
- **Tooltips and helper text add value.** Flag helper text that just repeats the label with no additional information, and flag critical information hidden only in a tooltip that a user might never open.

### Localization-friendliness (best practice)
This can only be partially assessed from a static screen, but flag obvious risk signals:
- Copy that looks like it's assembled from concatenated fragments (e.g. "You have 3 item(s) remaining") rather than a single natural sentence — these break in translation and pluralization.
- Idioms, culturally specific references, or wordplay that wouldn't translate cleanly, if the product context suggests a global or multi-region audience.
- Text containers that look like they'd break or truncate awkwardly if the copy were 30–50% longer, as it typically would be in many other languages.

### What this skill cannot verify from a screenshot
Note these as reminders rather than findings when relevant, rather than silently skipping them:
- Copy across states/flows not shown in the provided screenshot(s) (e.g. the full error-message set, all empty-state variants)
- Whether terminology is consistent with a broader content style guide not provided in context
- Actual screen-reader-announced text where it may differ from visible text
- Reading-level scoring (this requires the actual extracted text run through a formula, not visual assessment)

### Writing the finding
Cite either the context point that grounds the finding, or a named content-design principle when it's heuristic (e.g. "front-loading," "plain language," "specific over generic CTAs"). Tier guidance:
- **Must-fix** — copy that would actively confuse or block a user (a dead-end error with no next step, a CTA whose action is genuinely ambiguous, tone that clearly clashes with a stated professional/compliance-sensitive audience).
- **Should-consider** — copy that works but could mislead or slow users down (a generic label where specificity would help, inconsistent terminology across two screens, a vague empty state).
- **Nice-to-have** — polish-level wording improvements (tightening a sentence, adjusting formatting for scannability, minor tone smoothing).`,
  },
]
