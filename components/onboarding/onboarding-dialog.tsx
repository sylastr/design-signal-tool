"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Accessibility,
  ArrowLeft,
  Check,
  LayoutTemplate,
  MousePointerClick,
  Palette,
  Target,
  Type,
} from "lucide-react"
import { DEFAULT_SKILLS } from "@/lib/types"
import { ToggleSwitch } from "@/components/setup/toggle-switch"

interface Props {
  open: boolean
  /** Set a default skill's platform-level visibility. */
  onSetSkillHidden: (id: string, hidden: boolean) => void
  /** Persist a first global context entry. */
  onAddContext: (name: string, text: string) => void
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

export function OnboardingDialog({ open, onSetSkillHidden, onAddContext, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<string | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [ctxName, setCtxName] = useState("Product context")
  const [ctxText, setCtxText] = useState("")
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

  const pickRole = (r: (typeof ROLES)[number]) => {
    setRole(r.id)
    setSelectedSkills(new Set(r.skills))
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
    if (step === 1) return role !== null
    if (step === 2) return selectedSkills.size > 0
    return true
  }, [step, role, selectedSkills])

  const finish = (apply: boolean) => {
    if (apply) {
      // Feed global settings: keep chosen lenses visible, hide the rest.
      for (const s of DEFAULT_SKILLS) {
        onSetSkillHidden(s.id, !selectedSkills.has(s.id))
      }
      if (ctxName.trim() && ctxText.trim()) {
        onAddContext(ctxName.trim(), ctxText.trim())
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
      <div className="absolute inset-0 bg-graphite/50" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border border-gray-2 bg-white shadow-2xl outline-none"
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
          {step === 1 && <RoleStep role={role} onPick={pickRole} />}
          {step === 2 && <SkillsStep selected={selectedSkills} onToggle={toggleSkill} />}
          {step === 3 && (
            <ContextStep
              name={ctxName}
              text={ctxText}
              onName={setCtxName}
              onText={setCtxText}
            />
          )}
          {step === 4 && (
            <DoneStep lensCount={selectedSkills.size} hasContext={ctxText.trim().length > 0} />
          )}
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
    { n: "1", label: "Upload a design", desc: "Screens, flows, or components." },
    { n: "2", label: "Add context & pick lenses", desc: "Tell the AI who it's for and how to critique." },
    { n: "3", label: "Get pinpointed feedback", desc: "Tiered from must-fix to nice-to-have, anchored on the artifact." },
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
        subtitle="Principle-grounded design feedback, on the spot. Here's how a review works."
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

function RoleStep({ role, onPick }: { role: string | null; onPick: (r: (typeof ROLES)[number]) => void }) {
  return (
    <>
      <StepHeading
        title="What's your role?"
        subtitle="We'll recommend the review lenses that fit your work. You can fine-tune them next."
      />
      <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {ROLES.map((r) => {
          const selected = role === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onPick(r)}
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
        subtitle="These are the expert perspectives the AI reviews through. Pick what matters — change it anytime in Settings."
      />
      <ul className="mt-7 flex flex-col gap-2.5">
        {DEFAULT_SKILLS.map((s) => {
          const meta = LENS_META[s.id]
          const Icon = meta?.icon ?? Target
          const on = selected.has(s.id)
          return (
            <li
              key={s.id}
              className={`flex items-center gap-3 border px-4 py-3 transition-colors ${
                on ? "border-racing-green bg-gray-1" : "border-gray-2 bg-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 text-tr-orange" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-graphite">{s.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-4">{meta?.short}</p>
              </div>
              <ToggleSwitch
                checked={on}
                onChange={() => onToggle(s.id)}
                label={`Enable the ${s.name} lens`}
              />
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-gray-4">At least one lens is required.</p>
    </>
  )
}

function ContextStep({
  name,
  text,
  onName,
  onText,
}: {
  name: string
  text: string
  onName: (v: string) => void
  onText: (v: string) => void
}) {
  return (
    <>
      <StepHeading
        title="Give the AI context"
        subtitle="Context turns generic notes into sharp, relevant critique. Add your product, users, and goals once — it applies to every review."
      />
      <div className="mt-7 flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Name this context"
          aria-label="Context name"
          className="border border-gray-2 bg-white px-3 py-2 text-sm text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
        />
        <textarea
          value={text}
          onChange={(e) => onText(e.target.value)}
          rows={5}
          placeholder="e.g. A legal research tool. Users are attorneys who need to find case law fast; the goal is to reduce time-to-first-result. Must follow TR brand guidelines."
          aria-label="Context text"
          className="ds-scroll resize-y border border-gray-2 bg-white px-3 py-2 text-sm leading-relaxed text-graphite outline-none placeholder:text-gray-3 focus:border-racing-green"
        />
        <p className="text-xs leading-relaxed text-gray-4">
          Saved as a <span className="font-semibold text-graphite">global context</span> you can
          edit anytime in Settings. Optional — skip and add it later, and you can also upload a
          PDF, TXT, or Word file from the Context step.
        </p>
      </div>
    </>
  )
}

function DoneStep({ lensCount, hasContext }: { lensCount: number; hasContext: boolean }) {
  const items = [
    `${lensCount} review ${lensCount === 1 ? "lens" : "lenses"} enabled`,
    hasContext ? "Global context added" : "No context yet — add it anytime",
    "Manage everything in Settings",
  ]
  return (
    <>
      <StepHeading
        title="You're all set"
        subtitle="Your workspace is configured. Upload a design to get your first review."
      />
      <ul className="mx-auto mt-7 flex max-w-sm flex-col gap-2.5">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2.5 border border-gray-2 px-4 py-3">
            <Check className="h-4 w-4 shrink-0 text-racing-green" aria-hidden />
            <span className="text-sm font-medium text-graphite">{it}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
