#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

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

if (!/^\d+\.\d+\.\d+$/.test(arg) && !['patch', 'minor', 'major'].includes(arg)) {
  exitError(`Invalid argument: "${arg}". Use X.Y.Z, patch, minor, or major.`)
}

// --- Read current version from package.json ---
const pkgPath = 'package.json'
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
const currentVersion = pkg.version

// --- Calculate new version ---
let newVersion

if (/^\d+\.\d+\.\d+$/.test(arg)) {
  newVersion = arg
} else {
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  const bumps = {
    major: `${major + 1}.0.0`,
    minor: `${major}.${minor + 1}.0`,
    patch: `${major}.${minor}.${patch + 1}`,
  }
  newVersion = bumps[arg]
}

// --- Read current versionCode from build.gradle ---
const gradlePath = 'android/app/build.gradle'
let gradleContent

try {
  gradleContent = readFileSync(gradlePath, 'utf-8')
} catch {
  exitError(`File not found: ${gradlePath}`)
}

const versionCodeMatch = gradleContent.match(/versionCode (\d+)/)
const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1], 10) : 1
const newVersionCode = currentVersionCode + 1

// --- Update all 5 files ---

// 1. package.json
pkg.version = newVersion
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
log('✓ Updated package.json', GREEN)

// 2. app.json
const appJsonPath = 'app.json'
let appJson = readFileSync(appJsonPath, 'utf-8')
appJson = appJson.replace(/"version": "\d+\.\d+\.\d+"/, `"version": "${newVersion}"`)
writeFileSync(appJsonPath, appJson)
log('✓ Updated app.json', GREEN)

// 3. android/app/build.gradle
gradleContent = gradleContent.replace(/versionName "\d+\.\d+\.\d+"/, `versionName "${newVersion}"`)
gradleContent = gradleContent.replace(/versionCode \d+/, `versionCode ${newVersionCode}`)
writeFileSync(gradlePath, gradleContent)
log('✓ Updated android/app/build.gradle', GREEN)

// 4. ios/SlovoPropovedi.xcodeproj/project.pbxproj
const pbxprojPath = 'ios/SlovoPropovedi.xcodeproj/project.pbxproj'
let pbxproj = readFileSync(pbxprojPath, 'utf-8')
pbxproj = pbxproj.replace(/MARKETING_VERSION = [^;]+/g, `MARKETING_VERSION = ${newVersion}`)
pbxproj = pbxproj.replace(/CURRENT_PROJECT_VERSION = \d+/g, `CURRENT_PROJECT_VERSION = ${newVersionCode}`)
writeFileSync(pbxprojPath, pbxproj)
log('✓ Updated ios/SlovoPropovedi.xcodeproj/project.pbxproj', GREEN)

// 5. fdroid/metadata/ru.slovopropovedi.yml
const fdroidPath = 'fdroid/metadata/ru.slovopropovedi.yml'
let fdroid = readFileSync(fdroidPath, 'utf-8')
fdroid = fdroid.replace(/CurrentVersion: '\d+\.\d+\.\d+'/, `CurrentVersion: '${newVersion}'`)
fdroid = fdroid.replace(/CurrentVersionCode: \d+/, `CurrentVersionCode: ${newVersionCode}`)
fdroid = fdroid.replace(/versionName: '\d+\.\d+\.\d+'/, `versionName: '${newVersion}'`)
fdroid = fdroid.replace(/versionCode: \d+/, `versionCode: ${newVersionCode}`)
fdroid = fdroid.replace(/commit: v\d+\.\d+\.\d+/, `commit: v${newVersion}`)
writeFileSync(fdroidPath, fdroid)
log('✓ Updated fdroid/metadata/ru.slovopropovedi.yml', GREEN)

// --- Git operations ---
log('\n→ Staging all changes...', YELLOW)
execSync('git add -A', { cwd: process.cwd() })

log('→ Committing...', YELLOW)
execSync(`git commit -m "chore: bump version to ${newVersion}"`, { cwd: process.cwd() })

log('→ Tagging...', YELLOW)
execSync(`git tag -a v${newVersion} -m "v${newVersion}"`, { cwd: process.cwd() })

// --- Summary ---
log('\n══════════════════════════════════════', GREEN)
log('  Version bump complete!', GREEN)
log(`  ${currentVersion} → ${newVersion}`, GREEN)
log(`  VersionCode: ${currentVersionCode} → ${newVersionCode}`, GREEN)
log(`  Tag: v${newVersion}`, GREEN)
log('══════════════════════════════════════', GREEN)
log('  Reminder:  git push --tags origin main', YELLOW)
log('══════════════════════════════════════\n', GREEN)
