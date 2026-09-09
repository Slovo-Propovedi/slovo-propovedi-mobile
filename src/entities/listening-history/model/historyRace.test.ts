import { createCtx } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { getEntrySermon } from '../lib/getEntrySermon'
import { writeHistory } from '../lib/historyStorage'
import {
  flushHistoryProgressAction,
  markHistoryCompletedAction,
  recordPlaybackStartAction,
  removeHistoryEntryAction,
} from './history'
import { historyAtom } from './historyAtom'
import { type ListeningHistoryEntry } from './types'

const mockHistoryWriteResolvers: Array<() => void> = []

jest.mock('../lib/historyStorage', () => ({
  writeHistory: jest.fn().mockImplementation(
    () =>
      new Promise<void>(resolve => {
        mockHistoryWriteResolvers.push(resolve)
      }),
  ),
}))

jest.mock('../lib/liveProgressStorage', () => ({
  clearLiveProgressSnapshot: jest.fn(),
}))

const mockedWriteHistory = writeHistory as jest.MockedFunction<typeof writeHistory>

const AUDIO_URL = 'https://example.com/audio.mp3'

const mockAudio: AudioPlayerData = {
  artist: 'Author',
  artwork: 'sermon.jpg',
  audioUrl: AUDIO_URL,
  id: 'new-sermon',
  title: 'New Sermon',
}

const mockPlaylist: PlaylistData = {
  artwork: 'playlist.jpg',
  description: 'A test playlist',
  id: 'pl-1',
  sermons: [mockAudio],
  title: 'Test Playlist',
}

const makeEntry = (
  sermonId: string,
  overrides: Partial<ListeningHistoryEntry> = {},
): ListeningHistoryEntry => ({
  durationMs: 1000,
  lastPlayedAt: Date.now(),
  playlist: {
    artwork: 'art.jpg',
    id: 'pl-1',
    sermons: [
      {
        artist: 'Author',
        artwork: 'sermon.jpg',
        audioUrl: AUDIO_URL,
        id: sermonId,
        title: `Sermon ${sermonId}`,
      },
    ],
    title: 'Playlist',
  },
  positionMs: 500,
  ...overrides,
})

const resolveAllPendingWrites = async () => {
  const resolvers = mockHistoryWriteResolvers.splice(0)
  resolvers.forEach(resolve => resolve())
  await Promise.resolve()
}

describe('listening-history race (commitHistory)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHistoryWriteResolvers.length = 0
  })

  test('concurrent flush + remove both land in the atom before persistence', async () => {
    const entryX = makeEntry('sermon-x', { durationMs: 10000, positionMs: 1000 })
    const entryY = makeEntry('sermon-y')
    const ctx = createCtx()
    historyAtom(ctx, [entryX, entryY])

    const flush = flushHistoryProgressAction(ctx, {
      durationMs: 10000,
      positionMs: 5000,
      sermon: { ...mockAudio, id: 'sermon-x' },
    })
    const remove = removeHistoryEntryAction(ctx, 'sermon-y')

    // Persistence still pending — the atom must already contain both effects.
    expect(mockHistoryWriteResolvers).toHaveLength(2)
    const pending = ctx.get(historyAtom)
    expect(pending).toHaveLength(1)
    expect(getEntrySermon(pending[0])?.id).toBe('sermon-x')
    expect(pending[0].positionMs).toBe(5000)
    expect(pending[0].durationMs).toBe(10000)

    await resolveAllPendingWrites()
    await Promise.all([flush, remove])

    expect(ctx.get(historyAtom)[0].positionMs).toBe(5000)
    expect(mockedWriteHistory).toHaveBeenCalledTimes(2)
    expect(mockedWriteHistory).toHaveBeenLastCalledWith(pending)
  })

  test('auto-advance: completion of old + start of new both survive', async () => {
    const entryOld = makeEntry('old-sermon', {
      durationMs: 10000,
      lastPlayedAt: 100,
      positionMs: 3000,
    })
    const ctx = createCtx()
    historyAtom(ctx, [entryOld])

    const p1 = markHistoryCompletedAction(ctx, 'old-sermon', 50000)
    const p2 = recordPlaybackStartAction(ctx, mockAudio, mockPlaylist)

    await resolveAllPendingWrites()
    await Promise.all([p1, p2])

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(2)
    expect(getEntrySermon(atomState[0])?.id).toBe('new-sermon')
    expect(atomState[1].positionMs).toBe(50000)
    expect(atomState[1].durationMs).toBe(50000)
  })
})
