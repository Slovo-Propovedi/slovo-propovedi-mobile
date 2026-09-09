import { createCtx } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { historyAtom } from '../model/history'
import { type ListeningHistoryEntry } from '../model/types'
import { MAX_HISTORY_ENTRIES } from './constants'
import { getEntrySermon } from './getEntrySermon'
import { writeHistory } from './historyStorage'
import { isEntryCompleted } from './isEntryCompleted'
import { markSermonsListenedAction } from './markSermonsListened'

jest.mock('./historyStorage', () => ({
  writeHistory: jest.fn(),
}))

jest.mock('./liveProgressStorage', () => ({
  clearLiveProgressSnapshot: jest.fn(),
}))

const mockedWriteHistory = writeHistory as jest.MockedFunction<typeof writeHistory>

const AUDIO_URL = 'https://example.com/audio.mp3'

const mockAudio = (id: string): AudioPlayerData => ({
  artist: 'Author',
  artwork: 'sermon.jpg',
  audioUrl: AUDIO_URL,
  id,
  title: `Test Sermon ${id}`,
})

const mockPlaylist: PlaylistData = {
  artwork: 'playlist.jpg',
  description: 'A test playlist',
  id: 'pl-1',
  sermons: [mockAudio('sermon-1'), mockAudio('sermon-2')],
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

describe('markSermonsListenedAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('creates completed entries for multiple unplayed sermons in ONE writeHistory call', async () => {
    const ctx = createCtx()

    await markSermonsListenedAction(
      ctx,
      [mockAudio('sermon-1'), mockAudio('sermon-2')],
      mockPlaylist,
    )

    const atomState = ctx.get(historyAtom)
    const ids = atomState.map(e => getEntrySermon(e)?.id)
    expect(ids).toContain('sermon-1')
    expect(ids).toContain('sermon-2')
    expect(atomState).toHaveLength(2)
    expect(atomState.every(isEntryCompleted)).toBe(true)
    expect(mockedWriteHistory).toHaveBeenCalledTimes(1)
    expect(mockedWriteHistory).toHaveBeenCalledWith(atomState)
  })

  test('completes partial entries keeping lastPlayedAt and list position', async () => {
    const lastPlayedAt1 = 1000
    const lastPlayedAt2 = 2000
    const partial1 = makeEntry('sermon-1', {
      durationMs: 1000,
      lastPlayedAt: lastPlayedAt1,
      positionMs: 500,
    })
    const partial2 = makeEntry('sermon-2', {
      durationMs: 2000,
      lastPlayedAt: lastPlayedAt2,
      positionMs: 700,
    })
    const ctx = createCtx()
    historyAtom(ctx, [partial1, partial2])

    await markSermonsListenedAction(
      ctx,
      [mockAudio('sermon-1'), mockAudio('sermon-2')],
      mockPlaylist,
    )

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(2)
    const entry1 = atomState.find(e => getEntrySermon(e)?.id === 'sermon-1')
    const entry2 = atomState.find(e => getEntrySermon(e)?.id === 'sermon-2')
    expect(entry1?.durationMs).toBe(1000)
    expect(entry1?.positionMs).toBe(1000)
    expect(entry1?.lastPlayedAt).toBe(lastPlayedAt1)
    expect(entry2?.durationMs).toBe(2000)
    expect(entry2?.positionMs).toBe(2000)
    expect(entry2?.lastPlayedAt).toBe(lastPlayedAt2)
    expect(atomState.every(isEntryCompleted)).toBe(true)
    expect(mockedWriteHistory).toHaveBeenCalledTimes(1)
  })

  test('mixed create and complete in one pass', async () => {
    const lastPlayedAt = 1000
    const partial = makeEntry('sermon-1', { durationMs: 1000, lastPlayedAt, positionMs: 500 })
    const ctx = createCtx()
    historyAtom(ctx, [partial])

    await markSermonsListenedAction(
      ctx,
      [mockAudio('sermon-1'), mockAudio('sermon-2')],
      mockPlaylist,
    )

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(2)
    const entry1 = atomState.find(e => getEntrySermon(e)?.id === 'sermon-1')
    const entry2 = atomState.find(e => getEntrySermon(e)?.id === 'sermon-2')
    expect(entry1?.lastPlayedAt).toBe(lastPlayedAt)
    expect(entry1 && isEntryCompleted(entry1)).toBe(true)
    expect(entry2 && isEntryCompleted(entry2)).toBe(true)
    expect(mockedWriteHistory).toHaveBeenCalledTimes(1)
  })

  test('empty array does not call writeHistory', async () => {
    const ctx = createCtx()

    await markSermonsListenedAction(ctx, [], mockPlaylist)

    expect(ctx.get(historyAtom)).toHaveLength(0)
    expect(mockedWriteHistory).not.toHaveBeenCalled()
  })

  test('evicts the oldest entries when history is at the cap', async () => {
    const ctx = createCtx()
    const entries = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) =>
      makeEntry(`sermon-${i}`, { lastPlayedAt: i }),
    )
    historyAtom(ctx, entries)
    const freshAudios = [mockAudio('fresh-1'), mockAudio('fresh-2')]

    await markSermonsListenedAction(ctx, freshAudios, mockPlaylist)

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(MAX_HISTORY_ENTRIES)
    expect(atomState.some(e => getEntrySermon(e)?.id === 'fresh-1')).toBe(true)
    expect(atomState.some(e => getEntrySermon(e)?.id === 'fresh-2')).toBe(true)
    expect(atomState.some(e => getEntrySermon(e)?.id === 'sermon-0')).toBe(false)
    expect(mockedWriteHistory).toHaveBeenCalledTimes(1)
  })
})
