// Setup file (not a module mock): fails any test that prints unexpected
// console.error/console.warn.
//
// The recorder is installed ONCE at module load as a plain function on
// console[method]. It is not a jest mock, so jest.restoreAllMocks(),
// resetAllMocks() and clearAllMocks() cannot evict it — those only touch jest
// mock functions, which is why a per-test jest.spyOn installation (the previous
// design) was silently disarmed by the ~40 suites that reset mocks in their own
// beforeEach.
//
// Opt-out mechanics: a test silences a method intentionally by REPLACING the
// property above the recorder — mockConsole() from 'shared/mocks' or its own
// jest.spyOn(console, 'error').mockImplementation(...). The replacement never
// reaches the recorder, and mockRestore() restores the recorder it wrapped. A
// call-through spy (no mockImplementation) still records: noise is noise.

const { format } = require('util')

const NOISE_METHODS = ['error', 'warn']
const MAX_REPORTED_SAMPLES = 5
const SILENCE_HINT =
  "If this test intentionally exercises a failure path, silence it via mockConsole() from 'shared/mocks' (auto-restores in afterEach)."

let recordedNoise = []

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

const armRecorder = method => {
  const native = console[method]

  // Only wrap a real function. A console method that is already a jest mock was
  // installed above this setup layer and owns its behavior (nobody does this for
  // the setup-level console, but arming over it would hijack it silently).
  if (typeof native !== 'function' || native._isMockFunction) return

  console[method] = function (...args) {
    recordedNoise.push({ method, text: format(...args) })
    // Deliberately does NOT call the native method: the afterEach failure
    // carries the recorded text, and printing it again would only duplicate it.
  }
}

NOISE_METHODS.forEach(armRecorder)

beforeEach(() => {
  recordedNoise = []
})

afterEach(() => {
  if (recordedNoise.length === 0) return

  throw new Error(buildFailureMessage(recordedNoise))
})
