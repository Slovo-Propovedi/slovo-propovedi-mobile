import { act, render } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { type FakeDom, installFakeDom } from 'shared/lib/testing'
import { useMouseDragScroll } from './useMouseDragScroll'

type PointerHandler = (event: unknown) => void

const createScrollableNode = () => ({
  scrollLeft: 0,
  style: { cursor: '' },
})

const createFakeWrapper = (scrollable: ReturnType<typeof createScrollableNode>) => {
  const listeners: Record<string, PointerHandler[]> = {}
  return {
    addEventListener: jest.fn((type: string, handler: PointerHandler, _opts?: unknown) => {
      ;(listeners[type] ??= []).push(handler)
    }),
    dispatch: (type: string, event: unknown) => {
      listeners[type]?.forEach(handler => handler(event))
    },
    firstElementChild: scrollable,
    removeEventListener: jest.fn(),
  }
}

const renderHook = async (): Promise<((node: unknown) => void) | null> => {
  let wrapperRef: ((node: unknown) => void) | null = null
  const Harness = () => {
    wrapperRef = useMouseDragScroll()
    return null
  }
  await render(<Harness />)
  return wrapperRef
}

const fireWindowPointerMove = (fakeDom: FakeDom, clientX: number) => {
  fakeDom.window.getListeners('pointermove').forEach(handler => handler({ clientX }))
}

const fireWindowPointerUp = (fakeDom: FakeDom) => {
  fakeDom.window.getListeners('pointerup').forEach(handler => handler())
}

describe('useMouseDragScroll', () => {
  let fakeDom: FakeDom

  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'web')
    fakeDom = installFakeDom()
  })

  afterEach(() => {
    fakeDom.restore()
    jest.restoreAllMocks()
  })

  test('scrolls 1:1 with pointer movement on web', async () => {
    const wrapperRef = await renderHook()
    const scrollable = createScrollableNode()
    const wrapper = createFakeWrapper(scrollable)

    await act(async () => {
      wrapperRef?.(wrapper)
    })

    await act(async () => {
      wrapper.dispatch('pointerdown', { button: 0, clientX: 100, pointerType: 'mouse' })
    })
    expect(scrollable.style.cursor).toBe('grabbing')

    await act(async () => {
      fireWindowPointerMove(fakeDom, 120)
    })
    expect(scrollable.scrollLeft).toBe(-20)

    await act(async () => {
      fireWindowPointerMove(fakeDom, 90)
    })
    expect(scrollable.scrollLeft).toBe(10)

    await act(async () => {
      fireWindowPointerUp(fakeDom)
    })
    expect(scrollable.style.cursor).toBe('')
  })

  test('swallows the click after a drag over the threshold', async () => {
    const wrapperRef = await renderHook()
    const scrollable = createScrollableNode()
    const wrapper = createFakeWrapper(scrollable)

    await act(async () => {
      wrapperRef?.(wrapper)
    })

    await act(async () => {
      wrapper.dispatch('pointerdown', { button: 0, clientX: 100, pointerType: 'mouse' })
    })
    await act(async () => {
      fireWindowPointerMove(fakeDom, 110)
    })
    await act(async () => {
      fireWindowPointerUp(fakeDom)
    })

    const clickEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() }
    await act(async () => {
      wrapper.dispatch('click', clickEvent)
    })

    expect(clickEvent.preventDefault).toHaveBeenCalled()
    expect(clickEvent.stopPropagation).toHaveBeenCalled()
  })

  test('ignores touch pointerdown', async () => {
    const wrapperRef = await renderHook()
    const scrollable = createScrollableNode()
    const wrapper = createFakeWrapper(scrollable)

    await act(async () => {
      wrapperRef?.(wrapper)
    })

    await act(async () => {
      wrapper.dispatch('pointerdown', { button: 0, clientX: 100, pointerType: 'touch' })
    })

    expect(fakeDom.window.addEventListener).not.toHaveBeenCalledWith(
      'pointermove',
      expect.any(Function),
    )
    expect(scrollable.style.cursor).toBe('')
  })

  test('does not scroll when the drag starts inside a marquee title', async () => {
    const wrapperRef = await renderHook()
    const scrollable = createScrollableNode()
    const wrapper = createFakeWrapper(scrollable)

    await act(async () => {
      wrapperRef?.(wrapper)
    })

    const marqueeTarget = { closest: jest.fn(() => ({})) }
    await act(async () => {
      wrapper.dispatch('pointerdown', {
        button: 0,
        clientX: 100,
        pointerType: 'mouse',
        target: marqueeTarget,
      })
    })

    expect(marqueeTarget.closest).toHaveBeenCalledWith('[data-marquee-drag]')
    expect(fakeDom.window.addEventListener).not.toHaveBeenCalledWith(
      'pointermove',
      expect.any(Function),
    )
    expect(scrollable.style.cursor).toBe('')
  })

  test('prevents dragstart on the wrapper (no image ghost drag)', async () => {
    const wrapperRef = await renderHook()
    const wrapper = createFakeWrapper(createScrollableNode())

    await act(async () => {
      wrapperRef?.(wrapper)
    })

    const dragEvent = { preventDefault: jest.fn() }
    await act(async () => {
      wrapper.dispatch('dragstart', dragEvent)
    })

    expect(dragEvent.preventDefault).toHaveBeenCalled()
  })

  test('does not attach listeners off web', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios')
    const wrapperRef = await renderHook()
    const wrapper = createFakeWrapper(createScrollableNode())

    await act(async () => {
      wrapperRef?.(wrapper)
    })

    expect(wrapper.addEventListener).not.toHaveBeenCalled()
  })

  test('cleans up listeners on unmount', async () => {
    let wrapperRef: ((node: unknown) => void) | null = null
    const Harness = () => {
      wrapperRef = useMouseDragScroll()
      return null
    }
    const { unmount } = await render(<Harness />)
    const wrapper = createFakeWrapper(createScrollableNode())

    await act(async () => {
      wrapperRef?.(wrapper)
    })
    await act(async () => {
      wrapper.dispatch('pointerdown', { button: 0, clientX: 100, pointerType: 'mouse' })
    })

    await act(async () => {
      unmount()
    })

    expect(wrapper.removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
      true,
    )
    expect(wrapper.removeEventListener).toHaveBeenCalledWith(
      'dragstart',
      expect.any(Function),
      true,
    )
    expect(fakeDom.window.removeEventListener).toHaveBeenCalledWith(
      'pointermove',
      expect.any(Function),
    )
    expect(fakeDom.window.removeEventListener).toHaveBeenCalledWith(
      'pointerup',
      expect.any(Function),
    )
    expect(fakeDom.window.removeEventListener).toHaveBeenCalledWith(
      'pointercancel',
      expect.any(Function),
    )
  })
})
