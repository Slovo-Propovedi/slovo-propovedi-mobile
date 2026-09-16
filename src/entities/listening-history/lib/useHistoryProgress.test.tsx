import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { useHistoryProgress } from './useHistoryProgress'

const makeEntry = (
  sermonId: string,
  overrides: Partial<ListeningHistoryEntry> = {},
): ListeningHistoryEntry => ({
  durationMs: 1000,
  lastPlayedAt: Date.now(),
  playlist: {
    artwork: null,
    id: 'pl-1',
    sermons: [],
    title: 'Playlist',
  },
  positionMs: 500,
  sermon: {
    artist: 'Author',
    artwork: null,
    audioUrl: 'https://example.com/audio.mp3',
    id: sermonId,
    title: `Sermon ${sermonId}`,
  },
  ...overrides,
})

describe('useHistoryProgress', () => {
  test('returns position/duration ratio for a mid-progress entry', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1', { durationMs: 1000, positionMs: 500 })])

    const { result } = await renderHookWithProviders(() => useHistoryProgress('sermon-1'), { ctx })

    expect(result.current).toBe(0.5)
  })

  test('returns 1 for a completed entry', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1', { durationMs: 1000, positionMs: 1000 })])

    const { result } = await renderHookWithProviders(() => useHistoryProgress('sermon-1'), { ctx })

    expect(result.current).toBe(1)
  })

  test('returns undefined for an unknown sermon id', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1')])

    const { result } = await renderHookWithProviders(() => useHistoryProgress('sermon-2'), { ctx })

    expect(result.current).toBeUndefined()
  })

  test('returns undefined for an entry with zero position', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1', { positionMs: 0 })])

    const { result } = await renderHookWithProviders(() => useHistoryProgress('sermon-1'), { ctx })

    expect(result.current).toBeUndefined()
  })

  test('returns undefined when sermonId is undefined', async () => {
    const ctx = createCtx()

    const { result } = await renderHookWithProviders(() => useHistoryProgress(undefined), { ctx })

    expect(result.current).toBeUndefined()
  })

  test('reacts to history changes', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1', { durationMs: 1000, positionMs: 500 })])

    const { result } = await renderHookWithProviders(() => useHistoryProgress('sermon-1'), { ctx })
    expect(result.current).toBe(0.5)

    await act(async () => {
      historyAtom(ctx, [makeEntry('sermon-1', { durationMs: 1000, positionMs: 1000 })])
    })

    expect(result.current).toBe(1)
  })
})
