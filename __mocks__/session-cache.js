// The session cache persists through the in-memory AsyncStorage/SecureStore
// mocks, which live for a whole test file. Wipe it after every test so a value
// cached by one test never leaks into the next one's "first load".
//
// Some tests stub storage with never-settling promises (startup-race tests), so
// the wipe gets a bounded number of microtask hops instead of being awaited
// unconditionally; the in-memory mocks settle well within it. Microtasks are
// used because they are immune to jest fake timers.
const MAX_MICROTASK_HOPS = 100

const settleWithin = async (promise, hops) => {
  let settled = false
  promise.then(
    () => (settled = true),
    () => (settled = true),
  )
  for (let hop = 0; hop < hops && !settled; hop += 1) await Promise.resolve()
}

afterEach(async () => {
  const { clearSessionCache } = require('../src/shared/lib/session-cache/clearSessionCache')

  // clearSessionCache reports a failed wipe with console.error. Tests that call
  // jest.resetAllMocks()/restoreAllMocks() wipe the AsyncStorage mock, so the
  // wipe fails there — tolerated, because those files reset their own storage.
  // This global hook is test scaffolding and must never print, so the whole
  // wipe runs with console.error/console.warn temporarily muted; production
  // clearSessionCache semantics stay untouched.
  const originalError = console.error
  const originalWarn = console.warn
  console.error = () => {}
  console.warn = () => {}

  try {
    await settleWithin(clearSessionCache(), MAX_MICROTASK_HOPS)
  } finally {
    console.error = originalError
    console.warn = originalWarn
  }
})
