import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from '@jest/globals'
import {
  applyInjection,
  collectUrls,
  computeVersion,
  validateManifest,
} from './inject-sw-precache.mjs'

const VERSION_PLACEHOLDER = '__SW_BUILD_VERSION__'
const URLS_PLACEHOLDER = '__SW_PRECACHE_URLS__'
const SOURCE = [
  `const BUILD_VERSION = '${VERSION_PLACEHOLDER}'`,
  `const PRECACHE_URLS = '${URLS_PLACEHOLDER}'`,
].join('\n')
const ROOT_URL = '/'
const INDEX_URL = '/index.html'
const ENTRY_URL = '/_expo/static/js/web/entry-abc.js'
const VERSION = 'abc123def456'

const makeDist = () => {
  const dir = mkdtempSync(join(tmpdir(), 'sw-precache-'))
  mkdirSync(join(dir, '_expo', 'static', 'js', 'web'), { recursive: true })
  writeFileSync(join(dir, 'index.html'), '<html></html>')
  writeFileSync(join(dir, '_expo', 'static', 'js', 'web', 'entry-abc.js'), 'console.log(1)')
  writeFileSync(join(dir, 'sw.js'), SOURCE)
  return dir
}

describe('collectUrls', () => {
  test('collects files as leading-slash posix URLs, excluding sw.js', () => {
    const dir = makeDist()
    try {
      const urls = collectUrls(dir)
      expect(urls).toContain(INDEX_URL)
      expect(urls).toContain(ENTRY_URL)
      expect(urls).not.toContain('/sw.js')
      expect(urls.every(url => url.startsWith('/'))).toBe(true)
      expect(urls.every(url => !url.includes('\\'))).toBe(true)
    } finally {
      rmSync(dir, { force: true, recursive: true })
    }
  })
})

describe('validateManifest', () => {
  test('accepts a non-empty manifest containing the SPA shell', () => {
    const dir = makeDist()
    try {
      const urls = collectUrls(dir)
      expect(() => validateManifest(urls)).not.toThrow()
    } finally {
      rmSync(dir, { force: true, recursive: true })
    }
  })

  test('throws on an empty manifest', () => {
    expect(() => validateManifest([])).toThrow(/empty/i)
  })

  test('throws when the SPA shell /index.html is missing', () => {
    expect(() => validateManifest(['/_expo/static/js/web/entry-abc.js'])).toThrow(/\/index\.html/)
  })
})

describe('computeVersion', () => {
  test('is deterministic for identical input', () => {
    const dir = makeDist()
    try {
      const urls = collectUrls(dir)
      expect(computeVersion(dir, urls)).toBe(computeVersion(dir, urls))
    } finally {
      rmSync(dir, { force: true, recursive: true })
    }
  })

  test('changes when file content changes', () => {
    const dir = makeDist()
    try {
      const urls = collectUrls(dir)
      const before = computeVersion(dir, urls)
      writeFileSync(join(dir, 'index.html'), '<html>changed</html>')
      const after = computeVersion(dir, urls)
      expect(after).not.toBe(before)
    } finally {
      rmSync(dir, { force: true, recursive: true })
    }
  })

  test('returns 12 lowercase hex characters', () => {
    const dir = makeDist()
    try {
      const urls = collectUrls(dir)
      expect(computeVersion(dir, urls)).toMatch(/^[0-9a-f]{12}$/)
    } finally {
      rmSync(dir, { force: true, recursive: true })
    }
  })
})

describe('applyInjection', () => {
  test('replaces both placeholders exactly once', () => {
    const urls = [ROOT_URL, INDEX_URL]
    const output = applyInjection(SOURCE, VERSION, urls)
    expect(output).toContain(`const BUILD_VERSION = '${VERSION}'`)
    expect(output).toContain(`const PRECACHE_URLS = ["${ROOT_URL}","${INDEX_URL}"]`)
    expect(output).not.toContain('__SW_')
  })

  test('output is valid JavaScript', () => {
    const output = applyInjection(SOURCE, VERSION, [ROOT_URL, INDEX_URL])
    expect(() => new Function(output)).not.toThrow()
  })

  test('throws when a placeholder is absent', () => {
    expect(() => applyInjection('const BUILD_VERSION = 1', VERSION, [ROOT_URL])).toThrow()
  })
})
