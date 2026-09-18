import { type AudioPlayer } from 'expo-audio'
import { lockScreenControls } from './LockScreenControls'

jest.mock('shared/lib/isExpoEnvironment', () => ({
  get isExpoGo() {
    return false
  },
}))

jest.mock('shared/lib/app-icon', () => ({
  ...jest.requireActual('shared/lib/app-icon'),
  getLocalAppIconUri: jest.fn(),
}))

const createPlayer = (loaded = true) => {
  const setActiveForLockScreen = jest.fn()
  const player = {
    isLoaded: loaded,
    setActiveForLockScreen,
  } as unknown as AudioPlayer

  return { player, setActiveForLockScreen }
}

const metadataStub = { title: 'Проповедь' }

describe('clear', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls setActiveForLockScreen(false) on a loaded player', () => {
    const { player, setActiveForLockScreen } = createPlayer()

    lockScreenControls.clear(player)

    expect(setActiveForLockScreen).toHaveBeenCalledWith(false)
  })

  test('does nothing when player is null', () => {
    const { setActiveForLockScreen } = createPlayer()

    lockScreenControls.clear(null)

    expect(setActiveForLockScreen).not.toHaveBeenCalled()
  })

  test('invalidates in-flight retry loop', () => {
    jest.useFakeTimers()

    const setActiveForLockScreen = jest.fn()

    const player = {
      isLoaded: false,
      setActiveForLockScreen,
    } as unknown as AudioPlayer

    lockScreenControls.setMetadata(player, metadataStub)

    // Clear invalidates the retry
    lockScreenControls.clear(null)

    // Advance timers — retry should not fire
    jest.advanceTimersByTime(2000)

    expect(setActiveForLockScreen).not.toHaveBeenCalled()

    jest.useRealTimers()
  })
})
