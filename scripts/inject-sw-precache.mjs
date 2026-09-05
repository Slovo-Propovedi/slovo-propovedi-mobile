#!/usr/bin/env node

// Post-build step: injects the dist file manifest + build hash into dist/sw.js.
// Runs after `expo export -p web` (see package.json → web:build).
//
// NOT idempotent: a second run fails on missing placeholders. That is honest
// and fine — `expo export` always produces a fresh copy of public/sw.js, so
// the placeholders are guaranteed to be present exactly once on every build.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SW_FILE = 'sw.js'
const VERSION_PLACEHOLDER = '__SW_BUILD_VERSION__'
const URLS_PLACEHOLDER = "'__SW_PRECACHE_URLS__'"

const RED = '\x1b[31m'
const RESET = '\x1b[0m'

const exitError = (message) => {
  console.error(`${RED}${message}${RESET}`)
  process.exit(1)
}

const replacePlaceholder = (source, placeholder, replacement) => {
  const occurrences = source.split(placeholder).length - 1
  if (occurrences !== 1) {
    throw new Error(`Placeholder ${placeholder} must occur exactly once, found ${occurrences}`)
  }
  return source.replace(placeholder, replacement)
}

/**
 * Collect every file under the dist directory as a leading-slash posix URL,
 * excluding the service worker itself (it is never precached).
 * @param {string} distDir
 * @returns {string[]}
 */
export const collectUrls = (distDir) => {
  const urls = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry)
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath)
      } else if (fullPath !== join(distDir, SW_FILE)) {
        urls.push('/' + relative(distDir, fullPath).split(sep).join('/'))
      }
    }
  }
  walk(distDir)
  return urls.sort()
}

/**
 * Fail-loud guard for the manifest collected from dist. A real `expo export`
 * always emits at least the SPA shell, so an empty manifest or a missing
 * /index.html means the build was broken and must never ship a bad precache.
 * @param {string[]} urls
 * @returns {void}
 */
export const validateManifest = (urls) => {
  if (urls.length === 0) {
    throw new Error('Manifest is empty: expo export produced no files to precache')
  }
  if (!urls.includes('/index.html')) {
    throw new Error("Manifest is missing the SPA shell '/index.html': expo export may have failed")
  }
}

/**
 * Content-addressed build version: sha256 per file, then sha256 over the
 * sorted `path:hash` lines, truncated to 12 hex chars.
 * @param {string} distDir
 * @param {string[]} urls
 * @returns {string}
 */
export const computeVersion = (distDir, urls) => {
  const lines = urls
    .map((url) => {
      const filePath = join(distDir, url.slice(1))
      const fileHash = createHash('sha256').update(readFileSync(filePath)).digest('hex')
      return `${url}:${fileHash}`
    })
    .sort()
    .join('\n')
  return createHash('sha256').update(lines).digest('hex').slice(0, 12)
}

/**
 * Replace the two placeholders in the service worker source. The version
 * placeholder sits inside quotes and keeps them; the urls placeholder is
 * replaced together with its surrounding quotes by the JSON array literal, so
 * both pre- and post-injection files are valid JavaScript.
 * @param {string} source
 * @param {string} version
 * @param {string[]} urls
 * @returns {string}
 */
export const applyInjection = (source, version, urls) => {
  const urlList = JSON.stringify(urls)
  const withVersion = replacePlaceholder(source, VERSION_PLACEHOLDER, version)
  return replacePlaceholder(withVersion, URLS_PLACEHOLDER, urlList)
}

const validateSyntax = (filePath) => {
  try {
    execFileSync(process.execPath, ['--check', filePath], { stdio: 'pipe' })
  } catch (error) {
    throw new Error(`Syntax validation failed for ${filePath}: ${error.stderr || error.message}`)
  }
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isMain) {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const distDir = process.argv[2] ? resolve(process.argv[2]) : join(repoRoot, 'dist')
  const swPath = join(distDir, SW_FILE)

  try {
    if (!existsSync(distDir)) throw new Error(`Dist directory not found: ${distDir}`)
    if (!existsSync(swPath)) throw new Error(`Service worker not found: ${swPath}`)

    const urls = collectUrls(distDir)
    validateManifest(urls)
    const version = computeVersion(distDir, urls)
    const injected = applyInjection(readFileSync(swPath, 'utf-8'), version, urls)

    writeFileSync(swPath, injected)
    validateSyntax(swPath)

    console.log(`✓ Injected precache manifest into ${swPath}`)
    console.log(`  Files: ${urls.length}`)
    console.log(`  Version: ${version}`)
  } catch (error) {
    exitError(`Precache injection failed: ${error.message}`)
  }
}