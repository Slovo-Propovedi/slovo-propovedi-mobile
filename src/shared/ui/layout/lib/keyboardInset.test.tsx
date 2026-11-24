import { act, renderHook } from '@testing-library/react-native'
import { Keyboard, Platform } from 'react-native'
import { keyboardBottomInsetSv, useKeyboardBottomInsetSync } from './keyboardInset'

type KeyboardListener = (event: { endCoordinates: { height: number } }) => void
type VisualViewportListener = (event: Event) => void

const showListeners: KeyboardListener[] = []
const hideListeners: KeyboardListener[] = []
const removeSpies: jest.Mock[] = []

const captureListeners = (event: string, listener: KeyboardListener) => {
  const target = event === 'keyboardDidShow' ? showListeners : hideListeners
  const remove = jest.fn()

  target.push(listener)
  removeSpies.push(remove)

  return { remove }
}

const emit = async (listeners: KeyboardListener[], height: number) => {
  await act(async () => {
    for (const listener of listeners) listener({ endCoordinates: { height } })
  })
}

interface MockVisualViewport {
  addEventListener: jest.Mock
  height: number
  offsetTop: number
  removeEventListener: jest.Mock
}

const createMockVisualViewport = (height: number, offsetTop = 0): MockVisualViewport => ({
  addEventListener: jest.fn(),
  height,
  offsetTop,
  removeEventListener: jest.fn(),
})

const getViewportListeners = (
  viewport: MockVisualViewport,
  event: string,
): VisualViewportListener[] =>
  viewport.addEventListener.mock.calls
    .filter(([name]) => name === event)
    .map(([, listener]) => listener as VisualViewportListener)

const emitViewport = async (viewport: MockVisualViewport, event: string) => {
  await act(async () => {
    for (const listener of getViewportListeners(viewport, event)) listener(new Event(event))
  })
}

const setMockVisualViewport = (viewport: MockVisualViewport | undefined) => {
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
    writable: true,
  })
}

describe('useKeyboardBottomInsetSync', () => {
  beforeEach(() => {
    keyboardBottomInsetSv.value = 0
    showListeners.length = 0
    hideListeners.length = 0
    removeSpies.length = 0
    jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation(captureListeners as unknown as typeof Keyboard.addListener)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('tracks the keyboard height on show and resets it on hide', async () => {
    await renderHook(() => useKeyboardBottomInsetSync())

    await emit(showListeners, 320)

    expect(keyboardBottomInsetSv.value).toBe(320)

    await emit(hideListeners, 0)

    expect(keyboardBottomInsetSv.value).toBe(0)
  })

  test('keeps the last valid height when an event carries an invalid height', async () => {
    await renderHook(() => useKeyboardBottomInsetSync())

    await emit(showListeners, 240)
    await emit(showListeners, Number.NaN)
    await emit(showListeners, -10)

    expect(keyboardBottomInsetSv.value).toBe(240)
  })

  test('removes both keyboard subscriptions on unmount', async () => {
    const { unmount } = await renderHook(() => useKeyboardBottomInsetSync())

    await act(async () => unmount())

    expect(removeSpies).toHaveLength(2)
    for (const remove of removeSpies) expect(remove).toHaveBeenCalled()
  })

  test('does not subscribe to native keyboard on web without visualViewport', async () => {
    jest.replaceProperty(Platform, 'OS', 'web')
    setMockVisualViewport(undefined)

    await renderHook(() => useKeyboardBottomInsetSync())

    expect(Keyboard.addListener).not.toHaveBeenCalled()
  })
})

describe('useKeyboardBottomInsetSync on web', () => {
  let viewport: MockVisualViewport

  beforeEach(() => {
    keyboardBottomInsetSv.value = 0
    jest.replaceProperty(Platform, 'OS', 'web')
    viewport = createMockVisualViewport(800, 0)
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800, writable: true })
    Object.defineProperty(window, 'addEventListener', {
      configurable: true,
      value: jest.fn(),
      writable: true,
    })
    Object.defineProperty(window, 'removeEventListener', {
      configurable: true,
      value: jest.fn(),
      writable: true,
    })
    setMockVisualViewport(viewport)
  })

  afterEach(() => {
    delete (window as { visualViewport?: unknown }).visualViewport
    delete (window as { addEventListener?: unknown }).addEventListener
    delete (window as { removeEventListener?: unknown }).removeEventListener
    jest.restoreAllMocks()
  })

  test('syncs the toolbar band from visualViewport and ignores noise', async () => {
    await renderHook(() => useKeyboardBottomInsetSync())

    expect(keyboardBottomInsetSv.value).toBe(0)

    viewport.height = 720
    await emitViewport(viewport, 'resize')
    expect(keyboardBottomInsetSv.value).toBe(80)

    // Noise: 1px band is ignored (threshold < 2).
    viewport.height = 799
    await emitViewport(viewport, 'resize')
    expect(keyboardBottomInsetSv.value).toBe(0)
  })

  test('handles keyboard case where visualViewport shrinks while innerHeight stays', async () => {
    viewport.height = 400
    await renderHook(() => useKeyboardBottomInsetSync())

    expect(keyboardBottomInsetSv.value).toBe(400)
  })

  test('removes visualViewport listeners on unmount', async () => {
    const { unmount } = await renderHook(() => useKeyboardBottomInsetSync())

    await act(async () => unmount())

    expect(viewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(viewport.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
