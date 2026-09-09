import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { LISTENING_HISTORY, LISTENING_PROGRESS_SNAPSHOT } from 'shared/config'
import { reportError } from 'shared/model/error-dialog'
import { historyAtom, isHistoryLoadedAtom } from '../model/historyAtom'
import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { loadHistoryAction } from './loadHistory'

jest.mock('shared/model/error-dialog', () => ({
  reportError: jest.fn(),
}))

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
        audioUrl: 'https://example.com/audio.mp3',
        id: sermonId,
        title: `Sermon ${sermonId}`,
      },
    ],
    title: 'Playlist',
  },
  positionMs: 500,
  ...overrides,
})

describe('loadHistoryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

  test('loads entries from storage and sets atom', async () => {
    const entry = makeEntry('sermon-1')
    const data: ListeningHistory = [entry]
    await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify(data))

    const ctx = createCtx()
    await loadHistoryAction(ctx)

    expect(ctx.get(historyAtom)).toEqual(data)
  })

  test('sets atom to empty array when storage is empty', async () => {
    const ctx = createCtx()
    await loadHistoryAction(ctx)

    expect(ctx.get(historyAtom)).toEqual([])
  })

  test('marks history as loaded after hydration', async () => {
    const ctx = createCtx()
    expect(ctx.get(isHistoryLoadedAtom)).toBe(false)

    await loadHistoryAction(ctx)

    expect(ctx.get(isHistoryLoadedAtom)).toBe(true)
  })

  test('marks history as loaded and keeps empty atom when storage read fails', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('read failed'))

    const ctx = createCtx()
    await loadHistoryAction(ctx)

    expect(ctx.get(isHistoryLoadedAtom)).toBe(true)
    expect(ctx.get(historyAtom)).toEqual([])
    expect(reportError).toHaveBeenCalled()
  })

  test('clears orphan snapshot that matches no history entry', async () => {
    const entry = makeEntry('sermon-1')
    await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify([entry]))
    // Snapshot references a sermon id not in history
    await AsyncStorage.setItem(
      LISTENING_PROGRESS_SNAPSHOT,
      JSON.stringify({
        durationMs: 5000,
        positionMs: 2000,
        sermonId: 'unknown-sermon',
      }),
    )

    const ctx = createCtx()
    await loadHistoryAction(ctx)

    // Snapshot should have been cleared
    const snapshot = await AsyncStorage.getItem(LISTENING_PROGRESS_SNAPSHOT)
    expect(snapshot).toBeNull()
    // Entries should be unchanged
    expect(ctx.get(historyAtom)).toHaveLength(1)
    expect(getEntrySermon(ctx.get(historyAtom)[0])?.id).toBe('sermon-1')
  })
})
