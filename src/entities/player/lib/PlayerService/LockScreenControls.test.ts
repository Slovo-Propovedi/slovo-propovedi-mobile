import { type AudioPlayer } from 'expo-audio'
import { getLocalAppIconUri } from 'shared/lib/app-icon'
import { lockScreenControls } from './LockScreenControls'

const mockIsExpoGo = { isExpoGo: false }

jest.mock('shared/lib/isExpoEnvironment', () => ({
  get isExpoGo() {
    return mockIsExpoGo.isExpoGo
  },
}))

jest.mock('shared/lib/app-icon', () => ({
  getLocalAppIconUri: jest.fn(),
}))

const mockedGetLocalAppIconUri = jest.mocked(getLocalAppIconUri)

const createPlayer = () => {
  const setActiveForLockScreen = jest.fn()
  const player = { isLoaded: true, setActiveForLockScreen } as unknown as AudioPlayer

  return { player, setActiveForLockScreen }
}

const metadataStub = { title: 'Проповедь' }

describe('LockScreenControls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsExpoGo.isExpoGo = false
    mockedGetLocalAppIconUri.mockReturnValue(null)
  })

  test('passes a valid artworkUrl to the native side as-is', () => {
    const { player, setActiveForLockScreen } = createPlayer()
    const artworkUrl = 'https://example.com/art.jpg'

    lockScreenControls.setMetadata(player, { ...metadataStub, artworkUrl })

    expect(setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      { ...metadataStub, artworkUrl },
      expect.any(Object),
    )
  })

  test('never sends an empty artworkUrl to the native side', () => {
    const { player, setActiveForLockScreen } = createPlayer()
    const localIconUri = 'file:///cache/icon.png'
    mockedGetLocalAppIconUri.mockReturnValue(localIconUri)

    lockScreenControls.setMetadata(player, { ...metadataStub, artworkUrl: '' })

    expect(setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      { ...metadataStub, artworkUrl: localIconUri },
      expect.any(Object),
    )
  })

  test('sends undefined artworkUrl when no artwork and no local icon are available', () => {
    const { player, setActiveForLockScreen } = createPlayer()

    lockScreenControls.setMetadata(player, { ...metadataStub, artworkUrl: '' })

    expect(setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      { ...metadataStub, artworkUrl: undefined },
      expect.any(Object),
    )
  })

  test('does not call the native side when the player is null', () => {
    const { setActiveForLockScreen } = createPlayer()

    lockScreenControls.setMetadata(null, metadataStub)

    expect(setActiveForLockScreen).not.toHaveBeenCalled()
  })

  test('does not call the native side when running in Expo Go', () => {
    mockIsExpoGo.isExpoGo = true
    const { player, setActiveForLockScreen } = createPlayer()

    lockScreenControls.setMetadata(player, {
      ...metadataStub,
      artworkUrl: 'https://example.com/art.jpg',
    })

    expect(setActiveForLockScreen).not.toHaveBeenCalled()
  })
})
