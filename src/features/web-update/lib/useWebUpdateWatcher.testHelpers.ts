export interface FakeRegistration {
  addEventListener: (type: string, cb: () => void) => void
  installing: FakeWorker | null
  removeEventListener: (type: string, cb: () => void) => void
  update: jest.Mock
  waiting: unknown
}

export interface FakeWorker {
  addEventListener: (type: string, cb: () => void) => void
  state: string
}

export const createWorker = (state = 'installing') => {
  const listeners = new Map<string, Array<() => void>>()
  const worker: FakeWorker = {
    addEventListener: (type, cb) => {
      const list = listeners.get(type) ?? []
      list.push(cb)
      listeners.set(type, list)
    },
    state,
  }
  return {
    setState: (next: string) => {
      worker.state = next
      for (const cb of listeners.get('statechange') ?? []) cb()
    },
    worker,
  }
}

export const createRegistration = (overrides: Partial<FakeRegistration> = {}) => {
  const listeners = new Map<string, Array<() => void>>()
  const reg: FakeRegistration = {
    addEventListener: (type, cb) => {
      const list = listeners.get(type) ?? []
      list.push(cb)
      listeners.set(type, list)
    },
    installing: null,
    removeEventListener: (type, cb) => {
      const list = listeners.get(type) ?? []
      listeners.set(
        type,
        list.filter(c => c !== cb),
      )
    },
    update: jest.fn().mockResolvedValue(undefined),
    waiting: null,
    ...overrides,
  }
  return {
    emitUpdateFound: () => {
      for (const cb of listeners.get('updatefound') ?? []) cb()
    },
    reg,
  }
}

export const setServiceWorker = (ready: Promise<unknown>, controller: unknown) => {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { controller, ready },
  })
}

export const installDomGlobals = () => {
  Object.defineProperty(window, 'addEventListener', { configurable: true, value: jest.fn() })
  Object.defineProperty(window, 'removeEventListener', { configurable: true, value: jest.fn() })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      visibilityState: 'visible',
    },
  })
}
