import { type PlaylistData } from 'entities/playlist/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, durationAtom, positionAtom } from '../../model'
import { executeTrackSwitch } from './executeTrackSwitch'

const mockRecordSermonSwitch = jest.fn()
const mockGetResumePosition = jest.fn()
const mockSavePlaybackProgress = jest.fn()

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('entities/listening-history/@x/player', () => ({
  COMPLETION_REMAINING_MS: 5000,
  getResumePosition: (...args: unknown[]) => mockGetResumePosition(...args),
  historyAtom: 'HISTORY_ATOM',
  recordSermonSwitchAction: (...args: unknown[]) => mockRecordSermonSwitch(...args),
  sermonProgressAtom: 'SERMON_PROGRESS_ATOM',
}))

jest.mock('../../lib/playbackProgress', () => ({
  savePlaybackProgress: (...args: unknown[]) => mockSavePlaybackProgress(...args),
}))

jest.mock('../../model', () => ({
  currentAudioAtom: 'CURRENT_AUDIO_ATOM',
  durationAtom: 'DURATION_ATOM',
  positionAtom: 'POSITION_ATOM',
}))

const OLD_AUDIO_URL = 'https://example.com/old.mp3'
const NEXT_AUDIO_URL = 'https://example.com/next.mp3'

const createSermon = (id: string, audioUrl: string): AudioPlayerData => ({
  artist: `Artist ${id}`,
  artwork: `${id}.jpg`,
  audioUrl,
  id,
  title: `Sermon ${id}`,
})

const playlist: PlaylistData = {
  artwork: 'playlist.jpg',
  id: 'playlist-1',
  sermons: [createSermon('old', OLD_AUDIO_URL), createSermon('next', NEXT_AUDIO_URL)],
  title: 'Test Playlist',
}

const applyAtomState = () => {
  ;(ctx.get as jest.Mock).mockImplementation(atom => {
    if (atom === currentAudioAtom) return playlist.sermons[0]
    if (atom === durationAtom) return 100000
    if (atom === positionAtom) return 50000
    return undefined
  })
}

const createParams = (options?: { markOldCompleted?: boolean }) => ({
  ctx,
  newIndex: 1,
  options,
  play: jest.fn().mockResolvedValue(undefined),
  playlist,
  replaceAudio: jest.fn().mockResolvedValue(null),
  setCurrentAudio: jest.fn().mockResolvedValue(undefined),
  setLockScreenMetadata: jest.fn(),
})

describe('executeTrackSwitch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetResumePosition.mockReturnValue(0)
    mockRecordSermonSwitch.mockResolvedValue(undefined)
    mockSavePlaybackProgress.mockResolvedValue(undefined)
    applyAtomState()
  })

  test('manual next/prev keeps the old track at its position by default', async () => {
    await executeTrackSwitch(createParams())

    expect(mockRecordSermonSwitch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ markOldCompleted: false, oldSermonId: 'old' }),
    )
  })

  test('auto-advance marks the finished track completed', async () => {
    await executeTrackSwitch(createParams({ markOldCompleted: true }))

    expect(mockRecordSermonSwitch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ markOldCompleted: true, oldSermonId: 'old' }),
    )
  })
})
