// The session cache persists through the in-memory AsyncStorage/SecureStore
// mocks, which live for a whole test file. Wipe it after every test so a value
// cached by one test never leaks into the next one's "first load".
afterEach(async () => {
  const { clearSessionCache } = require('../src/shared/lib/session-cache/clearSessionCache')

  await clearSessionCache()
})
