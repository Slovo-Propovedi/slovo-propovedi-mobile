import { type AudioPlayer } from 'expo-audio'
import { lockScreenControls } from './LockScreenControls'

jest.mock('shared/lib/isExpoEnvironment', () => ({
  get isExpoGo() {
    return false
  },
}))

jest.mock('shared/lib/app-icon', () => ({
  getLocalAppIconUri: jest.fn(),
}))

const metadataStub = { title: 'Проповедь' }

describe('setMetadata (retry — player not loaded initially)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('retries until player loads, then calls setActiveForLockScreen', () => {
    const setActiveForLockScreen = jest.fn()
    const isLoadedValues = [false, false, true]
    let callIndex = 0

    const player = {
      get isLoaded() {
        return isLoadedValues[callIndex] ?? true
      },
      setActiveForLockScreen,
    } as unknown as AudioPlayer

    lockScreenControls.setMetadata(player, metadataStub)

    // First tick: still not loaded
    callIndex = 1
    jest.advanceTimersByTime(200)
    expect(setActiveForLockScreen).not.toHaveBeenCalled()

    // Second tick: loaded
    callIndex = 2
    jest.advanceTimersByTime(200)
    expect(setActiveForLockScreen).toHaveBeenCalledTimes(1)
    expect(setActiveForLockScreen).toHaveBeenCalledWith(true, metadataStub, expect.any(Object))
  })

  test('newer setMetadata supersedes stale retry loop', () => {
    const setActiveForLockScreen1 = jest.fn()
    const setActiveForLockScreen2 = jest.fn()

    const player1 = {
      isLoaded: false,
      setActiveForLockScreen: setActiveForLockScreen1,
    } as unknown as AudioPlayer

    const player2 = {
      get isLoaded() {
        return true
      },
      setActiveForLockScreen: setActiveForLockScreen2,
    } as unknown as AudioPlayer

    // First setMetadata — player not loaded, retry starts
    lockScreenControls.setMetadata(player1, { title: 'First' })

    // Second setMetadata — invalidates first retry, player2 is loaded
    lockScreenControls.setMetadata(player2, { title: 'Second' })

    jest.advanceTimersByTime(200)

    // First player's retry should have been invalidated
    expect(setActiveForLockScreen1).not.toHaveBeenCalled()
    // Second player applied immediately
    expect(setActiveForLockScreen2).toHaveBeenCalledTimes(1)
    expect(setActiveForLockScreen2).toHaveBeenCalledWith(
      true,
      { title: 'Second' },
      expect.any(Object),
    )
  })
})
