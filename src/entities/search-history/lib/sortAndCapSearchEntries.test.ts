import { MAX_SEARCH_HISTORY_ENTRIES } from '../model/constants'
import { type SearchHistory, type SearchHistoryEntry } from '../model/types'
import { sortAndCapSearchEntries } from './sortAndCapSearchEntries'

const makeEntry = (sermonId: string, savedAt: number): SearchHistoryEntry => ({
  savedAt,
  sermon: {
    artist: 'Author',
    artwork: 'sermon.jpg',
    audioUrl: 'https://example.com/audio.mp3',
    id: sermonId,
    title: `Sermon ${sermonId}`,
  },
})

describe('sortAndCapSearchEntries', () => {
  test('sorts entries descending by savedAt', () => {
    const entries: SearchHistory = [
      makeEntry('s-1', 100),
      makeEntry('s-2', 300),
      makeEntry('s-3', 200),
    ]

    expect(sortAndCapSearchEntries(entries).map(entry => entry.sermon.id)).toEqual([
      's-2',
      's-3',
      's-1',
    ])
  })

  test('caps overflow and drops oldest entries', () => {
    const entries: SearchHistory = Array.from({ length: MAX_SEARCH_HISTORY_ENTRIES + 5 }, (_, i) =>
      makeEntry(`s-${i}`, i),
    )

    const result = sortAndCapSearchEntries(entries)

    expect(result).toHaveLength(MAX_SEARCH_HISTORY_ENTRIES)
    expect(result[0].sermon.id).toBe(`s-${MAX_SEARCH_HISTORY_ENTRIES + 4}`)
  })

  test('dedupes by sermon id keeping the newest savedAt', () => {
    const result = sortAndCapSearchEntries([
      makeEntry('s-1', 100),
      makeEntry('s-1', 300),
      makeEntry('s-2', 200),
    ])

    expect(result).toHaveLength(2)
    expect(result[0].sermon.id).toBe('s-1')
    expect(result[0].savedAt).toBe(300)
  })

  test('handles empty input', () => {
    expect(sortAndCapSearchEntries([])).toEqual([])
  })
})
