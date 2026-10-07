import { act, render } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { type FakeDom, installFakeDom } from '../../lib/testing/installFakeDom'
import { computeSpinnerTranslate, TRIGGER_DISTANCE } from './pull-to-refresh.lib'
import { usePullToRefreshGesture } from './usePullToRefreshGesture'

interface FakeScrollable {
  clientHeight: number
  parentElement: FakeScrollable | null
  scrollHeight: number
  scrollTop: number
}

type Gesture = ReturnType<typeof usePullToRefreshGesture>

const createScrollable = (scrollTop = 0): FakeScrollable => ({
  clientHeight: 100,
  parentElement: null,
  scrollHeight: 300,
  scrollTop,
})

const createTouchTarget = (scrollable: FakeScrollable) => ({
  clientHeight: 0,
  parentElement: scrollable,
  scrollHeight: 0,
  scrollTop: 0,
})

const createStyleNode = () => ({ addEventListener: jest.fn(), style: {} as Record<string, string> })

const createFakeWrapper = () => {
  const listeners: Record<string, Array<(event: unknown) => void>> = {}
  return {
    addEventListener: jest.fn((type: string, handler: (event: unknown) => void) => {
      ;(listeners[type] ??= []).push(handler)
    }),
    dispatch: (type: string, event: unknown) => {
      listeners[type]?.forEach(handler => handler(event))
    },
    removeEventListener: jest.fn((type: string, handler: (event: unknown) => void) => {
      const typeListeners = listeners[type]
      if (!typeListeners) return
      const index = typeListeners.indexOf(handler)
      if (index !== -1) typeListeners.splice(index, 1)
    }),
  }
}

const touch = (target: unknown, pageY: number) => ({ target, touches: [{ pageY }] })

const ZERO_TRANSFORM = 'translateY(0px)'

const renderGesture = async (onRefresh: () => Promise<void> | void, refreshing = false) => {
  let gesture: Gesture | null = null
  const Harness = () => {
    gesture = usePullToRefreshGesture({ onRefresh, refreshing })
    return null
  }
  await render(<Harness />)
  return () => {
    if (!gesture) throw new Error('gesture not captured')
    return gesture
  }
}

const attachNodes = async (
  gesture: Gesture,
  wrapper: ReturnType<typeof createFakeWrapper>,
  content: ReturnType<typeof createStyleNode>,
  spinner: ReturnType<typeof createStyleNode>,
) => {
  await act(async () => {
    gesture.wrapperRef(wrapper)
    gesture.contentRef(content)
    gesture.spinnerRef(spinner)
  })
}

describe('usePullToRefreshGesture', () => {
  let fakeDom: FakeDom

  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'web')
    fakeDom = installFakeDom()
    Object.assign(fakeDom.window, {
      getComputedStyle: jest.fn(() => ({ overflowY: 'auto' })),
    })
  })

  afterEach(() => {
    fakeDom.restore()
    jest.restoreAllMocks()
  })

  test('pulls the content down and triggers on refresh past the threshold', async () => {
    let resolveRefresh: () => void = () => {}
    const onRefresh = jest.fn(
      () =>
        new Promise<void>(resolve => {
          resolveRefresh = resolve
        }),
    )
    const getGesture = await renderGesture(onRefresh)
    const wrapper = createFakeWrapper()
    const content = createStyleNode()
    const spinner = createStyleNode()
    await attachNodes(getGesture(), wrapper, content, spinner)

    const target = createTouchTarget(createScrollable())
    await act(async () => {
      wrapper.dispatch('touchstart', touch(target, 100))
    })
    await act(async () => {
      wrapper.dispatch('touchmove', touch(target, 300))
    })
    expect(content.style.transform).toBe(`translateY(${TRIGGER_DISTANCE}px)`)
    expect(spinner.style.transform).toBe(
      `translateY(${computeSpinnerTranslate(TRIGGER_DISTANCE)}px)`,
    )

    await act(async () => {
      wrapper.dispatch('touchend', touch(target, 300))
    })
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(content.style.transform).toBe(`translateY(${TRIGGER_DISTANCE}px)`)
    expect(spinner.style.transform).toBe(
      `translateY(${computeSpinnerTranslate(TRIGGER_DISTANCE)}px)`,
    )

    await act(async () => {
      resolveRefresh()
    })
    expect(content.style.transform).toBe(ZERO_TRANSFORM)
    expect(spinner.style.transform).toBe(ZERO_TRANSFORM)
  })

  test('does not trigger below the threshold', async () => {
    const onRefresh = jest.fn()
    const getGesture = await renderGesture(onRefresh)
    const wrapper = createFakeWrapper()
    const content = createStyleNode()
    await attachNodes(getGesture(), wrapper, content, createStyleNode())

    const target = createTouchTarget(createScrollable())
    await act(async () => {
      wrapper.dispatch('touchstart', touch(target, 100))
    })
    await act(async () => {
      wrapper.dispatch('touchmove', touch(target, 200))
    })
    expect(content.style.transform).toBe('translateY(40px)')

    await act(async () => {
      wrapper.dispatch('touchend', touch(target, 200))
    })

    expect(onRefresh).not.toHaveBeenCalled()
    expect(content.style.transform).toBe(ZERO_TRANSFORM)
  })

  test('ignores a pull when the scroll container is not at the top', async () => {
    const onRefresh = jest.fn()
    const getGesture = await renderGesture(onRefresh)
    const wrapper = createFakeWrapper()
    const content = createStyleNode()
    await attachNodes(getGesture(), wrapper, content, createStyleNode())

    const target = createTouchTarget(createScrollable(50))
    await act(async () => {
      wrapper.dispatch('touchstart', touch(target, 100))
    })
    await act(async () => {
      wrapper.dispatch('touchmove', touch(target, 300))
    })
    await act(async () => {
      wrapper.dispatch('touchend', touch(target, 300))
    })

    expect(onRefresh).not.toHaveBeenCalled()
    expect(content.style.transform).toBe(ZERO_TRANSFORM)
  })

  test('debounces repeated pulls within the minimum interval', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    const getGesture = await renderGesture(onRefresh)
    const wrapper = createFakeWrapper()
    const content = createStyleNode()
    await attachNodes(getGesture(), wrapper, content, createStyleNode())

    const target = createTouchTarget(createScrollable())
    for (let pull = 0; pull < 2; pull += 1) {
      await act(async () => {
        wrapper.dispatch('touchstart', touch(target, 100))
      })
      await act(async () => {
        wrapper.dispatch('touchmove', touch(target, 300))
      })
      await act(async () => {
        wrapper.dispatch('touchend', touch(target, 300))
      })
    }

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  test('centers the spinner in the freed gap while refreshing', async () => {
    const getGesture = await renderGesture(jest.fn(), true)
    const wrapper = createFakeWrapper()
    const content = createStyleNode()
    const spinner = createStyleNode()
    await attachNodes(getGesture(), wrapper, content, spinner)

    expect(content.style.transform).toBe(`translateY(${TRIGGER_DISTANCE}px)`)
    expect(spinner.style.opacity).toBe('1')
    expect(spinner.style.transform).toBe(
      `translateY(${computeSpinnerTranslate(TRIGGER_DISTANCE)}px)`,
    )
  })

  test('touchcancel does not trigger a refresh', async () => {
    const onRefresh = jest.fn()
    const getGesture = await renderGesture(onRefresh)
    const wrapper = createFakeWrapper()
    await attachNodes(getGesture(), wrapper, createStyleNode(), createStyleNode())

    const target = createTouchTarget(createScrollable())
    await act(async () => {
      wrapper.dispatch('touchstart', touch(target, 100))
    })
    await act(async () => {
      wrapper.dispatch('touchmove', touch(target, 300))
    })
    await act(async () => {
      wrapper.dispatch('touchcancel', touch(target, 300))
    })

    expect(onRefresh).not.toHaveBeenCalled()
  })

  test('removes the touch listeners on unmount', async () => {
    const wrapper = createFakeWrapper()
    let gesture: Gesture | null = null
    const Harness = () => {
      gesture = usePullToRefreshGesture({ onRefresh: jest.fn(), refreshing: false })
      return null
    }
    const { unmount } = await render(<Harness />)
    if (!gesture) throw new Error('gesture not captured')

    await attachNodes(gesture, wrapper, createStyleNode(), createStyleNode())
    await act(async () => {
      unmount()
    })

    expect(wrapper.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(wrapper.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
  })
})
