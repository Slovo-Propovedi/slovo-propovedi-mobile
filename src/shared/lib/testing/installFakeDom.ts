// jest-expo runs in a node environment: there is no real DOM. This installs a
// fake `window`/`document` that records event listeners and dispatches key
// events to them, mirroring how a browser routes keydown to document listeners.
import type { FakeKeyEvent } from './createKeyEvent'

export interface FakeDocument extends FakeEventTarget {
  dispatchKeyDown: (event: FakeKeyEvent) => void
  documentElement: { style: { setProperty: jest.Mock } }
}

export interface FakeDom {
  dispatchKeyDown: (event: FakeKeyEvent) => void
  document: FakeDocument
  fireBlur: () => void
  fireDocumentKeyDown: (event: FakeKeyEvent) => void
  fireKeyDown: (event: FakeKeyEvent) => void
  fireKeyUp: (event: FakeKeyEvent) => void
  getListenerCount: () => number
  restore: () => void
  window: FakeEventTarget
}

export interface FakeEventTarget {
  addEventListener: jest.Mock
  getListenerCount: () => number
  getListeners: (type: string) => FakeEventListener[]
  listeners: Record<string, FakeEventListener[]>
  removeEventListener: jest.Mock
}

type FakeEventListener = (event?: unknown) => void

const createFakeEventTarget = (): FakeEventTarget => {
  const listeners: Record<string, FakeEventListener[]> = {}

  return {
    addEventListener: jest.fn((type: string, handler: FakeEventListener) => {
      ;(listeners[type] ??= []).push(handler)
    }),
    getListenerCount: () =>
      Object.values(listeners).reduce((count, typeListeners) => count + typeListeners.length, 0),
    getListeners: (type: string) => listeners[type] ?? [],
    listeners,
    removeEventListener: jest.fn((type: string, handler: FakeEventListener) => {
      const typeListeners = listeners[type]
      if (!typeListeners) return
      const index = typeListeners.indexOf(handler)
      if (index !== -1) typeListeners.splice(index, 1)
    }),
  }
}

const createFakeDocument = (): FakeDocument => {
  const target = createFakeEventTarget()

  return {
    ...target,
    dispatchKeyDown: (event: FakeKeyEvent) => {
      target.getListeners('keydown').forEach(handler => handler(event))
    },
    documentElement: { style: { setProperty: jest.fn() } },
  }
}

export const installFakeDom = (): FakeDom => {
  const windowTarget = createFakeEventTarget()
  const documentTarget = createFakeDocument()

  Object.defineProperty(global, 'window', {
    configurable: true,
    value: windowTarget,
    writable: true,
  })
  Object.defineProperty(global, 'document', {
    configurable: true,
    value: documentTarget,
    writable: true,
  })

  const dispatchKeyDown = (event: FakeKeyEvent) => documentTarget.dispatchKeyDown(event)

  return {
    dispatchKeyDown,
    document: documentTarget,
    fireBlur: () => {
      windowTarget.getListeners('blur').forEach(handler => handler())
    },
    fireDocumentKeyDown: dispatchKeyDown,
    fireKeyDown: (event: FakeKeyEvent) => {
      windowTarget.getListeners('keydown').forEach(handler => handler(event))
    },
    fireKeyUp: (event: FakeKeyEvent) => {
      windowTarget.getListeners('keyup').forEach(handler => handler(event))
    },
    getListenerCount: () => documentTarget.getListenerCount(),
    restore: () => {
      // Leave no-op stubs behind: React unmounts the tree after the test
      // finishes, and effect cleanups call removeEventListener on window/document.
      const noopStub = {
        addEventListener: jest.fn(),
        documentElement: { style: { setProperty: jest.fn() } },
        removeEventListener: jest.fn(),
      }
      Object.defineProperty(global, 'window', {
        configurable: true,
        value: noopStub,
        writable: true,
      })
      Object.defineProperty(global, 'document', {
        configurable: true,
        value: noopStub,
        writable: true,
      })
    },
    window: windowTarget,
  }
}
