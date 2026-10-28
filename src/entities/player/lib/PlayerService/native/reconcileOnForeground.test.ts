import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, currentPlaylistAtom } from '../../../model'
import { flushProgress } from '../progressFlusher'
import { playlistEngine } from './PlaylistEngine'
import { reconcileOnForeground } from './reconcileOnForeground'

const CURRENT_AUDIO = { id: 'sermon-1' }
const CURRENT_PLAYLIST = { id: 'playlist-1', sermons: [{ id: 'sermon-1' }, { id: 'sermon-2' }] }
const ENGINE_STATUS = { durationMs: 120_000, isPlaying: true, positionMs: 42_000 }
const QUEUE_TRACK = { id: 'sermon-1' }
const UNKNOWN_TRACK = { id: 'other-sermon' }

jest.mock('entities/listening-history/@x/player', () => ({ markHistoryCompletedAction: jest.fn() }))
jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))
jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))
jest.mock('../../../model', () => ({
  currentAudioAtom: 'currentAudioAtom',
  currentPlaylistAtom: 'currentPlaylistAtom',
  setIsPlayingAction: jest.fn(),
  setPositionAction: jest.fn(),
}))
jest.mock('../progressFlusher', () => ({ flushProgress: jest.fn() }))
jest.mock('./LockScreenControls', () => ({
  lockScreenControls: { reassertMetadata: jest.fn() },
}))
jest.mock('./PlaylistEngine', () => ({
  playlistEngine: {
    getCurrentIndex: jest.fn(() => 0),
    getLoop: jest.fn(() => 'none'),
    getPlaylist: jest.fn(),
    getStatus: jest.fn(() => ({ durationMs: 0, isPlaying: true, positionMs: 0 })),
    getTrackAt: jest.fn(),
    getTrackCount: jest.fn(() => 2),
    isLoaded: jest.fn(() => true),
  },
}))
jest.mock('./TrackAutoAdvanceService/TrackAutoAdvanceService', () => ({
  trackAutoAdvanceService: { handleTrackChanged: jest.fn() },
}))

const mockEngineTrack = (track: typeof QUEUE_TRACK) => {
  jest.mocked(playlistEngine.getTrackAt).mockReturnValue(track as never)
  jest.mocked(playlistEngine.getStatus).mockReturnValue(ENGINE_STATUS as never)
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(ctx.get as jest.Mock).mockImplementation(atom => {
    if (atom === currentAudioAtom) return CURRENT_AUDIO
    if (atom === currentPlaylistAtom) return CURRENT_PLAYLIST
    return undefined
  })
})

describe('reconcileOnForeground flush branch', () => {
  test('flushes engine progress when the engine still plays the sermon JS knows', async () => {
    mockEngineTrack(QUEUE_TRACK)

    await reconcileOnForeground()

    expect(flushProgress).toHaveBeenCalledWith(ENGINE_STATUS.positionMs, ENGINE_STATUS.durationMs)
  })

  test('skips the flush when the engine track cannot be matched to the JS queue', async () => {
    mockEngineTrack(UNKNOWN_TRACK)

    await reconcileOnForeground()

    expect(flushProgress).not.toHaveBeenCalled()
  })
})
