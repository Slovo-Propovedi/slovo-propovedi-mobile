import { act, renderHook } from '@testing-library/react-native'
import { Keyboard, Platform } from 'react-native'
import { keyboardBottomInsetSv, useKeyboardBottomInsetSync } from './keyboardInset'

type KeyboardListener = (event: { endCoordinates: { height: number } }) => void

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

  test('does not subscribe on web, where the chrome stays in place', async () => {
    jest.replaceProperty(Platform, 'OS', 'web')

    await renderHook(() => useKeyboardBottomInsetSync())

    expect(Keyboard.addListener).not.toHaveBeenCalled()
  })
})
