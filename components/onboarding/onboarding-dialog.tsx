"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Accessibility,
  ArrowLeft,
  Check,
  Crosshair,
  Globe,
  LayoutTemplate,
  MousePointerClick,
  Palette,
  Target,
  Type,
} from "lucide-react"
import { DEFAULT_SKILLS } from "@/lib/types"

interface Props {
  open: boolean
  /** Pre-select a skill for the session review flow (does not hide anything). */
  onSetSkillActive: (id: string, active: boolean) => void
  /** Mark onboarding finished (also used for "skip"). */
  onComplete: () => void
}

// Short, human descriptions for each lens (the full instructions are long).
const LENS_META: Record<string, { short: string; icon: typeof Target }> = {
  heuristic: { short: "Nielsen's usability heuristics", icon: MousePointerClick },
  a11y: { short: "WCAG 2.1 AA conformance", icon: Accessibility },
  hierarchy: { short: "Layout, Gestalt & typographic scale", icon: LayoutTemplate },
  "tr-brand": { short: "Thomson Reuters brand & design system", icon: Palette },
  jtbd: { short: "Progress toward the user's core job", icon: Target },
  content: { short: "Copy, labels, voice & microcopy", icon: Type },
}

// Roles map to a recommended starting set of lenses. Users can adjust after.
const ROLES: { id: string; label: string; hint: string; skills: string[] }[] = [
  { id: "designer", label: "Designer", hint: "Visual & interaction critique", skills: ["hierarchy", "tr-brand", "heuristic"] },
  { id: "pm", label: "Product Manager", hint: "Outcomes & user goals", skills: ["jtbd", "heuristic", "content"] },
  { id: "developer", label: "Developer", hint: "Standards & accessibility", skills: ["a11y", "heuristic"] },
  { id: "researcher", label: "UX Researcher", hint: "Usability & user needs", skills: ["jtbd", "heuristic", "a11y"] },
  { id: "content-designer", label: "Content Designer", hint: "Copy, clarity & voice", skills: ["content", "hierarchy", "heuristic"] },
  { id: "a11y-specialist", label: "Accessibility Specialist", hint: "WCAG conformance", skills: ["a11y", "heuristic"] },
]

const STEP_COUNT = 5

export function OnboardingDialog({ open, onSetSkillActive, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [roles, setRoles] = useState<Set<string>>(new Set())
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const dialogRef = useRef<HTMLDivElement>(null)

  // Lock body scroll while open and focus the dialog for keyboard users.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const toggleRole = (r: (typeof ROLES)[number]) => {
    const nextRoles = new Set(roles)
    if (nextRoles.has(r.id)) nextRoles.delete(r.id)
    else nextRoles.add(r.id)
    setRoles(nextRoles)
    // Recommend the union of every selected role's lenses.
    const union = new Set<string>()
    for (const role of ROLES) {
      if (nextRoles.has(role.id)) role.skills.forEach((s) => union.add(s))
    }
    setSelectedSkills(union)
  }

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canAdvance = useMemo(() => {
    if (step === 1) return roles.size > 0
    if (step === 2) return selectedSkills.size > 0
    return true
  }, [step, roles, selectedSkills])

  const finish = (apply: boolean) => {
    if (apply) {
      // Pre-select chosen lenses for the review flow. This only sets their
      // session "active" state — nothing is hidden. Users still see every skill
      // in Settings and can disable them there if they want to hide any.
      for (const s of DEFAULT_SKILLS) {
        onSetSkillActive(s.id, selectedSkills.has(s.id))
      }
    }
    onComplete()
  }

  const goNext = () => {
    if (!canAdvance) return
    if (step === STEP_COUNT - 1) finish(true)
    else setStep((s) => s + 1)
  }
  const goBack = () => setStep((s) => Math.max(0, s - 1))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" role="presentation">
      <div className="ds-fade-in absolute inset-0 bg-graphite/70 backdrop-blur-sm" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
        className="ds-fade-in-up relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border border-gray-2 bg-white shadow-2xl outline-none"
      >
        {/* Brand hairline echoing the app header */}
        <div className="h-1 w-full shrink-0 bg-tr-orange" />

        <div className="ds-scroll flex-1 overflow-y-auto px-6 py-8 sm:px-10">
          {/* Logo mark */}
          <div className="flex justify-center">
            <div
              className="flex h-10 w-10 items-center justify-center bg-racing-green"
              aria-hidden
            >
              <span className="text-lg font-bold leading-none tracking-tight text-white">TR</span>
            </div>
          </div>

          {step === 0 && <WelcomeStep />}
          {step === 1 && <RoleStep roles={roles} onToggle={toggleRole} />}
          {step === 2 && <SkillsStep selected={selectedSkills} onToggle={toggleSkill} />}
          {step === 3 && <ContextStep />}
          {step === 4 && <DoneStep lensCount={selectedSkills.size} />}
        </div>

        {/* Footer: progress + actions */}
        <div className="shrink-0 border-t border-gray-2 px-6 py-4 sm:px-10">
          {/* Segmented progress */}
          <div className="mb-4 flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 transition-colors ${
                  i <= step ? "bg-racing-green" : "bg-gray-2"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-4 transition-colors hover:text-graphite"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back
              </button>
            ) : (
              <span className="text-xs text-gray-3">Step {step + 1} of {STEP_COUNT}</span>
            )}

            <div className="flex items-center gap-4">
              {step < STEP_COUNT - 1 && (
                <button
                  type="button"
                  onClick={() => finish(false)}
                  className="text-sm font-medium text-gray-3 transition-colors hover:text-gray-4"
                >
                  Skip for now
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                className="inline-flex items-center gap-2 bg-racing-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-racing-green-light disabled:cursor-not-allowed disabled:bg-gray-2 disabled:text-gray-3"
              >
                {step === STEP_COUNT - 1 ? "Start reviewing" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Steps ---- */

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-5 text-center">
      <h2 id="onboarding-title" className="text-pretty text-2xl font-bold tracking-tight text-graphite">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-gray-4">
        {subtitle}
      </p>
    </div>
  )
}

function WelcomeStep() {
  const steps = [
    { n: "1", label: "Upload a design", desc: "You can also drag images to the tool or paste them from your clipboard via Ctrl/CMD + V in your keyboard" },
    { n: "2", label: "Add context & pick skills", desc: "Provide broad context about the project and skills you want the AI to use. This will make the review relevant" },
    { n: "3", label: "Get pinpointed feedback", desc: "Ranked from must-fix to nice-to-have, anchored on our design artifacts." },
  ]
  const lenses = [
    { icon: MousePointerClick, label: "Usability" },
    { icon: Accessibility, label: "Accessibility" },
    { icon: LayoutTemplate, label: "Visual hierarchy" },
    { icon: Type, label: "Content" },
    { icon: Palette, label: "Brand" },
    { icon: Target, label: "Jobs-to-be-done" },
  ]
  return (
    <>
      <StepHeading
        title="Welcome to Design Signal"
        subtitle="Make your reviews grounded. Here's how it works"
      />
      <ol className="mt-7 flex flex-col gap-3">
        {steps.map((s) => (
          <li key={s.n} className="flex items-start gap-3 border border-gray-2 px-4 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-racing-green text-xs font-bold text-white">
              {s.n}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-graphite">{s.label}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-gray-4">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-4">
          Review lenses
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {lenses.map((l) => {
            const Icon = l.icon
            return (
              <span
                key={l.label}
                className="inline-flex items-center gap-1.5 border border-gray-2 px-2.5 py-1 text-xs font-medium text-graphite"
              >
                <Icon className="h-3.5 w-3.5 text-tr-orange" aria-hidden />
                {l.label}
              </span>
            )
          })}
        </div>
      </div>
    </>
  )
}

function RoleStep({
  roles,
  onToggle,
}: {
  roles: Set<string>
  onToggle: (r: (typeof ROLES)[number]) => void
}) {
  return (
    <>
      <StepHeading
        title="What's your role?"
        subtitle="Select all that apply — we'll recommend the review lenses that fit your work. You can fine-tune them next."
      />
      <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {ROLES.map((r) => {
          const selected = roles.has(r.id)
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onToggle(r)}
              aria-pressed={selected}
              className={`flex items-center justify-between gap-2 border px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-racing-green bg-gray-1"
                  : "border-gray-2 bg-white hover:border-gray-3"
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-graphite">{r.label}</span>
                <span className="mt-0.5 block truncate text-xs text-gray-4">{r.hint}</span>
              </span>
              {selected && <Check className="h-4 w-4 shrink-0 text-racing-green" aria-hidden />}
            </button>
          )
        })}
      </div>
    </>
  )
}

function SkillsStep({
  selected,
  onToggle,
}: {
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <>
      <StepHeading
        title="Choose your review lenses"
        subtitle="Pick the ones to pre-select for your reviews — you can change them per review and add your own anytime in Settings."
      />
      <ul className="mt-7 flex flex-col gap-2.5">
        {DEFAULT_SKILLS.map((s) => {
          const meta = LENS_META[s.id]
          const Icon = meta?.icon ?? Target
          const on = selected.has(s.id)
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onToggle(s.id)}
                aria-pressed={on}
                className={`flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors ${
                  on ? "border-racing-green bg-gray-1" : "border-gray-2 bg-white hover:border-gray-3"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 text-tr-orange" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-graphite">{s.name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-4">{meta?.short}</p>
                </div>
                <span
                  aria-hidden
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                    on ? "border-racing-green bg-racing-green text-white" : "border-gray-3 bg-white"
                  }`}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-gray-4">Select at least one lens.</p>
    </>
  )
}

function ContextStep() {
  const kinds = [
    {
      icon: Globe,
      label: "Global context",
      tag: "Set once in Settings",
      desc: "Permanent insights about your product, users, and goals. It applies to every review automatically, so the AI always knows who you're designing for.",
      examples: "e.g. audience, product goals, PRDs, design principles",
    },
    {
      icon: Crosshair,
      label: "Session context",
      tag: "Added per review",
      desc: "Details specific to the flows you're reviewing right now — what changed, what you want feedback on, or constraints for this flow.",
      examples: "e.g. \"This is the new checkout step — focus on clarity\"",
    },
  ]
  return (
    <>
      <StepHeading
        title="Two kinds of context"
        subtitle="Context turns generic notes into sharp, relevant critique. There are two ways to give it — you'll add both later, right where they fit."
      />
      <div className="mt-7 flex flex-col gap-6">
        {kinds.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="flex items-start gap-3 pl-4 border-l-2 border-gray-2">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-tr-orange" aria-hidden />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-graphite">{k.label}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-3">
                    {k.tag}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-gray-4">{k.desc}</p>
                <p className="mt-1.5 text-xs italic leading-relaxed text-gray-3">{k.examples}</p>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-4">
        Nothing to fill in here — you can add global context in{" "}
        <span className="font-semibold text-graphite">Settings</span> and session context on each
        review.
      </p>
    </>
  )
}

function DoneStep({ lensCount }: { lensCount: number }) {
  const items = [
    `${lensCount} review ${lensCount === 1 ? "lens" : "lenses"} enabled`,
    "Add global context anytime in Settings",
    "Add session context on each review",
  ]
  return (
    <>
      <StepHeading
        title="You're all set"
        subtitle="Your workspace is configured. Upload a design to get your first review."
      />
      <ul className="mx-auto mt-7 flex max-w-sm flex-col gap-3.5">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2.5">
            <Check className="h-4 w-4 shrink-0 text-racing-green" aria-hidden />
            <span className="text-sm font-medium text-graphite">{it}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
