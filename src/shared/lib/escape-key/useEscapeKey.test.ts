import { act } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { createKeyDownEvent, installFakeDom } from 'shared/lib/testing'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { popEscapeLayer, pushEscapeLayer } from './escapeStack'
import { useEscapeKey } from './useEscapeKey'

describe('useEscapeKey', () => {
  test('attaches a single document keydown listener when the first layer enables on web', async () => {
    const { document: documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderHookWithProviders(() => useEscapeKey({ enabled: true, onEscape: jest.fn() }))

      expect(documentTarget.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        { capture: true },
      )
      expect(documentTarget.getListenerCount()).toBe(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('detaches the listener when the last layer disables', async () => {
    const { document: documentTarget, restore } = installFakeDom()
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

  test('keeps a single listener across 0→1→2→1→0 layers', async () => {
    const { document: documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const first = await renderHookWithProviders(() =>
        useEscapeKey({ enabled: true, onEscape: jest.fn() }),
      )
      expect(documentTarget.getListenerCount()).toBe(1)

      const second = await renderHookWithProviders(() =>
        useEscapeKey({ enabled: true, onEscape: jest.fn() }),
      )
      expect(documentTarget.getListenerCount()).toBe(1)

      await act(async () => {
        first.unmount()
      })
      expect(documentTarget.getListenerCount()).toBe(1)

      await act(async () => {
        second.unmount()
      })
      expect(documentTarget.getListenerCount()).toBe(0)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('dispatches Escape to the topmost layer only (LIFO)', async () => {
    const { document: documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const olderOnEscape = jest.fn()
      const newerOnEscape = jest.fn()
      await renderHookWithProviders(() => useEscapeKey({ enabled: true, onEscape: olderOnEscape }))
      const newer = await renderHookWithProviders(() =>
        useEscapeKey({ enabled: true, onEscape: newerOnEscape }),
      )

      const event = createKeyDownEvent('Escape')
      await act(async () => {
        documentTarget.dispatchKeyDown(event)
      })

      expect(newerOnEscape).toHaveBeenCalledTimes(1)
      expect(olderOnEscape).not.toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalledTimes(1)

      await act(async () => {
        newer.unmount()
      })

      const secondEvent = createKeyDownEvent('Escape')
      await act(async () => {
        documentTarget.dispatchKeyDown(secondEvent)
      })

      expect(olderOnEscape).toHaveBeenCalledTimes(1)
      expect(secondEvent.stopPropagation).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('fires onEscape and stops propagation once for a claimed Escape', async () => {
    const { document: documentTarget, restore } = installFakeDom()
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
    const { document: documentTarget, restore } = installFakeDom()
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

  test('ignores non-Escape keys', async () => {
    const { document: documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onEscape = jest.fn()
      await renderHookWithProviders(() => useEscapeKey({ enabled: true, onEscape }))

      const event = createKeyDownEvent('Enter')
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
    const { document: documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      await renderHookWithProviders(() => useEscapeKey({ enabled: true, onEscape: jest.fn() }))

      expect(documentTarget.getListenerCount()).toBe(0)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('uses the latest onEscape callback per layer without re-registering', async () => {
    const { document: documentTarget, restore } = installFakeDom()
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

  test('push/pop stays balanced under a double effect run (StrictMode-safe)', () => {
    const { document: documentTarget, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onEscapeRef = { current: jest.fn() }

      const firstId = pushEscapeLayer(onEscapeRef)
      expect(documentTarget.getListenerCount()).toBe(1)

      popEscapeLayer(firstId)
      expect(documentTarget.getListenerCount()).toBe(0)

      const secondId = pushEscapeLayer(onEscapeRef)
      expect(documentTarget.getListenerCount()).toBe(1)

      popEscapeLayer(secondId)
      expect(documentTarget.getListenerCount()).toBe(0)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })
})
