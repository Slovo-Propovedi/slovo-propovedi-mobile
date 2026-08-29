import { createCtx } from '@reatom/framework'
import { renderHookWithProviders } from 'shared/mocks'
import { historyAtom, isHistoryLoadedAtom } from '../model/history'
import { type ListeningHistoryEntry } from '../model/types'
import { useLastListeningEntry } from './useLastListeningEntry'

const makeEntry = (
  sermonId: string,
  overrides: Partial<ListeningHistoryEntry> = {},
): ListeningHistoryEntry => ({
  durationMs: 1000,
  lastPlayedAt: Date.now(),
  playlist: {
    artwork: 'art.jpg',
    id: 'pl-1',
    sermons: [],
    title: 'Playlist',
  },
  positionMs: 500,
  sermon: {
    artist: 'Author',
    artwork: 'sermon.jpg',
    audioUrl: 'https://example.com/audio.mp3',
    id: sermonId,
    title: `Sermon ${sermonId}`,
  },
  ...overrides,
})

const makeEntryWithoutSermon = (): ListeningHistoryEntry => ({
  durationMs: 1000,
  lastPlayedAt: Date.now(),
  playlist: {
    artwork: 'art.jpg',
    id: 'pl-1',
    sermons: [],
    title: 'Playlist',
  },
  positionMs: 500,
})

describe('useLastListeningEntry', () => {
  test('returns not-loaded state before history hydration', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1')])

    const { result } = await renderHookWithProviders(() => useLastListeningEntry(), { ctx })

    expect(result.current.isLoaded).toBe(false)
    expect(result.current.entry).toBeNull()
    expect(result.current.sermon).toBeNull()
  })

  test('returns null entry when loaded and history is empty', async () => {
    const ctx = createCtx()
    isHistoryLoadedAtom(ctx, true)
    historyAtom(ctx, [])

    const { result } = await renderHookWithProviders(() => useLastListeningEntry(), { ctx })

    expect(result.current.isLoaded).toBe(true)
    expect(result.current.entry).toBeNull()
    expect(result.current.sermon).toBeNull()
  })

  test('skips the first entry without a sermon and returns the second', async () => {
    const ctx = createCtx()
    isHistoryLoadedAtom(ctx, true)
    const withSermon = makeEntry('sermon-2')
    historyAtom(ctx, [makeEntryWithoutSermon(), withSermon])

    const { result } = await renderHookWithProviders(() => useLastListeningEntry(), { ctx })

    expect(result.current.entry).toBe(withSermon)
    expect(result.current.sermon?.id).toBe('sermon-2')
  })
})
