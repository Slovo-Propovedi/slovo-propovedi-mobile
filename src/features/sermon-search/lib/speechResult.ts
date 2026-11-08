const RESULTS_KEY = 'android.speech.extra.RESULTS'
const RESULTS_FALLBACK_KEY = 'results'
const EXTRA_WRAPPER_KEY = 'extra'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Reads the best recognized phrase out of one candidate list. Recognizers
 * serialize `RESULTS` as an array, as an index-keyed object (a Bundle or a
 * bridge map), or as a bare string, and may include nulls or non-string entries.
 * @param results - Raw value stored under the results key.
 * @returns The first non-empty trimmed string, or undefined.
 */
const firstPhrase = (results: unknown): string | undefined => {
  const candidates = Array.isArray(results)
    ? results
    : isRecord(results)
      ? Object.values(results)
      : [results]

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue

    const phrase = candidate.trim()
    if (phrase.length > 0) return phrase
  }

  return undefined
}

/**
 * Extracts the recognized phrase from the extras an activity returned, without
 * ever throwing: OEM recognizers (MIUI in particular) deliver results in wildly
 * different shapes, and a malformed payload must degrade to "no transcript",
 * not to a parse error inside the voice-input flow.
 * Accepts both the extras map itself and the whole activity result that wraps
 * it under `extra`.
 * @param payload - Activity result or its extras.
 * @returns The recognized phrase, or undefined when none can be read.
 */
export const extractSpeechTranscript = (payload: unknown): string | undefined => {
  try {
    if (!isRecord(payload)) return undefined

    const extras = isRecord(payload[EXTRA_WRAPPER_KEY]) ? payload[EXTRA_WRAPPER_KEY] : payload

    return firstPhrase(extras[RESULTS_KEY]) ?? firstPhrase(extras[RESULTS_FALLBACK_KEY])
  } catch {
    // Reading extras can throw (lazy unparceling of a foreign class).
    return undefined
  }
}
