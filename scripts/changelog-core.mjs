// Pure changelog logic: commit parsing, filtering, and markdown rendering.
// No I/O here; callers pass raw commit subjects and receive rendered sections.

const SIGN_OFF_PATTERN = /\s+Signed-off-by:.*$/
const CONVENTIONAL_PATTERN = /^(\w+)(?:\([^)]*\))?!?:\s*(.*)$/
const BUMP_VERSION_PATTERN = /^bump version to \d+\.\d+\.\d+$/
const CHORE_NOISE_PATTERN =
  /(bump version|gitignore|claude|validation schema|dependenc|lockfile|eslint|prettier|husky|ci|cleanup|dco|commit-msg|pre-commit|workflow)/i

const CATEGORY_ORDER = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']

const CATEGORY_BY_TYPE = {
  feat: 'Added',
  perf: 'Changed',
  refactor: 'Changed',
  fix: 'Fixed',
  revert: 'Fixed',
}

const stripInlineSignoff = (subject) => subject.replace(SIGN_OFF_PATTERN, '').trim()

const parseCommitSubject = (subject) => {
  const match = CONVENTIONAL_PATTERN.exec(stripInlineSignoff(subject))
  const description = match?.[2]?.trim()

  if (!match || !description) return null

  return { type: match[1], description }
}

const isBumpCommit = (commit) =>
  commit.type === 'chore' && BUMP_VERSION_PATTERN.test(commit.description)

const isInternalChore = (commit) =>
  commit.type === 'chore' && CHORE_NOISE_PATTERN.test(commit.description)

const getCategory = (commit) => {
  if (isBumpCommit(commit) || commit.type === 'ci' || isInternalChore(commit)) return null
  if (commit.type === 'chore') return 'Fixed'

  return CATEGORY_BY_TYPE[commit.type] ?? null
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export const getUserFacingCommits = (subjects) =>
  subjects
    .map(parseCommitSubject)
    .filter(Boolean)
    .flatMap((commit) => {
      const category = getCategory(commit)
      return category ? [{ ...commit, category, description: capitalize(commit.description) }] : []
    })

export const groupByCategory = (subjects) => {
  const groups = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, []]))

  for (const commit of getUserFacingCommits(subjects)) {
    groups[commit.category].push(commit.description)
  }

  return groups
}

export const generateChangelogSection = (version, date, subjects) => {
  const groups = groupByCategory(subjects)
  const categorySection = CATEGORY_ORDER
    .filter((category) => groups[category].length > 0)
    .map((category) => `### ${category}\n\n${groups[category].map((item) => `- ${item}`).join('\n')}`)
    .join('\n\n')

  if (categorySection.length === 0) return null

  return `## [${version}] - ${date}\n\n${categorySection}`
}
