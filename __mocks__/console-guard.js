// Setup file (not a module mock): fails any test that prints unexpected
// console.error/console.warn. Intentional failure-path tests opt out by
// mocking the method themselves — jest.spyOn(console, ...) / mockConsole()
// from 'shared/mocks' (the guard stands down when the method is a jest mock).

const { format } = require('util')

const NOISE_METHODS = ['error', 'warn']
const MAX_REPORTED_SAMPLES = 5
const SILENCE_HINT =
  "If this test intentionally exercises a failure path, silence it via mockConsole() from 'shared/mocks' (auto-restores in afterEach)."

let recordedNoise = []
let installedSpies = []

const buildFailureMessage = noise => {
  const samples = noise
    .slice(0, MAX_REPORTED_SAMPLES)
    .map(({ method, text }) => `  [${method}] ${text}`)
    .join('\n')

  return [
    `Unexpected console output: ${noise.length} console.error/console.warn call(s).`,
    samples,
    SILENCE_HINT,
  ].join('\n')
}

beforeEach(() => {
  recordedNoise = []
  installedSpies = []

  NOISE_METHODS.forEach(method => {
    const current = console[method]

    // A test (or mockConsole) already owns this method: stand down until its
    // own afterEach restores it.
    if (typeof current !== 'function' || current._isMockFunction) return

    const spy = jest.spyOn(console, method).mockImplementation((...args) => {
      recordedNoise.push({ method, text: format(...args) })
    })

    installedSpies.push(spy)
  })
})

afterEach(() => {
  installedSpies.forEach(spy => spy.mockRestore())
  installedSpies = []

  if (recordedNoise.length === 0) return

  throw new Error(buildFailureMessage(recordedNoise))
})
