/**
 * shared — helpers shared between the profile plugin (index.ts) and its
 * failover module (failover.ts).
 *
 * Kept inside plugins/profile/ (not .opencode/lib/) so the profile slice stays
 * self-contained: both import from here, no consumer outside the plugin does.
 */

import { Model } from '@opencode/plugin'

/** A parsed "provider/model[#variant]" reference — the canonical Model.Ref, trusted after the boundary. */
export type ModelRef = Model.Ref

/**
 * Boundary shape of a model ref (SessionInfo.model is the plain, unbranded
 * form, so branded ModelRef values and raw session shapes both fit here).
 */
export interface ModelRefShape {
  providerID: string
  id: string
  variant?: string
}

/** Human-readable rendering of an arbitrary value for error messages. */
export const formatValue = (value: unknown): string => {
  if (typeof value === 'string') return `"${value}"`
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value) ?? String(value)
  return String(value)
}

/**
 * Render a model ref back to its "provider/model[#variant]" string form.
 * Byte-compatible with what the agents' frontmatter `model:` key accepts — a
 * failover overlay written via formatRef can be re-parsed losslessly.
 */
export const formatRef = (ref: ModelRefShape): string =>
  ref.variant ? `${ref.providerID}/${ref.id}#${ref.variant}` : `${ref.providerID}/${ref.id}`

/** True when the error means "file does not exist on disk". */
export const isMissingFileError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'

/** Parse "provider/model#variant" into the canonical Model.Ref (Law 4: Fail Fast). Throws for malformed values. */
export const parseModelRef = (raw: string): ModelRef => Model.Ref.parse(raw)

export const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)
