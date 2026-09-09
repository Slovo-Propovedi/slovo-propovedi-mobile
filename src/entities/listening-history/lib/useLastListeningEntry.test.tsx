import { createCtx } from '@reatom/framework'
import { renderHookWithProviders } from 'shared/mocks'
import { isHistoryLoadedAtom } from '../model/history'
import { historyAtom } from '../model/historyAtom'
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

  test('skips completed entries and returns the first incomplete one', async () => {
    const ctx = createCtx()
    isHistoryLoadedAtom(ctx, true)
    const completed = makeEntry('sermon-1', { durationMs: 3600000, positionMs: 3600000 })
    const incomplete = makeEntry('sermon-2', { durationMs: 3600000, positionMs: 1000 })
    historyAtom(ctx, [completed, incomplete])

    const { result } = await renderHookWithProviders(() => useLastListeningEntry(), { ctx })

    expect(result.current.entry).toBe(incomplete)
    expect(result.current.sermon?.id).toBe('sermon-2')
  })

  test('returns null when all entries are completed', async () => {
    const ctx = createCtx()
    isHistoryLoadedAtom(ctx, true)
    const completed1 = makeEntry('sermon-1', { durationMs: 3600000, positionMs: 3600000 })
    const completed2 = makeEntry('sermon-2', { durationMs: 3600000, positionMs: 3600000 })
    historyAtom(ctx, [completed1, completed2])

    const { result } = await renderHookWithProviders(() => useLastListeningEntry(), { ctx })

    expect(result.current.entry).toBeNull()
    expect(result.current.sermon).toBeNull()
  })

  test('returns position-0 incomplete entry', async () => {
    const ctx = createCtx()
    isHistoryLoadedAtom(ctx, true)
    const fresh = makeEntry('sermon-1', { durationMs: 0, positionMs: 0 })
    historyAtom(ctx, [fresh])

    const { result } = await renderHookWithProviders(() => useLastListeningEntry(), { ctx })

    expect(result.current.entry).toBe(fresh)
    expect(result.current.sermon?.id).toBe('sermon-1')
  })
})
