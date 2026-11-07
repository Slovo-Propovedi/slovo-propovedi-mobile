import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { playlistEngine } from './PlaylistEngine'

const SOURCE = 'https://example.com/audio.mp3'
const TRACK: AudioPlayerData = {
  artist: 'Author',
  artwork: 'https://example.com/art.jpg',
  audioUrl: SOURCE,
  id: 'sermon-1',
  title: 'Sermon 1',
}

const mockCreateAudioPlaylist = jest.fn()
const mockAttachPlaylistListeners = jest.fn()
let mockEmitCount: null | number = 3

jest.mock('expo-audio', () => ({
  createAudioPlaylist: (...args: unknown[]) => mockCreateAudioPlaylist(...args),
}))

jest.mock('entities/offline-cache/@x/player', () => ({ PART_SUFFIX: '.cache.mp3' }))
jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))
jest.mock('./LockScreenControls', () => ({ lockScreenControls: { clear: jest.fn() } }))
jest.mock('./awaitPlaylistLoaded', () => ({
  awaitPlaylistLoaded: jest.fn().mockResolvedValue(true),
}))
jest.mock('./partialDuration', () => ({ applyPartialDuration: jest.fn() }))
jest.mock('./playlistEngineListeners', () => ({
  attachPlaylistListeners: (...args: unknown[]) => mockAttachPlaylistListeners(...args),
}))

const createPlaylistStub = () => ({
  currentTime: 0,
  destroy: jest.fn(),
  duration: 120,
  isLoaded: true,
  skipTo: jest.fn(),
})

beforeEach(() => {
  jest.clearAllMocks()
  mockCreateAudioPlaylist.mockReturnValue(createPlaylistStub())
  mockAttachPlaylistListeners.mockImplementation((...args: unknown[]) => {
    const onAutoAdvanceCount = args[5]
    if (typeof onAutoAdvanceCount === 'function' && mockEmitCount !== null)
      onAutoAdvanceCount(mockEmitCount)
    return { status: null, track: null }
  })
  playlistEngine.setCallbacks({ onStatus: jest.fn(), onTrackChanged: jest.fn() })
})

describe('PlaylistEngine auto-advance baseline', () => {
  test('exposes the counter reported by native events and resets it on queue rebuild', async () => {
    mockEmitCount = 3
    await playlistEngine.buildQueue([TRACK], [SOURCE], 0, 'none')

    expect(playlistEngine.getAutoAdvanceCount()).toBe(3)

    mockEmitCount = null
    await playlistEngine.buildQueue([TRACK], [SOURCE], 0, 'none')

    expect(playlistEngine.getAutoAdvanceCount()).toBeNull()
  })
})
