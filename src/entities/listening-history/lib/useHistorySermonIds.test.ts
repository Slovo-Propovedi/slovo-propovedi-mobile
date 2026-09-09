import { createCtx } from '@reatom/framework'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { useHistorySermonIds } from './useHistorySermonIds'

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

describe('useHistorySermonIds', () => {
  test('includes ids of zero-position and zero-duration entries', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [
      makeEntry('sermon-1', { durationMs: 0, positionMs: 0 }),
      makeEntry('sermon-2', { durationMs: 1000, positionMs: 0 }),
      makeEntry('sermon-3', { durationMs: 0, positionMs: 500 }),
    ])

    const { result } = await renderHookWithProviders(() => useHistorySermonIds(), { ctx })

    expect(result.current.has('sermon-1')).toBe(true)
    expect(result.current.has('sermon-2')).toBe(true)
    expect(result.current.has('sermon-3')).toBe(true)
  })

  test('empty history returns empty set', async () => {
    const ctx = createCtx()

    const { result } = await renderHookWithProviders(() => useHistorySermonIds(), { ctx })

    expect(result.current.size).toBe(0)
  })
})
