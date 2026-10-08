// Changelog I/O orchestrator: reads commits from git, renders sections via
// changelog-core, and writes CHANGELOG.md plus fastlane changelog files.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { generateChangelogSection, getUserFacingCommits } from './changelog-core.mjs'

// Normalize a git remote URL to its web form: strip the ssh:// prefix and
// leading username, convert scp-like git@host:path syntax, drop the .git
// suffix, and guarantee an https:// prefix.
export const normalizeRemoteUrl = (remote) =>
  remote
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@([^:]+):/, 'https://$1/')
    .replace(/\.git$/, '')
    .replace(/^http:\/\//, 'https://')

// Sole source of truth: `git remote get-url origin`. Fails fast when the
// script is run outside the repository or no `origin` remote is configured.
export const resolveRepoUrl = () => {
  let remote
  try {
    remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim()
  } catch {
    throw new Error(
      'Cannot determine repository URL: `git remote get-url origin` failed. ' +
        'Run the script from within the repository and make sure a git `origin` remote is set.',
    )
  }

  if (!remote) {
    throw new Error(
      'Cannot determine repository URL: git `origin` remote is empty. ' +
        'Set it with `git remote add origin <url>` and re-run.',
    )
  }

  return normalizeRemoteUrl(remote)
}

const REPO_URL = resolveRepoUrl()

const FASTLANE_EN_LINK = `Full changelog: ${REPO_URL}/src/branch/main/CHANGELOG.md`
const FASTLANE_RU_LINK = `Полный список изменений: ${REPO_URL}/src/branch/main/CHANGELOG.md`

const MAX_FASTLANE_CHARS = 500

const insertSectionAfterUnreleased = (changelog, section) => {
  const unreleasedHeading = '## [Unreleased]'
  const unreleasedIndex = changelog.indexOf(unreleasedHeading)

  if (unreleasedIndex === -1) return insertAfterHeader(changelog, section)

  const restAfterUnreleased = changelog.slice(unreleasedIndex + unreleasedHeading.length)
  const nextSectionMatch = /\n## /.exec(restAfterUnreleased)

  if (!nextSectionMatch) return `${changelog.trimEnd()}\n\n${section}\n`

  const nextSectionIndex = unreleasedIndex + unreleasedHeading.length + nextSectionMatch.index

  return `${changelog.slice(0, nextSectionIndex).trimEnd()}\n\n${section}\n\n${changelog.slice(nextSectionIndex + 1)}`
}

const insertAfterHeader = (changelog, section) => {
  const firstSectionIndex = changelog.indexOf('\n## ')

  if (firstSectionIndex === -1) return `${changelog.trimEnd()}\n\n${section}\n`

  return `${changelog.slice(0, firstSectionIndex).trimEnd()}\n\n${section}\n\n${changelog.slice(firstSectionIndex + 1)}`
}

const LINK_REFERENCE_PATTERN = /^\[([^\]]+)\]:\s+\S+$/

const parseVersion = (version) => version.split('.').map(Number)

const compareVersions = (a, b) => {
  const partsA = parseVersion(a)
  const partsB = parseVersion(b)

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i += 1) {
    const diff = (partsB[i] ?? 0) - (partsA[i] ?? 0)
    if (diff !== 0) return diff
  }

  return 0
}

const getLinkReferenceLines = (lines) =>
  lines.flatMap((line, index) => {
    const match = LINK_REFERENCE_PATTERN.exec(line)
    return match ? [{ index, version: match[1] }] : []
  })

const findInsertIndex = (version, linkReferenceLines) => {
  const firstOlderLine = linkReferenceLines.find(({ version: existingVersion }) =>
    compareVersions(version, existingVersion) < 0,
  )

  if (firstOlderLine) return firstOlderLine.index

  return linkReferenceLines[linkReferenceLines.length - 1].index + 1
}

const addLinkReference = (changelog, version) => {
  const link = `[${version}]: ${REPO_URL}/src/tag/v${version}`
  if (changelog.includes(`[${version}]:`)) return changelog

  const lines = changelog.split('\n')
  const linkReferenceLines = getLinkReferenceLines(lines)

  if (linkReferenceLines.length === 0) return `${changelog.trimEnd()}\n\n${link}\n`

  const insertIndex = findInsertIndex(version, linkReferenceLines)
  lines.splice(insertIndex, 0, link)

  return `${lines.join('\n').trimEnd()}\n`
}

const generateFastlaneChangelog = (subjects, link) => {
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

const getCommitsSinceTag = (tag) => {
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
  writeFileSync(changelogPath, addLinkReference(insertSectionAfterUnreleased(changelog, section), newVersion))

  const enChangelogPath = `fastlane/metadata/android/en-US/changelogs/${versionCode}.txt`
  const ruChangelogPath = `fastlane/metadata/android/ru/changelogs/${versionCode}.txt`
  mkdirSync('fastlane/metadata/android/en-US/changelogs', { recursive: true })
  mkdirSync('fastlane/metadata/android/ru/changelogs', { recursive: true })
  writeFileSync(enChangelogPath, generateFastlaneChangelog(commits, FASTLANE_EN_LINK))
  writeFileSync(ruChangelogPath, generateFastlaneChangelog(commits, FASTLANE_RU_LINK))
}
