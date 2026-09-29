interface TimecodeLinkSegment {
  ms: number
  type: 'timecode'
  value: string
}

type TimecodeSegment = TimecodeLinkSegment | TimecodeTextSegment

interface TimecodeTextSegment {
  type: 'text'
  value: string
}

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const TIME_SEGMENT_MAX = 59
const LEADING_SEGMENT_REGEX = /^\d{1,2}$/
const TWO_DIGITS_REGEX = /^\d{2}$/

/**
 * Whole-word timecodes of the shape `M:SS` or `H:MM:SS`. The segment lengths
 * and the trailing word boundary keep `10:2345`, `112:30` and dates like
 * `2024:05` from matching.
 */
const TIMECODE_REGEX = /\b\d{1,2}(?::\d{2}){1,2}\b/

const parseNumericSegments = (parts: string[]): null | number[] => {
  const numbers: number[] = []

  for (const [index, part] of parts.entries()) {
    const pattern = index === 0 ? LEADING_SEGMENT_REGEX : TWO_DIGITS_REGEX
    if (!pattern.test(part)) return null
    numbers.push(Number(part))
  }

  return numbers
}

export const timecodeToMs = (timecode: string): null | number => {
  const parts = timecode.split(':')
  if (parts.length !== 2 && parts.length !== 3) return null

  const numbers = parseNumericSegments(parts)
  if (numbers === null) return null

  if (numbers.length === 2) {
    const [minutes, seconds] = numbers
    if (seconds > TIME_SEGMENT_MAX) return null

    return minutes * MS_PER_MINUTE + seconds * MS_PER_SECOND
  }

  const [hours, minutes, seconds] = numbers
  if (minutes > TIME_SEGMENT_MAX || seconds > TIME_SEGMENT_MAX) return null

  return hours * MS_PER_HOUR + minutes * MS_PER_MINUTE + seconds * MS_PER_SECOND
}

export const parseTimecodeSegments = (text: string): TimecodeSegment[] => {
  const segments: TimecodeSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(new RegExp(TIMECODE_REGEX, 'g'))) {
    const value = match[0]
    const ms = timecodeToMs(value)
    // Invalid lookalikes (e.g. `1:75`) never split the text — they stay inside it.
    if (ms === null) continue

    const matchIndex = match.index
    if (matchIndex > lastIndex)
      segments.push({ type: 'text', value: text.slice(lastIndex, matchIndex) })

    segments.push({ ms, type: 'timecode', value })
    lastIndex = matchIndex + value.length
  }

  if (lastIndex < text.length) segments.push({ type: 'text', value: text.slice(lastIndex) })

  return segments
}
