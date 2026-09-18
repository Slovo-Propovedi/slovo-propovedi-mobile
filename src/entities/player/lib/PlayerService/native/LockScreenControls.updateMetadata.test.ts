import { type AudioPlayer } from 'expo-audio'
import { getLocalAppIconUri } from 'shared/lib/app-icon'
import { reportError } from 'shared/model/error-dialog'
import { lockScreenControls } from './LockScreenControls'

const LOCK_SCREEN_ERROR_MESSAGE = 'Не удалось обновить данные плеера на экране блокировки'

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

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const mockedGetLocalAppIconUri = jest.mocked(getLocalAppIconUri)
const mockedReportError = jest.mocked(reportError)

const createPlayer = (loaded = true) => {
  const setActiveForLockScreen = jest.fn()
  const updateLockScreenMetadata = jest.fn()
  const player = {
    isLoaded: loaded,
    setActiveForLockScreen,
    updateLockScreenMetadata,
  } as unknown as AudioPlayer

  return { player, setActiveForLockScreen, updateLockScreenMetadata }
}

const metadataStub = { title: 'Проповедь' }
const NEXT_TRACK_METADATA = { title: 'Вторая проповедь' }

describe('setMetadata replace-in-place paths', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockIsExpoGo.isExpoGo = false
    mockedGetLocalAppIconUri.mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('same player updates metadata in place without re-activating the session', () => {
    const { player, setActiveForLockScreen, updateLockScreenMetadata } = createPlayer()

    lockScreenControls.setMetadata(player, metadataStub)
    lockScreenControls.setMetadata(player, NEXT_TRACK_METADATA)

    expect(updateLockScreenMetadata).toHaveBeenCalledWith(NEXT_TRACK_METADATA)
    expect(setActiveForLockScreen).toHaveBeenCalledTimes(1)
  })

  test('update path sanitizes artwork the same way as activation', () => {
    const localIconUri = 'file:///cache/icon.png'
    mockedGetLocalAppIconUri.mockReturnValue(localIconUri)
    const { player, updateLockScreenMetadata } = createPlayer()

    lockScreenControls.setMetadata(player, metadataStub)
    lockScreenControls.setMetadata(player, {
      ...metadataStub,
      artworkUrl: 'assets_fallbackartwork',
    })

    expect(updateLockScreenMetadata).toHaveBeenCalledWith({
      ...metadataStub,
      artworkUrl: localIconUri,
    })
  })

  test('a new player gets a full session activation', () => {
    const first = createPlayer()
    lockScreenControls.setMetadata(first.player, metadataStub)

    const second = createPlayer()
    lockScreenControls.setMetadata(second.player, metadataStub)

    expect(second.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      metadataStub,
      expect.any(Object),
    )
    expect(second.updateLockScreenMetadata).not.toHaveBeenCalled()
  })

  test('clear() resets the tracked player so the next setMetadata re-activates', () => {
    const { player, setActiveForLockScreen, updateLockScreenMetadata } = createPlayer()

    lockScreenControls.setMetadata(player, metadataStub)
    lockScreenControls.clear(player)
    expect(setActiveForLockScreen).toHaveBeenCalledWith(false)

    lockScreenControls.setMetadata(player, metadataStub)
    const calls = setActiveForLockScreen.mock.calls
    expect(calls[calls.length - 1][0]).toBe(true)
    expect(updateLockScreenMetadata).not.toHaveBeenCalled()
  })

  test('same player retries the metadata update until loaded', () => {
    jest.useFakeTimers()
    const { player, setActiveForLockScreen, updateLockScreenMetadata } = createPlayer(false)

    lockScreenControls.setMetadata(player, metadataStub)
    lockScreenControls.setMetadata(player, NEXT_TRACK_METADATA)

    Object.defineProperty(player, 'isLoaded', { value: true })
    jest.advanceTimersByTime(200)

    expect(updateLockScreenMetadata).toHaveBeenCalledWith(NEXT_TRACK_METADATA)
    expect(setActiveForLockScreen).not.toHaveBeenCalled()

    jest.useRealTimers()
  })

  test('does not propagate a native rejection from the update path', () => {
    const { player, updateLockScreenMetadata } = createPlayer()

    lockScreenControls.setMetadata(player, metadataStub)
    updateLockScreenMetadata.mockImplementation(() => {
      throw new Error('native update failed')
    })

    expect(() => lockScreenControls.setMetadata(player, metadataStub)).not.toThrow()
    expect(mockedReportError).toHaveBeenCalledWith(expect.any(Error), LOCK_SCREEN_ERROR_MESSAGE)
  })
})

describe('reassertMetadata foreground re-assertion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockIsExpoGo.isExpoGo = false
    mockedGetLocalAppIconUri.mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('always takes the full activation path, even for the already-tracked player', () => {
    const { player, setActiveForLockScreen, updateLockScreenMetadata } = createPlayer()

    lockScreenControls.setMetadata(player, metadataStub)
    lockScreenControls.reassertMetadata(player, NEXT_TRACK_METADATA)

    const activationCalls = setActiveForLockScreen.mock.calls.filter(call => call[0] === true)
    expect(activationCalls).toHaveLength(2)
    expect(activationCalls[1][1]).toEqual(NEXT_TRACK_METADATA)
    expect(updateLockScreenMetadata).not.toHaveBeenCalledWith(NEXT_TRACK_METADATA)
  })

  test('updates the tracked player so subsequent setMetadata uses the in-place update', () => {
    const first = createPlayer()
    lockScreenControls.setMetadata(first.player, metadataStub)

    const second = createPlayer()
    lockScreenControls.reassertMetadata(second.player, metadataStub)
    lockScreenControls.setMetadata(second.player, NEXT_TRACK_METADATA)

    expect(second.updateLockScreenMetadata).toHaveBeenCalledWith(NEXT_TRACK_METADATA)
    expect(second.setActiveForLockScreen).toHaveBeenCalledTimes(1)
  })

  test('sanitizes artwork the same way as the other paths', () => {
    const localIconUri = 'file:///cache/icon.png'
    mockedGetLocalAppIconUri.mockReturnValue(localIconUri)
    const { player, setActiveForLockScreen } = createPlayer()

    lockScreenControls.reassertMetadata(player, {
      ...metadataStub,
      artworkUrl: 'assets_fallbackartwork',
    })

    expect(setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      { ...metadataStub, artworkUrl: localIconUri },
      expect.any(Object),
    )
  })

  test('exits early for a null player without touching the native side', () => {
    expect(() => lockScreenControls.reassertMetadata(null, metadataStub)).not.toThrow()
  })
})
