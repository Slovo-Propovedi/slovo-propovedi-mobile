import { markHistoryCompletedAction } from 'entities/listening-history/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  setIsPlayingAction,
  setPositionAction,
} from '../../../model'
import { flushProgress } from '../progressFlusher'
import { playlistEngine } from './PlaylistEngine'
import { reconcileOnForeground } from './reconcileOnForeground'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

const QUEUE = ['sermon-1', 'sermon-2', 'sermon-3']
const buildTrack = (id: string): AudioPlayerData => ({
  artist: 'Author',
  artwork: null,
  audioUrl: `https://example.com/${id}.mp3`,
  id,
  title: id,
})
const TRACKS = QUEUE.map(buildTrack)
const DEFAULT_CURRENT_AUDIO = { id: 'sermon-1' }
const CURRENT_PLAYLIST = { id: 'playlist-1', sermons: TRACKS }

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
    getAutoAdvanceCount: jest.fn(),
    getCurrentIndex: jest.fn(),
    getLoop: jest.fn(),
    getPlaylist: jest.fn(),
    getStatus: jest.fn(),
    getTrackAt: jest.fn(),
    getTrackCount: jest.fn(),
    isLoaded: jest.fn(),
  },
}))
jest.mock('./TrackAutoAdvanceService/TrackAutoAdvanceService', () => ({
  trackAutoAdvanceService: { handleManualTrackChanged: jest.fn(), handleTrackChanged: jest.fn() },
}))

const mockCurrentAudio = (audio: { id: string }): void => {
  ;(ctx.get as jest.Mock).mockImplementation(atom => {
    if (atom === currentAudioAtom) return audio
    if (atom === currentPlaylistAtom) return CURRENT_PLAYLIST
    return undefined
  })
}

interface EngineSetup {
  autoAdvanceCount?: null | number
  currentIndex?: number
  didJustFinish?: boolean
  durationMs?: number
  isPlaying?: boolean
  jsKnownAutoAdvanceCount?: null | number
  loop?: 'all' | 'none' | 'single'
  nativeIsLoaded?: boolean
  positionMs?: number
  tracks?: AudioPlayerData[]
}

const setupEngine = ({
  autoAdvanceCount = null,
  currentIndex = 0,
  didJustFinish = false,
  durationMs = 120_000,
  isPlaying = true,
  jsKnownAutoAdvanceCount = autoAdvanceCount,
  loop = 'none',
  nativeIsLoaded = true,
  positionMs = 42_000,
  tracks = TRACKS,
}: EngineSetup = {}): void => {
  jest.mocked(playlistEngine.getStatus).mockReturnValue({
    autoAdvanceCount,
    didJustFinish,
    durationMs,
    isBuffering: false,
    isLoaded: true,
    isPlaying,
    playbackRate: 1,
    positionMs,
    volume: 1,
  })
  jest.mocked(playlistEngine.getCurrentIndex).mockReturnValue(currentIndex)
  jest.mocked(playlistEngine.getLoop).mockReturnValue(loop)
  jest.mocked(playlistEngine.getTrackAt).mockImplementation(index => tracks[index] ?? null)
  jest.mocked(playlistEngine.getTrackCount).mockReturnValue(tracks.length)
  jest.mocked(playlistEngine.getAutoAdvanceCount).mockReturnValue(jsKnownAutoAdvanceCount)
  jest.mocked(playlistEngine.isLoaded).mockReturnValue(nativeIsLoaded)
}

const completedIds = (): string[] =>
  jest.mocked(markHistoryCompletedAction).mock.calls.map(([, sermonId]) => String(sermonId))

beforeEach(() => {
  jest.clearAllMocks()
  mockCurrentAudio(DEFAULT_CURRENT_AUDIO)
})

describe('reconcileOnForeground — same track', () => {
  test('flushes engine progress when the engine still plays the sermon JS knows', async () => {
    setupEngine()

    await reconcileOnForeground()

    expect(flushProgress).toHaveBeenCalledWith(42_000, 120_000)
  })

  test('skips the flush when the engine track cannot be matched to the JS queue', async () => {
    setupEngine({ tracks: [...TRACKS.slice(1), buildTrack('other-sermon')] })

    await reconcileOnForeground()

    expect(flushProgress).not.toHaveBeenCalled()
  })
})

describe('reconcileOnForeground — auto chain', () => {
  test('completes wrapped ranges and switches to the engine track', async () => {
    mockCurrentAudio({ id: 'sermon-3' })
    setupEngine({ autoAdvanceCount: 2, currentIndex: 1, jsKnownAutoAdvanceCount: 0 })

    await reconcileOnForeground()

    expect(completedIds()).toEqual(['sermon-3', 'sermon-1'])
    expect(trackAutoAdvanceService.handleTrackChanged).toHaveBeenCalledWith(2, 1)
    expect(flushProgress).not.toHaveBeenCalled()
  })
})

describe('reconcileOnForeground — manual hop', () => {
  test('switches without completing or flushing anything', async () => {
    setupEngine({ autoAdvanceCount: 7, currentIndex: 2, jsKnownAutoAdvanceCount: 7 })

    await reconcileOnForeground()

    expect(markHistoryCompletedAction).not.toHaveBeenCalled()
    expect(trackAutoAdvanceService.handleManualTrackChanged).toHaveBeenCalledWith(2)
    expect(trackAutoAdvanceService.handleTrackChanged).not.toHaveBeenCalled()
    expect(flushProgress).not.toHaveBeenCalled()
  })
})

describe('reconcileOnForeground — Android ENDED', () => {
  test('completes the queue even though the JS isLoaded property is false', async () => {
    setupEngine({
      currentIndex: 2,
      didJustFinish: true,
      isPlaying: false,
      nativeIsLoaded: false,
      positionMs: 5_000,
    })

    await reconcileOnForeground()

    expect(completedIds()).toEqual(['sermon-1', 'sermon-2', 'sermon-3'])
    expect(setIsPlayingAction).toHaveBeenCalledWith(expect.anything(), false)
    expect(setPositionAction).toHaveBeenCalledWith(expect.anything(), 5_000)
    expect(flushProgress).not.toHaveBeenCalled()
  })
})
