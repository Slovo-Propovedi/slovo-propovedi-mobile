type ConsoleMethod = 'error' | 'log' | 'warn'

const activeSpies: jest.SpyInstance[] = []

afterEach(() => {
  activeSpies.splice(0).forEach(spy => spy.mockRestore())
})

// Silences the requested console methods for the rest of the test file and
// restores them after every test, so a single call never leaks silencing into
// neighbouring tests (even when several calls stack).
export const mockConsole = (
  ...methods: Array<ConsoleMethod>
): Partial<Record<ConsoleMethod, jest.SpyInstance>> => {
  const spies: Partial<Record<ConsoleMethod, jest.SpyInstance>> = {}

  methods.forEach(method => {
    const spy = jest.spyOn(console, method).mockImplementation(() => {})
    activeSpies.push(spy)
    spies[method] = spy
  })

  return spies
}
