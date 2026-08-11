import { describe, expect, test } from '@jest/globals'
import {
  generateChangelogSection,
  getUserFacingCommits,
  groupByCategory,
} from './changelog-core.mjs'

const VERSION = '1.0.0'
const DATE = '2026-01-01'
const HEADER = `## [${VERSION}] - ${DATE}`
const FEAT_SUBJECT = 'feat: add player'
const FIX_SUBJECT = 'fix: fix crash'
const EMPTY_GROUPS = groupByCategory([])
const CI_SUBJECT = 'ci: run tests'
const DOCS_SUBJECT = 'docs: update readme'
const ADD_PLAYER_DESCRIPTION = 'Add player'

describe('getUserFacingCommits', () => {
  test('returns objects with type, description, and category for conventional commits', () => {
    const commits = getUserFacingCommits([FEAT_SUBJECT, 'fix: crash on start'])

    expect(commits).toEqual([
      { category: 'Added', description: ADD_PLAYER_DESCRIPTION, type: 'feat' },
      { category: 'Fixed', description: 'Crash on start', type: 'fix' },
    ])
  })

  test('filters out non-conventional commits without a type prefix', () => {
    const commits = getUserFacingCommits([FEAT_SUBJECT, 'random commit', 'merge branch main'])

    expect(commits).toEqual([
      { category: 'Added', description: ADD_PLAYER_DESCRIPTION, type: 'feat' },
    ])
  })

  test('filters out uncategorized commits', () => {
    const commits = getUserFacingCommits([
      'feat: add x',
      CI_SUBJECT,
      DOCS_SUBJECT,
      'chore: bump version to 1.0.0',
      'chore: update eslint config',
    ])

    expect(commits).toEqual([{ category: 'Added', description: 'Add x', type: 'feat' }])
  })

  test('capitalizes the first letter of each description', () => {
    const commits = getUserFacingCommits(['fix: lowercase description'])

    expect(commits[0].description).toBe('Lowercase description')
  })

  test('returns an empty array for empty input', () => {
    expect(getUserFacingCommits([])).toEqual([])
  })

  test('returns an empty array when all commits are filtered out', () => {
    expect(getUserFacingCommits(['docs: readme', 'ci: tests'])).toEqual([])
  })

  test('preserves the lowercase type while capitalizing the description', () => {
    const commits = getUserFacingCommits(['feat: add x'])

    expect(commits[0].type).toBe('feat')
    expect(commits[0].description).toBe('Add x')
  })

  test('handles revert and perf types', () => {
    const commits = getUserFacingCommits(['revert: rollback login', 'perf: speed up list'])

    expect(commits).toEqual([
      { category: 'Fixed', description: 'Rollback login', type: 'revert' },
      { category: 'Changed', description: 'Speed up list', type: 'perf' },
    ])
  })

  test('parses scoped and breaking-change commits', () => {
    const commits = getUserFacingCommits(['feat(player): add shuffle', 'feat!: remove legacy API'])

    expect(commits).toEqual([
      { category: 'Added', description: 'Add shuffle', type: 'feat' },
      { category: 'Added', description: 'Remove legacy API', type: 'feat' },
    ])
  })

  test('strips Signed-off-by trailers from subjects', () => {
    const commits = getUserFacingCommits(['feat: add player Signed-off-by: Dev <dev@x.com>'])

    expect(commits).toEqual([
      { category: 'Added', description: ADD_PLAYER_DESCRIPTION, type: 'feat' },
    ])
  })
})

describe('generateChangelogSection', () => {
  test('renders multiple categories with a blank line before each header', () => {
    const output = generateChangelogSection(VERSION, DATE, [
      FEAT_SUBJECT,
      FIX_SUBJECT,
      'refactor: split module',
    ])
    expect(output).toBe(
      `${HEADER}

### Added

- Add player

### Changed

- Split module

### Fixed

- Fix crash`,
    )
  })

  test('renders a single category section', () => {
    const output = generateChangelogSection(VERSION, DATE, ['fix: crash on start'])
    expect(output).toBe(`${HEADER}

### Fixed

- Crash on start`)
  })

  test('returns null for empty subjects', () => {
    expect(generateChangelogSection(VERSION, DATE, [])).toBeNull()
  })

  test('returns null when no subject maps to a category', () => {
    const output = generateChangelogSection(VERSION, DATE, [DOCS_SUBJECT, CI_SUBJECT])

    expect(output).toBeNull()
  })

  test('starts with the version and date header', () => {
    const output = generateChangelogSection(VERSION, DATE, [FEAT_SUBJECT])

    expect(output.startsWith(`${HEADER}\n\n`)).toBe(true)
  })

  test('has exactly one blank line between category blocks', () => {
    const output = generateChangelogSection(VERSION, DATE, [FEAT_SUBJECT, FIX_SUBJECT])

    expect(output).toContain('- Add player\n\n### Fixed')
    expect(output).not.toContain('\n\n\n')
  })

  test('formats every list item as dash, space, subject', () => {
    const output = generateChangelogSection(VERSION, DATE, [FEAT_SUBJECT, FIX_SUBJECT])
    const listLines = output.split('\n').filter(line => line.startsWith('- '))

    expect(listLines).toEqual(['- Add player', '- Fix crash'])
  })

  test('skips subjects without a conventional commit prefix', () => {
    const output = generateChangelogSection(VERSION, DATE, [FEAT_SUBJECT, 'random commit'])

    expect(output).toContain('- Add player')
    expect(output).not.toContain('Random commit')
  })

  test('keeps duplicate subjects in the same category', () => {
    const output = generateChangelogSection(VERSION, DATE, ['fix: crash', 'fix: crash'])

    expect(output.match(/- Crash/g)).toHaveLength(2)
  })
})

describe('groupByCategory', () => {
  test('groups subjects by conventional commit type', () => {
    const groups = groupByCategory([FEAT_SUBJECT, FIX_SUBJECT, 'refactor: split module'])

    expect(groups).toEqual({
      Added: [ADD_PLAYER_DESCRIPTION],
      Changed: ['Split module'],
      Deprecated: [],
      Fixed: ['Fix crash'],
      Removed: [],
      Security: [],
    })
  })

  test('skips subjects with unknown or internal types', () => {
    const groups = groupByCategory([DOCS_SUBJECT, CI_SUBJECT, 'chore: bump version to 1.0.0'])

    expect(groups).toEqual(EMPTY_GROUPS)
  })

  test('maps revert, perf, and non-noise chore to their categories', () => {
    const groups = groupByCategory([
      'revert: rollback login',
      'perf: speed up list',
      'chore: update README',
    ])

    expect(groups.Fixed).toEqual(['Rollback login', 'Update README'])
    expect(groups.Changed).toEqual(['Speed up list'])
  })

  test('parses scoped, breaking-change, and colon-containing subjects', () => {
    const groups = groupByCategory([
      'feat(player): add shuffle',
      'feat!: remove legacy API',
      'feat: add foo: bar support',
    ])

    expect(groups.Added).toEqual(['Add shuffle', 'Remove legacy API', 'Add foo: bar support'])
  })

  test('strips Signed-off-by trailers from subjects', () => {
    const groups = groupByCategory(['feat: add player Signed-off-by: Dev <dev@x.com>'])

    expect(groups.Added).toEqual([ADD_PLAYER_DESCRIPTION])
  })

  test('filters out internal-noise chore commits', () => {
    const groups = groupByCategory(['chore: update eslint config', 'chore: update gitignore'])

    expect(groups).toEqual(EMPTY_GROUPS)
  })
})
