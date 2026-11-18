import { describe, expect, test } from '@jest/globals'
import { prepareFastlaneNote, promoteUnreleasedSection } from './changelog-core.mjs'

const VERSION = '1.0.0'
const DATE = '2026-01-01'
const UNRELEASED = '## [Unreleased]'
const RELEASED_HEADER = `## [${VERSION}] - ${DATE}`

const changelogWithUnreleased = body => `# Changelog

${UNRELEASED}

${body}

## [0.9.0] - 2025-12-01

### Fixed

- Old fix
`

describe('promoteUnreleasedSection', () => {
  test('renames [Unreleased] to the released version and inserts a fresh empty section above', () => {
    const input = changelogWithUnreleased(
      '### Added\n\n- New player\n\n### Fixed\n\n- Crash on start',
    )

    const result = promoteUnreleasedSection(input, VERSION, DATE)

    expect(result.error).toBeUndefined()
    expect(result.changelog).toBe(`# Changelog

${UNRELEASED}

${RELEASED_HEADER}

### Added

- New player

### Fixed

- Crash on start

## [0.9.0] - 2025-12-01

### Fixed

- Old fix
`)
  })

  test('stops the promoted body at the next section and link references', () => {
    const input = `# Changelog

${UNRELEASED}

### Fixed

- Crash

[0.9.0]: https://example.com/tag/v0.9.0
`

    const result = promoteUnreleasedSection(input, VERSION, DATE)

    expect(result.changelog).toBe(`# Changelog

${UNRELEASED}

${RELEASED_HEADER}

### Fixed

- Crash

[0.9.0]: https://example.com/tag/v0.9.0
`)
  })

  test('reports an error when the [Unreleased] section is missing', () => {
    const result = promoteUnreleasedSection(
      '# Changelog\n\n## [0.9.0] - 2025-12-01\n',
      VERSION,
      DATE,
    )

    expect(result.changelog).toBeUndefined()
    expect(result.error).toMatch(/Unreleased/)
  })

  test('reports an error when the [Unreleased] section has no notes', () => {
    const input = `# Changelog

${UNRELEASED}

## [0.9.0] - 2025-12-01
`

    const result = promoteUnreleasedSection(input, VERSION, DATE)

    expect(result.changelog).toBeUndefined()
    expect(result.error).toMatch(/no notes/)
  })

  test('reports an error when the [Unreleased] section is empty at end of file', () => {
    const result = promoteUnreleasedSection(`# Changelog\n\n${UNRELEASED}\n`, VERSION, DATE)

    expect(result.error).toMatch(/no notes/)
  })
})

describe('prepareFastlaneNote', () => {
  const LINK = 'Full changelog: https://example.com/CHANGELOG.md'

  test('appends the link after a blank line', () => {
    const result = prepareFastlaneNote('- New player', LINK)

    expect(result.note).toBe('- New player\n\nFull changelog: https://example.com/CHANGELOG.md')
  })

  test('reports an error for an empty note', () => {
    const result = prepareFastlaneNote('   \n', LINK)

    expect(result.note).toBeUndefined()
    expect(result.error).toMatch(/empty/)
  })

  test('reports an error when the note exceeds the character budget', () => {
    const result = prepareFastlaneNote(`- ${'x'.repeat(500)}`, LINK, 500)

    expect(result.note).toBeUndefined()
    expect(result.error).toMatch(/too long/)
  })
})
