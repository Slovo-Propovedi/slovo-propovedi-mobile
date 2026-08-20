import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { MAX_HISTORY_ENTRIES } from './constants'
import { getEntrySermon } from './getEntrySermon'
import { sortAndCapEntries } from './sortAndCapEntries'

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

describe('sortAndCapEntries', () => {
  test('sorts entries descending by lastPlayedAt', () => {
    const entries: ListeningHistory = [
      makeEntry('s-1', 100),
      makeEntry('s-2', 300),
      makeEntry('s-3', 200),
    ]
    const result = sortAndCapEntries(entries)
    expect(result.map(e => getEntrySermon(e).id)).toEqual(['s-2', 's-3', 's-1'])
  })

  test('caps overflow and drops oldest entries', () => {
    const entries: ListeningHistory = Array.from({ length: MAX_HISTORY_ENTRIES + 10 }, (_, i) =>
      makeEntry(`s-${i}`, i),
    )
    const result = sortAndCapEntries(entries)
    expect(result).toHaveLength(MAX_HISTORY_ENTRIES)
    expect(getEntrySermon(result[0]).id).toBe(`s-${MAX_HISTORY_ENTRIES + 9}`)
  })

  test('dedupes by sermon id keeping most recent', () => {
    const entries: ListeningHistory = [
      makeEntry('s-1', 100),
      makeEntry('s-1', 300),
      makeEntry('s-2', 200),
    ]
    const result = sortAndCapEntries(entries)
    expect(result).toHaveLength(2)
    const s1Entry = result.find(e => getEntrySermon(e).id === 's-1')
    expect(s1Entry?.lastPlayedAt).toBe(300)
  })

  test('handles empty input', () => {
    expect(sortAndCapEntries([])).toEqual([])
  })

  test('preserves entry data after dedup', () => {
    const older = makeEntry('s-1', 100)
    const newer = makeEntry('s-1', 300)
    const result = sortAndCapEntries([older, newer])
    expect(result).toHaveLength(1)
    expect(result[0].lastPlayedAt).toBe(300)
  })
})
