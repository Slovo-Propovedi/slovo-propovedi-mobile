import { createCtx } from '@reatom/framework'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { historyAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { useHistoryProgressMap } from './useHistoryProgressMap'

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

describe('useHistoryProgressMap', () => {
  test('maps mid-progress entry to position/duration ratio', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1', { durationMs: 1000, positionMs: 500 })])

    const { result } = await renderHookWithProviders(() => useHistoryProgressMap(), { ctx })

    expect(result.current.get('sermon-1')).toBe(0.5)
  })

  test('maps completed entry to 1', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1', { durationMs: 1000, positionMs: 1000 })])

    const { result } = await renderHookWithProviders(() => useHistoryProgressMap(), { ctx })

    expect(result.current.get('sermon-1')).toBe(1)
  })

  test('excludes entry with zero position', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1', { durationMs: 1000, positionMs: 0 })])

    const { result } = await renderHookWithProviders(() => useHistoryProgressMap(), { ctx })

    expect(result.current.has('sermon-1')).toBe(false)
  })

  test('excludes entry with zero duration', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1', { durationMs: 0, positionMs: 500 })])

    const { result } = await renderHookWithProviders(() => useHistoryProgressMap(), { ctx })

    expect(result.current.has('sermon-1')).toBe(false)
  })

  test('handles multiple entries correctly', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [
      makeEntry('sermon-1', { durationMs: 2000, positionMs: 1000 }),
      makeEntry('sermon-2', { durationMs: 3000, positionMs: 3000 }),
      makeEntry('sermon-3', { durationMs: 500, positionMs: 0 }),
    ])

    const { result } = await renderHookWithProviders(() => useHistoryProgressMap(), { ctx })

    expect(result.current.size).toBe(2)
    expect(result.current.get('sermon-1')).toBe(0.5)
    expect(result.current.get('sermon-2')).toBe(1)
    expect(result.current.has('sermon-3')).toBe(false)
  })

  test('keeps the progress of a sermon evicted from the catalog', async () => {
    const ctx = createCtx()
    sermonProgressAtom(ctx, {
      'evicted-sermon': { durationMs: 2000, positionMs: 1000, updatedAt: 1 },
    })

    const { result } = await renderHookWithProviders(() => useHistoryProgressMap(), { ctx })

    expect(result.current.get('evicted-sermon')).toBe(0.5)
  })

  test('catalog value wins over the progress record', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1', { durationMs: 2000, positionMs: 2000 })])
    sermonProgressAtom(ctx, {
      'sermon-1': { durationMs: 2000, positionMs: 500, updatedAt: 1 },
    })

    const { result } = await renderHookWithProviders(() => useHistoryProgressMap(), { ctx })

    expect(result.current.get('sermon-1')).toBe(1)
  })

  test('skips zero progress records', async () => {
    const ctx = createCtx()
    sermonProgressAtom(ctx, {
      'sermon-1': { durationMs: 2000, positionMs: 0, updatedAt: 1 },
      'sermon-2': { durationMs: 0, positionMs: 500, updatedAt: 1 },
    })

    const { result } = await renderHookWithProviders(() => useHistoryProgressMap(), { ctx })

    expect(result.current.has('sermon-1')).toBe(false)
    expect(result.current.has('sermon-2')).toBe(false)
  })
})
