import { act, render } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { useNativeDragGuard } from './useNativeDragGuard'

type DragStartHandler = (event: unknown) => void

const createFakeNode = () => {
  const listeners: Record<string, DragStartHandler[]> = {}
  return {
    addEventListener: jest.fn((type: string, handler: DragStartHandler, _opts?: unknown) => {
      ;(listeners[type] ??= []).push(handler)
    }),
    dataset: {} as Record<string, string>,
    dispatch: (type: string, event: unknown) => {
      listeners[type]?.forEach(handler => handler(event))
    },
    removeEventListener: jest.fn(),
  }
}

const renderGuard = async (): Promise<((node: unknown) => void) | null> => {
  let containerRef: ((node: unknown) => void) | null = null
  const Harness = () => {
    containerRef = useNativeDragGuard()
    return null
  }
  await render(<Harness />)
  return containerRef
}

describe('useNativeDragGuard', () => {
  test('prevents dragstart on web', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const containerRef = await renderGuard()

      const node = createFakeNode()
      await act(async () => {
        containerRef?.(node)
      })

      const event = { preventDefault: jest.fn() }
      await act(async () => {
        node.dispatch('dragstart', event)
      })

      expect(event.preventDefault).toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('does not attach listener off web', async () => {
    const containerRef = await renderGuard()

    const node = createFakeNode()
    await act(async () => {
      containerRef?.(node)
    })

    expect(node.addEventListener).not.toHaveBeenCalled()
  })

  test('marks the container with data-marquee-drag on web', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const containerRef = await renderGuard()

      const node = createFakeNode()
      await act(async () => {
        containerRef?.(node)
      })

      expect(node.dataset.marqueeDrag).toBe('true')
    } finally {
      restorePlatform.restore()
    }
  })

  test('removes the marker on cleanup', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      let containerRef: ((node: unknown) => void) | null = null
      const Harness = () => {
        containerRef = useNativeDragGuard()
        return null
      }
      const { unmount } = await render(<Harness />)

      const node = createFakeNode()
      await act(async () => {
        containerRef?.(node)
      })

      await act(async () => {
        unmount()
      })

      expect(node.dataset.marqueeDrag).toBeUndefined()
    } finally {
      restorePlatform.restore()
    }
  })

  test('cleans up listener on unmount', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      let containerRef: ((node: unknown) => void) | null = null
      const Harness = () => {
        containerRef = useNativeDragGuard()
        return null
      }
      const { unmount } = await render(<Harness />)

      const node = createFakeNode()
      await act(async () => {
        containerRef?.(node)
      })

      await act(async () => {
        unmount()
      })

      expect(node.removeEventListener).toHaveBeenCalledWith('dragstart', expect.any(Function), {
        capture: true,
      })
    } finally {
      restorePlatform.restore()
    }
  })
})
