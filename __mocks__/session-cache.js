// The session cache persists through the in-memory AsyncStorage/SecureStore
// mocks, which live for a whole test file. Wipe it after every test so a value
// cached by one test never leaks into the next one's "first load".
//
// Tests that call jest.resetAllMocks()/restoreAllMocks() wipe the in-memory
// implementations of those storage mocks, so the wipe is preceded by re-arming
// them: the backing maps survive, and the wipe clears them through the restored
// methods instead of failing (and printing console.error noise).
//
// Some tests stub storage with never-settling promises (startup-race tests), so
// the wipe gets a bounded number of microtask hops instead of being awaited
// unconditionally; the in-memory mocks settle well within it. Microtasks are
// used because they are immune to jest fake timers.
import { clearToastTimerForTests } from '../src/shared/model/toast'

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
  // A pending toast reset timer would outlive the test and keep the worker alive.
  clearToastTimerForTests()

  // Re-arm both storage backends before the wipe: a test's resetAllMocks()/
  // restoreAllMocks() may have stripped their jest.fn implementations.
  const { rearmAsyncStorageMock } = require('@react-native-async-storage/async-storage')
  const { rearmSecureStoreMock } = require('expo-secure-store')
  rearmAsyncStorageMock()
  rearmSecureStoreMock()

  const { clearSessionCache } = require('../src/shared/lib/session-cache/clearSessionCache')

  await settleWithin(clearSessionCache(), MAX_MICROTASK_HOPS)
})
