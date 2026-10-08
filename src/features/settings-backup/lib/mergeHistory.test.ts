import {
  getEntrySermon,
  type ListeningHistory,
  type ListeningHistoryEntry,
} from 'entities/listening-history'
import { mergeHistory } from './mergeHistory'

const HISTORY_LIMIT = 100

const makeEntry = (sermonId: string, lastPlayedAt: number): ListeningHistoryEntry => ({
  durationMs: 1000,
  lastPlayedAt,
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
})

const sermonIds = (history: ListeningHistory): (string | undefined)[] =>
  history.map(entry => getEntrySermon(entry)?.id)

describe('mergeHistory', () => {
  test('keeps the newest entry per sermon id', () => {
    const local: ListeningHistory = [makeEntry('s-1', 100), makeEntry('s-2', 500)]
    const imported: ListeningHistory = [makeEntry('s-1', 300), makeEntry('s-3', 200)]

    const result = mergeHistory(local, imported)

    expect(new Set(sermonIds(result))).toEqual(new Set(['s-1', 's-2', 's-3']))
    const s1 = result.find(entry => getEntrySermon(entry)?.id === 's-1')
    expect(s1?.lastPlayedAt).toBe(300)
  })

  test('sorts merged entries by lastPlayedAt descending', () => {
    const local: ListeningHistory = [makeEntry('s-1', 100), makeEntry('s-3', 400)]
    const imported: ListeningHistory = [makeEntry('s-2', 300)]

    const result = mergeHistory(local, imported)

    expect(sermonIds(result)).toEqual(['s-3', 's-2', 's-1'])
  })

  test('caps the merged result at the history limit', () => {
    const local: ListeningHistory = Array.from({ length: 60 }, (_, i) => makeEntry(`l-${i}`, i))
    const imported: ListeningHistory = Array.from({ length: 60 }, (_, i) =>
      makeEntry(`i-${i}`, i + 1000),
    )

    expect(mergeHistory(local, imported)).toHaveLength(HISTORY_LIMIT)
  })

  test('handles empty inputs', () => {
    expect(mergeHistory([], [])).toEqual([])
  })
})
