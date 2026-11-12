import { type SearchHistory, type SearchHistoryEntry } from 'entities/search-history'
import { mergeSearchHistory } from './mergeSearchHistory'

const SEARCH_HISTORY_LIMIT = 20

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

const sermonIds = (history: SearchHistory): string[] => history.map(entry => entry.sermon.id)

describe('mergeSearchHistory', () => {
  test('keeps the newest entry per sermon id', () => {
    const local: SearchHistory = [makeEntry('s-1', 100), makeEntry('s-2', 500)]
    const imported: SearchHistory = [makeEntry('s-1', 300), makeEntry('s-3', 200)]

    const result = mergeSearchHistory(local, imported)

    expect(sermonIds(result)).toEqual(['s-2', 's-1', 's-3'])
    expect(result[1].savedAt).toBe(300)
  })

  test('caps the merged result at the search history limit', () => {
    const local: SearchHistory = Array.from({ length: 15 }, (_, i) => makeEntry(`l-${i}`, i))
    const imported: SearchHistory = Array.from({ length: 15 }, (_, i) =>
      makeEntry(`i-${i}`, i + 1000),
    )

    expect(mergeSearchHistory(local, imported)).toHaveLength(SEARCH_HISTORY_LIMIT)
  })

  test('handles empty inputs', () => {
    expect(mergeSearchHistory([], [])).toEqual([])
  })
})
