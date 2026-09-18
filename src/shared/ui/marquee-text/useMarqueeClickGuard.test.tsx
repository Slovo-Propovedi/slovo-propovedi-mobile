import { act, render } from '@testing-library/react-native'
import { Platform } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import { useMarqueeClickGuard } from './useMarqueeClickGuard'

type ClickHandler = (event: unknown) => void

const createFakeNode = () => {
  const listeners: Record<string, ClickHandler[]> = {}
  return {
    addEventListener: jest.fn((type: string, handler: ClickHandler) => {
      ;(listeners[type] ??= []).push(handler)
    }),
    dispatch: (type: string, event: unknown) => {
      listeners[type]?.forEach(handler => handler(event))
    },
    removeEventListener: jest.fn(),
  }
}

const renderGuard = async (
  didDrag: SharedValue<boolean>,
): Promise<((node: unknown) => void) | null> => {
  let containerRef: ((node: unknown) => void) | null = null
  const Harness = () => {
    containerRef = useMarqueeClickGuard(didDrag)
    return null
  }
  await render(<Harness />)
  return containerRef
}

describe('useMarqueeClickGuard', () => {
  test('swallows the click that follows a drag', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const didDrag = { value: true } as SharedValue<boolean>
      const containerRef = await renderGuard(didDrag)

      const node = createFakeNode()
      await act(async () => {
        containerRef?.(node)
      })

      const event = { stopPropagation: jest.fn() }
      await act(async () => {
        node.dispatch('click', event)
      })

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(didDrag.value).toBe(false)
    } finally {
      restorePlatform.restore()
    }
  })

  test('lets a plain click through when no drag happened', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const didDrag = { value: false } as SharedValue<boolean>
      const containerRef = await renderGuard(didDrag)

      const node = createFakeNode()
      await act(async () => {
        containerRef?.(node)
      })

      const event = { stopPropagation: jest.fn() }
      await act(async () => {
        node.dispatch('click', event)
      })

      expect(event.stopPropagation).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('attaches the listener only on web', async () => {
    const didDrag = { value: true } as SharedValue<boolean>
    const containerRef = await renderGuard(didDrag)

    const node = createFakeNode()
    await act(async () => {
      containerRef?.(node)
    })

    expect(node.addEventListener).not.toHaveBeenCalled()
  })
})
