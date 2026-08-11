// Changelog I/O orchestrator: reads commits from git, renders sections via
// changelog-core, and writes CHANGELOG.md plus fastlane changelog files.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { generateChangelogSection, getUserFacingCommits } from './changelog-core.mjs'

const REPO_URL = 'https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile'

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

const addLinkReference = (changelog, version) => {
  const link = `[${version}]: ${REPO_URL}/src/tag/v${version}`
  if (changelog.includes(`[${version}]:`)) return changelog

  return `${changelog.trimEnd()}\n\n${link}\n`
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
