import { execFileSync } from 'node:child_process'

const SIGNED_OFF_BY_LAST_RULE = 'signed-off-by-last'
const TRAILER = 'Signed-off-by: egoreast <egor.east@yandex.ru>'

interface LintResult {
  errorNames: string[]
  valid: boolean
}

const MESSAGES = {
  multiParagraphBody: `ci: x\n\nbody text\n\n${TRAILER}\n`,
  noSeparator: `ci: x\n${TRAILER}\n`,
  noTrailer: 'ci: x\n',
  trailerOnly: `${TRAILER}\n`,
  trailingJunk: `ci: x\n\n${TRAILER}\njunk line\n`,
  validTrailer: `ci: x\n\n${TRAILER}\n`,
}

// commitlint ships ESM-only. Jest on Node < 24.9 cannot require ESM without
// transforming the whole dependency tree (which uses import.meta), so the
// config is exercised in a child Node process that supports require(esm).
const LINT_SCRIPT = `
const load = require('@commitlint/load').default
const lint = require('@commitlint/lint').default

const run = async () => {
  const messages = JSON.parse(process.argv[1])
  const { defaultIgnores, ignores, parserPreset, plugins, rules } = await load()
  const results = {}

  for (const [name, message] of Object.entries(messages)) {
    const result = await lint(message, rules, {
      defaultIgnores,
      ignores,
      parserOpts: parserPreset && parserPreset.parserOpts,
      plugins,
    })
    results[name] = { valid: result.valid, errorNames: result.errors.map(error => error.name) }
  }

  process.stdout.write(JSON.stringify(results))
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
`

const lintMessages = (messages: typeof MESSAGES): Record<string, LintResult> =>
  JSON.parse(
    execFileSync(process.execPath, ['-e', LINT_SCRIPT, JSON.stringify(messages)], {
      cwd: __dirname,
      encoding: 'utf8',
    }),
  )

const hasSignedOffByLastError = (result: LintResult) =>
  result.errorNames.includes(SIGNED_OFF_BY_LAST_RULE)

describe('signed-off-by-last rule', () => {
  let results: Record<string, LintResult>

  beforeAll(() => {
    results = lintMessages(MESSAGES)
  })

  test('accepts a message that ends with the trailer after a blank line', () => {
    expect(results.validTrailer.valid).toBe(true)
    expect(hasSignedOffByLastError(results.validTrailer)).toBe(false)
  })

  test('rejects a trailing line after the trailer', () => {
    expect(results.trailingJunk.valid).toBe(false)
    expect(hasSignedOffByLastError(results.trailingJunk)).toBe(true)
  })

  test('rejects a trailer without the blank-line separator', () => {
    expect(results.noSeparator.valid).toBe(false)
    expect(hasSignedOffByLastError(results.noSeparator)).toBe(true)
  })

  test('rejects a message that is only the trailer', () => {
    expect(results.trailerOnly.valid).toBe(false)
    expect(hasSignedOffByLastError(results.trailerOnly)).toBe(true)
  })

  test('rejects a message without any trailer', () => {
    expect(results.noTrailer.valid).toBe(false)
    expect(hasSignedOffByLastError(results.noTrailer)).toBe(true)
  })

  test('accepts a multi-paragraph body before the trailer', () => {
    expect(results.multiParagraphBody.valid).toBe(true)
    expect(hasSignedOffByLastError(results.multiParagraphBody)).toBe(false)
  })
})
