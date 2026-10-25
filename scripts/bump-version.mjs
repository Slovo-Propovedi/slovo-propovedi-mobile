#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync, execSync } from 'node:child_process'
import { updateChangelogFiles } from './generate-changelog.mjs'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

const log = (message, color = '') => console.log(`${color}${message}${RESET}`)
const exitError = (message) => {
  log(message, RED)
  process.exit(1)
}

// --- Parse argument ---
const arg = process.argv[2]

if (!arg) {
  exitError('Usage: node scripts/bump-version.mjs <version|patch|minor|major>')
}

// Strip optional 'v' prefix (e.g. v1.2.3 → 1.2.3), consistent with CI tag format
const versionArg = arg.startsWith('v') ? arg.slice(1) : arg

if (!/^\d+\.\d+\.\d+$/.test(versionArg) && !['patch', 'minor', 'major'].includes(versionArg)) {
  exitError(`Invalid argument: "${arg}". Use X.Y.Z, patch, minor, or major.`)
}

// --- Determine release mode (native vs js-only) ---
// The newest tag is the last release: this bump's tag does not exist yet.
// No tags at all means a bootstrap release — treat it as native, matching the
// CI default in scripts/ci/detect-native-changes.sh.
const lastTag = execSync("git tag --sort=-creatordate | sed -n '1p'", {
  encoding: 'utf-8',
}).trim()

const detectNativeChanges = prevRef => {
  let output

  try {
    output = execFileSync('bash', ['scripts/ci/detect-native-changes.sh', prevRef], {
      encoding: 'utf-8',
    })
  } catch (error) {
    exitError(`Native-change detection failed: ${error.stderr || error.message}`)
  }

  const nativeLine = output.split('\n').find(line => line.startsWith('native='))
  const native = nativeLine?.slice('native='.length)

  if (native !== 'true' && native !== 'false') {
    exitError(`Unexpected detect-native-changes.sh output: "${output.trim()}"`)
  }

  return native === 'true'
}

// Worktree mode: the pending diff (committed + staged + unstaged) against the
// last release, which is exactly what `git add -A` will sweep into the bump.
const isNativeRelease = lastTag ? detectNativeChanges(lastTag) : true

log(`→ Release mode: ${isNativeRelease ? 'native' : 'js-only'}`, YELLOW)

// --- Read current version from package.json ---
const pkgPath = 'package.json'
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
const currentVersion = pkg.version

// --- Calculate new version ---
let newVersion

if (/^\d+\.\d+\.\d+$/.test(versionArg)) {
  newVersion = versionArg
} else {
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  const bumps = {
    major: `${major + 1}.0.0`,
    minor: `${major}.${minor + 1}.0`,
    patch: `${major}.${minor}.${patch + 1}`,
  }
  newVersion = bumps[arg]
}

// --- Derive versionCode from new semver ---
const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number)
const newVersionCode = newMajor * 10000 + newMinor * 100 + newPatch

// --- Read build.gradle for updates ---
const gradlePath = 'android/app/build.gradle'
let gradleContent

try {
  gradleContent = readFileSync(gradlePath, 'utf-8')
} catch {
  exitError(`File not found: ${gradlePath}`)
}

// --- Update all 4 files ---

// 1. package.json
pkg.version = newVersion
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
log('✓ Updated package.json', GREEN)

// 2. android/app/build.gradle
gradleContent = gradleContent.replace(/versionName "\d+\.\d+\.\d+"/, `versionName "${newVersion}"`)
gradleContent = gradleContent.replace(/versionCode \d+/, `versionCode ${newVersionCode}`)
writeFileSync(gradlePath, gradleContent)
log('✓ Updated android/app/build.gradle', GREEN)

// 3. ios/SlovoPropovedi.xcodeproj/project.pbxproj
const pbxprojPath = 'ios/SlovoPropovedi.xcodeproj/project.pbxproj'
let pbxproj = readFileSync(pbxprojPath, 'utf-8')
pbxproj = pbxproj.replace(/MARKETING_VERSION = [^;]+/g, `MARKETING_VERSION = ${newVersion}`)
pbxproj = pbxproj.replace(/CURRENT_PROJECT_VERSION = \d+/g, `CURRENT_PROJECT_VERSION = ${newVersionCode}`)
writeFileSync(pbxprojPath, pbxproj)
log('✓ Updated ios/SlovoPropovedi.xcodeproj/project.pbxproj', GREEN)

// 4. fdroid/metadata/ru.slovopropovedi.yml
const fdroidPath = 'fdroid/metadata/ru.slovopropovedi.yml'
let fdroid = readFileSync(fdroidPath, 'utf-8')
fdroid = fdroid.replace(/CurrentVersion: '\d+\.\d+\.\d+'/, `CurrentVersion: '${newVersion}'`)
fdroid = fdroid.replace(/CurrentVersionCode: \d+/, `CurrentVersionCode: ${newVersionCode}`)
fdroid = fdroid.replace(/versionName: '\d+\.\d+\.\d+'/, `versionName: '${newVersion}'`)
fdroid = fdroid.replace(/versionCode: \d+/, `versionCode: ${newVersionCode}`)
fdroid = fdroid.replace(/commit: v\d+\.\d+\.\d+/, `commit: v${newVersion}`)
writeFileSync(fdroidPath, fdroid)
log('✓ Updated fdroid/metadata/ru.slovopropovedi.yml', GREEN)

// 5. ota.config.ts — RUNTIME_VERSION (OTA delivery gate)
// Convention: a native release ships app X.Y.Z with runtime X.Y.Z; a js-only
// release keeps the runtime gate of the last APK so its bundle stays
// compatible. This edit lands in the bump commit via the `git add -A` below.
const otaConfigPath = 'ota.config.ts'
const runtimeVersionPattern = /^const RUNTIME_VERSION = '([^']+)'/m
let otaConfig = readFileSync(otaConfigPath, 'utf-8')
const runtimeVersionMatch = otaConfig.match(runtimeVersionPattern)

if (!runtimeVersionMatch) {
  exitError(`Could not find "const RUNTIME_VERSION = '<version>'" in ${otaConfigPath}`)
}

const currentRuntimeVersion = runtimeVersionMatch[1]

if (isNativeRelease) {
  otaConfig = otaConfig.replace(runtimeVersionPattern, `const RUNTIME_VERSION = '${newVersion}'`)
  writeFileSync(otaConfigPath, otaConfig)
  log(`→ RUNTIME_VERSION: ${currentRuntimeVersion} → ${newVersion}`, YELLOW)
} else {
  log(`→ RUNTIME_VERSION untouched (${currentRuntimeVersion})`, YELLOW)
}

// --- Generate changelog ---
log('\n→ Updating changelog...', YELLOW)

try {
  updateChangelogFiles(currentVersion, newVersion, newVersionCode, new Date().toISOString().slice(0, 10))
  log('✓ Updated CHANGELOG.md and fastlane changelogs', GREEN)
} catch (error) {
  exitError(`Changelog update failed: ${error.message}`)
}

// --- Git operations ---
log('\n→ Staging all changes...', YELLOW)
execSync('git add -A', { cwd: process.cwd() })

log('→ Committing...', YELLOW)
execSync(`git commit -s -m "chore: bump version to ${newVersion}"`, { cwd: process.cwd() })

log('→ Tagging...', YELLOW)
execSync(`git tag -a v${newVersion} -m "v${newVersion}"`, { cwd: process.cwd() })

// Verify the tag actually landed: `git tag -a` has been observed to exit 0
// without an error yet leave the ref missing (filesystem race?), which
// silently produces a commit with no matching tag.
try {
  execSync(`git rev-parse --verify -q v${newVersion}`, { cwd: process.cwd() })
} catch {
  exitError(`Tag v${newVersion} was not created despite 'git tag' reporting success. Run 'git tag -a v${newVersion} -m "v${newVersion}"' manually and verify with 'git tag -l'.`)
}

// --- Summary ---
log('\n══════════════════════════════════════', GREEN)
log('  Version bump complete!', GREEN)
log(`  ${currentVersion} → ${newVersion}`, GREEN)
log(`  VersionCode: ${newVersionCode}`, GREEN)
log(`  Tag: v${newVersion}`, GREEN)
log('══════════════════════════════════════', GREEN)
log('  Reminder:  git push --tags origin main', YELLOW)
log('══════════════════════════════════════\n', GREEN)
