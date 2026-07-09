import { generateObject } from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { z } from "zod"

export const maxDuration = 60

// Thomson Reuters Open Arena exposes an OpenAI-compatible surface. The base URL
// and model are configurable via env so the deployment can target the correct
// Open Arena gateway; sensible defaults keep local development working.
const OPEN_ARENA_BASE_URL =
  process.env.OPEN_ARENA_BASE_URL ?? "https://aiopenarena.gcs.int.thomsonreuters.com/v1"
const OPEN_ARENA_MODEL = process.env.OPEN_ARENA_MODEL ?? "gpt-4o"

const annotationSchema = z.object({
  number: z.number().int().describe("Sequential 1-based index of the annotation, ranked by impact."),
  location: z
    .object({
      x: z.number().describe("Center X, normalized 0-1 across the image width."),
      y: z.number().describe("Center Y, normalized 0-1 across the image height."),
      w: z.number().describe("Bounding box width, normalized 0-1. Use ~0.02 for a point marker."),
      h: z.number().describe("Bounding box height, normalized 0-1. Use ~0.02 for a point marker."),
    })
    .describe("Location of the issue in the artifact. x,y is the CENTER point, all values normalized 0-1."),
  tier: z
    .enum(["must-fix", "should-consider", "nice-to-have"])
    .describe("Severity tier ranked by impact."),
  skill: z.string().describe("The name of the analysis lens this observation comes from."),
  observation: z.string().describe("What you observe, stated precisely. 1-3 sentences."),
  rationale: z.string().describe("The named principle or supplied context that grounds the observation."),
  suggested_action: z.string().describe("A concrete, actionable next step."),
})

const resultSchema = z.object({
  artifact_summary: z.string().describe("One line describing what this artifact is."),
  annotations: z
    .array(annotationSchema)
    .describe("Prioritized critique items, ranked by impact. Aim for 5-8 items."),
})

// Clamp a value into the 0-1 range; falls back to a sensible default if the
// model returns a non-finite number so the overlay never breaks.
function clamp01(value: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return Math.min(1, Math.max(0, value))
}

const BASE_ROLE = `You are acting as an extension of a Principal Designer, reviewing a teammate's design in real time during a working session. Your feedback will be read in the moment — be precise, opinionated where warranted, and never generic. Ground every observation in a named principle or the supplied project context — never a bare opinion. Anchor each item to a specific location in the artifact. Tier each item must-fix / should-consider / nice-to-have. Keep each item to 1-3 sentences. If context is insufficient to judge something, say so explicitly rather than guessing. Surface at most 5-8 points per artifact, ranked by impact.

For each item, provide a normalized location (x, y as the CENTER point, plus w, h for a bounding box, all in the range 0-1 relative to the image). Use a small w/h (around 0.02) when the issue is a single point; use a larger box when the issue spans a region.`

interface AnalyzeBody {
  imageBase64?: string
  context?: string
  activeSkills?: { name: string; instructions: string }[]
  figmaLink?: string
  token?: string
}

export async function POST(req: Request) {
  let body: AnalyzeBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { imageBase64, context, activeSkills = [], figmaLink, token } = body

  if (!imageBase64) {
    return Response.json({ error: "No artifact image provided." }, { status: 400 })
  }

  const trimmedToken = token?.trim()
  if (!trimmedToken) {
    return Response.json(
      { error: "Open Arena token required. Add your token to enable AI features." },
      { status: 401 },
    )
  }

  const lensBlocks =
    activeSkills.length > 0
      ? activeSkills
          .map((s, i) => `LENS ${i + 1} — ${s.name}:\n${s.instructions}`)
          .join("\n\n")
      : "No specific lenses were selected; apply general principal-level design judgment."

  const contextBlock = context?.trim()
    ? `PROJECT & PRODUCT CONTEXT (authoritative — ground your feedback in this):\n${context.trim()}`
    : "No project context was supplied. Where a judgment depends on context you do not have, say so explicitly rather than guessing."

  const figmaBlock = figmaLink?.trim() ? `\n\nReference Figma frame: ${figmaLink.trim()}` : ""

  const system = `${BASE_ROLE}\n\n=== ACTIVE ANALYSIS LENSES ===\n${lensBlocks}\n\n=== ${contextBlock}${figmaBlock}`

  // Normalize to a data URL the model can consume as an image part.
  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`

  const openArena = createOpenAICompatible({
    name: "open-arena",
    baseURL: OPEN_ARENA_BASE_URL,
    apiKey: trimmedToken,
    supportsStructuredOutputs: true,
  })

  try {
    const { object } = await generateObject({
      model: openArena(OPEN_ARENA_MODEL),
      schema: resultSchema,
      maxRetries: 2,
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Review this design artifact now. Return your prioritized, tiered, location-anchored critique.",
            },
            { type: "file", data: dataUrl, mediaType: "image/png" },
          ],
        },
      ],
    })

    // Ensure numbers are sequential/stable and locations are safely in 0-1 for the UI.
    const annotations = object.annotations.map((a, i) => ({
      ...a,
      number: i + 1,
      location: {
        x: clamp01(a.location.x, 0.5),
        y: clamp01(a.location.y, 0.5),
        w: clamp01(a.location.w, 0.02),
        h: clamp01(a.location.h, 0.02),
      },
    }))

    return Response.json({ ...object, annotations })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log("[v0] /api/analyze error:", message)

    // Surface authentication failures distinctly so the UI can re-prompt for a token.
    const status =
      typeof (err as { statusCode?: number })?.statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : undefined
    if (status === 401 || status === 403 || /unauthorized|forbidden|invalid.*(api key|token)/i.test(message)) {
      return Response.json(
        { error: "Open Arena rejected the token. Check it and try again.", code: "invalid_token" },
        { status: 401 },
      )
    }

    // The Open Arena host is internal to Thomson Reuters and is not reachable
    // from this environment (DNS/connection failure). Make that explicit.
    if (/ENOTFOUND|ECONNREFUSED|EAI_AGAIN|ETIMEDOUT|cannot connect to api|fetch failed|getaddrinfo/i.test(message)) {
      return Response.json(
        {
          error: `Can't reach the Open Arena endpoint (${OPEN_ARENA_BASE_URL}). It looks like an internal Thomson Reuters address that isn't reachable from here — connect to the TR network/VPN or set OPEN_ARENA_BASE_URL to a publicly reachable gateway.`,
          code: "unreachable",
        },
        { status: 502 },
      )
    }

    return Response.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
