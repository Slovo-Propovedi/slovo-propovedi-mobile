import { createCtx } from '@reatom/framework'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { writeHistory } from './historyStorage'
import { removeSermonsFromHistoryAction } from './removeSermonsFromHistory'

jest.mock('./historyStorage', () => ({
  writeHistory: jest.fn(),
}))

jest.mock('./liveProgressStorage', () => ({
  clearLiveProgressSnapshot: jest.fn(),
}))

const mockedWriteHistory = writeHistory as jest.MockedFunction<typeof writeHistory>

const AUDIO_URL = 'https://example.com/audio.mp3'

const makeEntry = (sermonId: string): ListeningHistoryEntry => ({
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
})

describe('removeSermonsFromHistoryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('removes multiple ids in one write', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1'), makeEntry('sermon-2'), makeEntry('sermon-3')])

    await removeSermonsFromHistoryAction(ctx, ['sermon-1', 'sermon-3'])

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    expect(getEntrySermon(atomState[0])?.id).toBe('sermon-2')
    expect(mockedWriteHistory).toHaveBeenCalledTimes(1)
    expect(mockedWriteHistory).toHaveBeenCalledWith(atomState)
  })

  test('unknown ids are a no-op with no write', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1')])

    await removeSermonsFromHistoryAction(ctx, ['does-not-exist'])

    expect(ctx.get(historyAtom)).toHaveLength(1)
    expect(mockedWriteHistory).not.toHaveBeenCalled()
  })

  test('empty array is a no-op with no write', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1')])

    await removeSermonsFromHistoryAction(ctx, [])

    expect(ctx.get(historyAtom)).toHaveLength(1)
    expect(mockedWriteHistory).not.toHaveBeenCalled()
  })
})
