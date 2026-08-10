// Shared changelog generation helpers used by bump-version.mjs.
// Commit parsing, filtering, and markdown rendering stay pure where possible;
// only getCommitsSinceTag and updateChangelogFiles touch I/O.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const REPO_URL = 'https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile'

export const FASTLANE_EN_LINK = `Full changelog: ${REPO_URL}/src/branch/main/CHANGELOG.md`
export const FASTLANE_RU_LINK = `Полный список изменений: ${REPO_URL}/src/branch/main/CHANGELOG.md`

const MAX_FASTLANE_CHARS = 500
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

export const parseCommitSubject = (subject) => {
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
  const categoryBlocks = CATEGORY_ORDER
    .filter((category) => groups[category].length > 0)
    .map((category) => `### ${category}\n\n${groups[category].map((item) => `- ${item}`).join('\n')}`)

  if (categoryBlocks.length === 0) return null

  return [`## [${version}] - ${date}`, '', ...categoryBlocks].join('\n')
}

export const insertSectionBeforeUnreleased = (changelog, section) => {
  const unreleasedHeading = '## [Unreleased]'
  const unreleasedIndex = changelog.indexOf(unreleasedHeading)

  if (unreleasedIndex === -1) return insertAfterHeader(changelog, section)

  return `${changelog.slice(0, unreleasedIndex).trimEnd()}\n\n${section}\n\n${changelog.slice(unreleasedIndex)}`
}

const insertAfterHeader = (changelog, section) => {
  const firstSectionIndex = changelog.indexOf('\n## ')

  if (firstSectionIndex === -1) return `${changelog.trimEnd()}\n\n${section}\n`

  return `${changelog.slice(0, firstSectionIndex).trimEnd()}\n\n${section}\n\n${changelog.slice(firstSectionIndex + 1)}`
}

export const addLinkReference = (changelog, version) => {
  const link = `[${version}]: ${REPO_URL}/src/tag/v${version}`
  if (changelog.includes(`[${version}]:`)) return changelog

  return `${changelog.trimEnd()}\n\n${link}\n`
}

export const generateFastlaneChangelog = (subjects, link) => {
  const lines = getUserFacingCommits(subjects)
    .filter((commit) => commit.type === 'feat' || commit.type === 'fix')
    .map((commit) => commit.description)

  if (lines.length === 0) return link

  const content = `${lines.join('\n')}\n\n${link}`

  if (content.length <= MAX_FASTLANE_CHARS) return content

  const budget = MAX_FASTLANE_CHARS - link.length - 2
  let kept = ''

  for (const line of lines) {
    const candidate = kept ? `${kept}\n${line}` : line
    if (candidate.length > budget) break
    kept = candidate
  }

  return kept ? `${kept}\n\n${link}` : link
}

export const getCommitsSinceTag = (tag) => {
  const output = execSync(`git log ${tag}..HEAD --format=%s`, { cwd: process.cwd() }).toString()

  return output.replace(/\r/g, '').split('\n').filter(Boolean)
}

export const updateChangelogFiles = (previousVersion, newVersion, versionCode, date) => {
  const commits = getCommitsSinceTag(`v${previousVersion}`)
  const section = generateChangelogSection(newVersion, date, commits)

  if (!section) {
    throw new Error(
      `no user-facing conventional commits found since v${previousVersion}, changelog not updated`,
    )
  }

  const changelogPath = 'CHANGELOG.md'
  const changelog = readFileSync(changelogPath, 'utf-8')
  writeFileSync(changelogPath, addLinkReference(insertSectionBeforeUnreleased(changelog, section), newVersion))

  const enChangelogPath = `fastlane/metadata/android/en-US/changelogs/${versionCode}.txt`
  const ruChangelogPath = `fastlane/metadata/android/ru/changelogs/${versionCode}.txt`
  mkdirSync('fastlane/metadata/android/en-US/changelogs', { recursive: true })
  mkdirSync('fastlane/metadata/android/ru/changelogs', { recursive: true })
  writeFileSync(enChangelogPath, generateFastlaneChangelog(commits, FASTLANE_EN_LINK))
  writeFileSync(ruChangelogPath, generateFastlaneChangelog(commits, FASTLANE_RU_LINK))
}
