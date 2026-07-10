export type Tier = "must-fix" | "should-consider" | "nice-to-have"

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
  instructions: string
  /** Selected for the current analysis run (per-session, chosen in the wizard). */
  active: boolean
  custom?: boolean
  /** Hidden from the wizard at a platform level via Setup. Distinct from active. */
  hidden?: boolean
}

export interface SavedContext {
  id: string
  name: string
  text: string
  /** Hidden from the wizard at a platform level via Setup. */
  hidden?: boolean
}

/* Real, opinionated instruction blocks — these are composed into the system prompt.
   All skills start inactive: the stepped flow requires the user to deliberately
   pick at least one lens before analysis, which keeps critiques focused instead
   of generic. */
export const DEFAULT_SKILLS: Skill[] = [
  {
    id: "heuristic",
    name: "Heuristic Usability",
    active: false,
    instructions:
      "Evaluate against Nielsen's 10 usability heuristics: (1) Visibility of system status, (2) Match between system and the real world, (3) User control and freedom, (4) Consistency and standards, (5) Error prevention, (6) Recognition rather than recall, (7) Flexibility and efficiency of use, (8) Aesthetic and minimalist design, (9) Help users recognize, diagnose, and recover from errors, (10) Help and documentation. Name the specific heuristic each observation violates or upholds.",
  },
  {
    id: "a11y",
    name: "Accessibility (WCAG 2.1 AA)",
    active: false,
    instructions:
      "Audit against WCAG 2.1 AA. Check color contrast (4.5:1 for normal text, 3:1 for large text and UI components), visible focus indicators, target size (min 24x24px), text alternatives for non-text content, information not conveyed by color alone, logical heading/reading order, and form labels. Cite the specific success criterion (e.g. 1.4.3 Contrast, 2.4.7 Focus Visible, 1.4.1 Use of Color) for each finding.",
  },
  {
    id: "hierarchy",
    name: "Visual Hierarchy & Layout",
    active: false,
    instructions:
      "Assess visual hierarchy and layout using Gestalt principles (proximity, similarity, common region, continuity, figure/ground) and typographic scale. Evaluate whether the primary action is the most salient element, whether grouping reflects real relationships, whether alignment and spacing follow a consistent grid, and whether contrast and size guide the eye in priority order. Flag competing focal points and weak scanning paths.",
  },
  {
    id: "tr-brand",
    name: "TR Brand & Design System",
    active: false,
    instructions:
      "Judge conformance to Thomson Reuters brand and design-system norms. TR Orange (#D64000) is the sole accent and must be reserved for primary actions and small brand markers — never a dominant fill. Racing Green (#123015) anchors dark/active UI. Enforce hairline borders over shadows, no gradients, a strict grid, and restrained use of color. Flag off-brand accents, decorative gradients, inconsistent component styling, and misuse of the accent color.",
  },
  {
    id: "jtbd",
    name: "Jobs-to-be-Done",
    active: false,
    instructions:
      "Frame the critique around the user's job-to-be-done: the progress they are trying to make in a given circumstance. For each observation, ask whether the design advances or obstructs the core job, whether it surfaces the right information at the moment of decision, and whether secondary tasks distract from the primary job. Anchor findings to the supplied project context about target users and their goals; if the job is unclear from context, say so.",
  },
]
