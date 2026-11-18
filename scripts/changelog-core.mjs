// Pure changelog release logic: promotes the agent-maintained [Unreleased]
// section to a released version. No I/O here; callers pass and receive text.

const UNRELEASED_HEADING = '## [Unreleased]'
const BULLET_PATTERN = /^\s*- \S/
const SECTION_STOP_PATTERN = /^(?:## \[|\[[^\]]+\]: )/
const MAX_FASTLANE_CHARS = 500

export const promoteUnreleasedSection = (changelog, version, date) => {
  const lines = changelog.split('\n')
  const start = lines.findIndex((line) => line === UNRELEASED_HEADING)

  if (start === -1) {
    return {
      error: `missing "${UNRELEASED_HEADING}" section in CHANGELOG.md — add release notes first`,
    }
  }

  let end = lines.length

  for (let i = start + 1; i < lines.length; i += 1) {
    if (SECTION_STOP_PATTERN.test(lines[i])) {
      end = i
      break
    }
  }

  const body = [...lines.slice(start + 1, end)]

  if (!body.some((line) => BULLET_PATTERN.test(line))) {
    return {
      error:
        'the [Unreleased] section has no notes — add bullet notes under ### Added / ### Fixed / etc. before bumping',
    }
  }

  while (body.length > 0 && body[body.length - 1].trim() === '') body.pop()
  body.push('')

  const promoted = [...lines.slice(0, start), UNRELEASED_HEADING, '', `## [${version}] - ${date}`, ...body, ...lines.slice(end)]

  return { changelog: promoted.join('\n') }
}

export const prepareFastlaneNote = (note, link, maxChars = MAX_FASTLANE_CHARS) => {
  const text = note.trim()

  if (!text) return { error: 'fastlane unreleased.txt is empty — the agent must write release notes first' }

  const full = `${text}\n\n${link}`

  if (full.length > maxChars) {
    return { error: `fastlane unreleased.txt is too long: ${full.length} chars exceeds the ${maxChars} limit — shorten the notes` }
  }

  return { note: full }
}
