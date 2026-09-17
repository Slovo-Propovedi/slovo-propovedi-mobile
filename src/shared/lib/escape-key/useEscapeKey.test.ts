import { act } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useEscapeKey } from './useEscapeKey'

interface KeyEventLike {
  altKey: boolean
  ctrlKey: boolean
  key: string
  metaKey: boolean
  shiftKey: boolean
  stopPropagation: () => void
}

const createKeyDownEvent = (
  key: string,
  modifiers: Partial<Pick<KeyEventLike, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>> = {},
): KeyEventLike => ({
  altKey: modifiers.altKey ?? false,
  ctrlKey: modifiers.ctrlKey ?? false,
  key,
  metaKey: modifiers.metaKey ?? false,
  shiftKey: modifiers.shiftKey ?? false,
  stopPropagation: jest.fn(),
})

interface FakeTarget {
  addEventListener: jest.Mock
  dispatchKeyDown: (event: KeyEventLike) => void
  getListenerCount: () => number
  removeEventListener: jest.Mock
}

const createFakeTarget = (): FakeTarget => {
  const listeners: Array<(event: KeyEventLike) => void> = []

  return {
    addEventListener: jest.fn((_type: string, handler: (event: KeyEventLike) => void) => {
      listeners.push(handler)
    }),
    dispatchKeyDown: (event: KeyEventLike) => {
      listeners.forEach(handler => handler(event))
    },
    getListenerCount: () => listeners.length,
    removeEventListener: jest.fn((_type: string, handler: (event: KeyEventLike) => void) => {
      const index = listeners.indexOf(handler)
      if (index !== -1) listeners.splice(index, 1)
    }),
  }
}

// jest-expo runs in a node environment: there is no real DOM, and `window` is
// aliased to `global`. This installs a fake `window` (with a self-referencing
// `window` property and a `document` property) that records keydown listeners,
// mirroring the fake-DOM pattern from shared/ui/modal.test.tsx.
const installFakeDom = () => {
  const documentTarget = createFakeTarget()
  const windowTarget = createFakeTarget()
  const fakeWindow: Record<string, unknown> = { ...windowTarget, document: documentTarget }
  fakeWindow.window = fakeWindow

  Object.defineProperty(global, 'window', {
    configurable: true,
    value: fakeWindow,
    writable: true,
  })

  return {
    documentTarget,
    restore: () => {
      // Leave a no-op stub behind: React unmounts the tree after the test
      // finishes, and the hook's effect cleanup calls removeEventListener.
      Object.defineProperty(global, 'window', {
        configurable: true,
        value: {
          document: { addEventListener: jest.fn(), removeEventListener: jest.fn() },
          window: { addEventListener: jest.fn(), removeEventListener: jest.fn() },
        },
        writable: true,
      })
    },
    windowTarget,
  }
}

describe('useEscapeKey', () => {
  test('attaches a document keydown listener when enabled on web', async () => {
    const { documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderHookWithProviders(() => useEscapeKey({ enabled: true, onEscape: jest.fn() }))

      expect(documentTarget.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        { capture: false },
      )
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('detaches the listener when enabled flips to false', async () => {
    const { documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const { rerender } = await renderHookWithProviders(
        (props: { enabled: boolean }) =>
          useEscapeKey({ enabled: props.enabled, onEscape: jest.fn() }),
        { initialProps: { enabled: true } },
      )

      expect(documentTarget.getListenerCount()).toBe(1)

      await rerender({ enabled: false })

      expect(documentTarget.getListenerCount()).toBe(0)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('fires onEscape and stops propagation for a claimed Escape', async () => {
    const { documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onEscape = jest.fn()
      await renderHookWithProviders(() => useEscapeKey({ enabled: true, onEscape }))

      const event = createKeyDownEvent('Escape')
      await act(async () => {
        documentTarget.dispatchKeyDown(event)
      })

      expect(onEscape).toHaveBeenCalledWith(event)
      expect(event.stopPropagation).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('ignores Escape with a modifier held', async () => {
    const { documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onEscape = jest.fn()
      await renderHookWithProviders(() => useEscapeKey({ enabled: true, onEscape }))

      const event = createKeyDownEvent('Escape', { ctrlKey: true })
      await act(async () => {
        documentTarget.dispatchKeyDown(event)
      })

      expect(onEscape).not.toHaveBeenCalled()
      expect(event.stopPropagation).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('attaches no listener on native platforms', async () => {
    const { documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      await renderHookWithProviders(() => useEscapeKey({ enabled: true, onEscape: jest.fn() }))

      expect(documentTarget.getListenerCount()).toBe(0)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('uses the latest onEscape callback without re-subscribing', async () => {
    const { documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const firstCallback = jest.fn()
      const secondCallback = jest.fn()
      const { rerender } = await renderHookWithProviders(
        (props: { onEscape: () => void }) =>
          useEscapeKey({ enabled: true, onEscape: props.onEscape }),
        { initialProps: { onEscape: firstCallback } },
      )

      expect(documentTarget.getListenerCount()).toBe(1)

      await rerender({ onEscape: secondCallback })

      expect(documentTarget.getListenerCount()).toBe(1)
      expect(documentTarget.removeEventListener).not.toHaveBeenCalled()

      const event = createKeyDownEvent('Escape')
      await act(async () => {
        documentTarget.dispatchKeyDown(event)
      })

      expect(secondCallback).toHaveBeenCalledTimes(1)
      expect(firstCallback).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('attaches to window when scope is window', async () => {
    const { restore, windowTarget } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onEscape = jest.fn()
      await renderHookWithProviders(() =>
        useEscapeKey({ enabled: true, onEscape, scope: 'window' }),
      )

      expect(windowTarget.getListenerCount()).toBe(1)

      const event = createKeyDownEvent('Escape')
      await act(async () => {
        windowTarget.dispatchKeyDown(event)
      })

      expect(onEscape).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('passes the capture option through to addEventListener', async () => {
    const { documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderHookWithProviders(() =>
        useEscapeKey({ capture: true, enabled: true, onEscape: jest.fn() }),
      )

      expect(documentTarget.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        { capture: true },
      )
    } finally {
      restorePlatform.restore()
      restore()
    }
  })
})
