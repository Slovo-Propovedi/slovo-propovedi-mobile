import { type AudioPlayer } from 'expo-audio'
import { getLocalAppIconUri } from 'shared/lib/app-icon'
import { reportError } from 'shared/model/error-dialog'
import { lockScreenControls } from './LockScreenControls'

const LOCK_SCREEN_ERROR_MESSAGE = 'Не удалось обновить данные плеера на экране блокировки'
const NATIVE_REJECTION_MESSAGE = 'Cannot cast value for field artworkUrl'
const mockIsExpoGo = { isExpoGo: false }

jest.mock('shared/lib/isExpoEnvironment', () => ({
  get isExpoGo() {
    return mockIsExpoGo.isExpoGo
  },
}))

jest.mock('shared/lib/app-icon', () => ({
  ...jest.requireActual('shared/lib/app-icon'),
  getLocalAppIconUri: jest.fn(),
}))

jest.mock('shared/model/error-dialog', () => ({
  reportError: jest.fn(),
}))

const mockedGetLocalAppIconUri = jest.mocked(getLocalAppIconUri)
const mockedReportError = jest.mocked(reportError)

const createPlayer = (loaded = true) => {
  const setActiveForLockScreen = jest.fn()
  const player = {
    isLoaded: loaded,
    setActiveForLockScreen,
  } as unknown as AudioPlayer

  return { player, setActiveForLockScreen }
}

const metadataStub = { title: 'Проповедь' }

describe('setMetadata artwork sanitization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsExpoGo.isExpoGo = false
    mockedGetLocalAppIconUri.mockReturnValue(null)
  })

  test('omits protocol-less artworkUrl from legacy stored data', () => {
    const { player, setActiveForLockScreen } = createPlayer()

    lockScreenControls.setMetadata(player, {
      ...metadataStub,
      artworkUrl: 'assets_fallbackartwork',
    })

    const metadataArg = setActiveForLockScreen.mock.calls[0][1]
    expect(metadataArg).toEqual(metadataStub)
    expect(Object.prototype.hasOwnProperty.call(metadataArg, 'artworkUrl')).toBe(false)
  })

  test('passes a valid https artworkUrl through unchanged', () => {
    const { player, setActiveForLockScreen } = createPlayer()
    const artworkUrl = 'https://example.com/cover.jpg'

    lockScreenControls.setMetadata(player, { ...metadataStub, artworkUrl })

    expect(setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      { ...metadataStub, artworkUrl },
      expect.any(Object),
    )
  })

  test('falls back to the local app icon when artwork is protocol-less', () => {
    const { player, setActiveForLockScreen } = createPlayer()
    const localIconUri = 'file:///cache/icon.png'
    mockedGetLocalAppIconUri.mockReturnValue(localIconUri)

    lockScreenControls.setMetadata(player, {
      ...metadataStub,
      artworkUrl: 'assets_fallbackartwork',
    })

    expect(setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      { ...metadataStub, artworkUrl: localIconUri },
      expect.any(Object),
    )
  })

  test('does not propagate a native rejection and reports the error', () => {
    const { player, setActiveForLockScreen } = createPlayer()
    setActiveForLockScreen.mockImplementation(() => {
      throw new Error(NATIVE_REJECTION_MESSAGE)
    })

    expect(() => lockScreenControls.setMetadata(player, metadataStub)).not.toThrow()
    expect(mockedReportError).toHaveBeenCalledWith(expect.any(Error), LOCK_SCREEN_ERROR_MESSAGE)
  })

  test('does not propagate a native rejection from the retry path', () => {
    jest.useFakeTimers()

    const setActiveForLockScreen = jest.fn(() => {
      throw new Error(NATIVE_REJECTION_MESSAGE)
    })
    const isLoadedValues = [false, true]
    let callIndex = 0

    const player = {
      get isLoaded() {
        return isLoadedValues[callIndex] ?? true
      },
      setActiveForLockScreen,
    } as unknown as AudioPlayer

    lockScreenControls.setMetadata(player, metadataStub)

    callIndex = 1
    expect(() => jest.advanceTimersByTime(200)).not.toThrow()
    expect(setActiveForLockScreen).toHaveBeenCalledTimes(1)
    expect(mockedReportError).toHaveBeenCalledWith(expect.any(Error), LOCK_SCREEN_ERROR_MESSAGE)

    jest.useRealTimers()
  })

  test('clear() does not propagate a native rejection and reports the error', () => {
    const { player, setActiveForLockScreen } = createPlayer()
    setActiveForLockScreen.mockImplementation(() => {
      throw new Error(NATIVE_REJECTION_MESSAGE)
    })

    expect(() => lockScreenControls.clear(player)).not.toThrow()
    expect(mockedReportError).toHaveBeenCalledWith(expect.any(Error), LOCK_SCREEN_ERROR_MESSAGE)
  })
})
