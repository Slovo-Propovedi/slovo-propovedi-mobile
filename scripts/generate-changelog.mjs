// Changelog I/O orchestrator: promotes the agent-maintained [Unreleased]
// section to the released version in CHANGELOG.md, and renames the fastlane
// unreleased notes to the released versionCode. Note content is written by
// the agent, never generated from commits.

import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { prepareFastlaneNote, promoteUnreleasedSection } from './changelog-core.mjs'

// Normalize a git remote URL to its web form: strip the ssh:// prefix and
// leading username, convert scp-like git@host:path syntax, drop the .git
// suffix, and guarantee an https:// prefix.
const normalizeRemoteUrl = (remote) =>
  remote
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@([^:]+):/, 'https://$1/')
    .replace(/\.git$/, '')
    .replace(/^http:\/\//, 'https://')

// Sole source of truth: `git remote get-url origin`. Fails fast when the
// script is run outside the repository or no `origin` remote is configured.
const resolveRepoUrl = () => {
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

const FASTLANE_LOCALES = [
  { dir: 'fastlane/metadata/android/en-US/changelogs', link: `Full changelog: ${REPO_URL}/src/branch/main/CHANGELOG.md` },
  { dir: 'fastlane/metadata/android/ru/changelogs', link: `Полный список изменений: ${REPO_URL}/src/branch/main/CHANGELOG.md` },
]

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

export const releaseChangelogFiles = (newVersion, versionCode, date) => {
  const changelogPath = 'CHANGELOG.md'
  const changelog = readFileSync(changelogPath, 'utf-8')
  const promoted = promoteUnreleasedSection(changelog, newVersion, date)

  if (promoted.error) throw new Error(promoted.error)

  writeFileSync(changelogPath, addLinkReference(promoted.changelog, newVersion))

  // Validate every locale before the first write: a failing note leaves the
  // tree untouched instead of half-renamed.
  const released = FASTLANE_LOCALES.map(({ dir, link }) => ({
    dir,
    note: prepareFastlaneNote(readFileSync(`${dir}/unreleased.txt`, 'utf-8'), link),
  }))

  for (const { dir, note } of released) {
    if (note.error) throw new Error(`${dir}: ${note.error}`)
  }

  for (const { dir, note } of released) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(`${dir}/${versionCode}.txt`, note.note)
    unlinkSync(`${dir}/unreleased.txt`)
  }
}
