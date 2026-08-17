export interface Suggestion {
  category: SuggestionCategory
  value: string
}

export type SuggestionCategory = 'artist' | 'book'

const CATEGORY_ORDER: Record<SuggestionCategory, number> = { artist: 0, book: 1 }

const rankMatch = (value: string, query: string): number => {
  const normalized = value.toLowerCase()
  if (normalized.startsWith(query)) return 0
  if (normalized.includes(query)) return 1
  return -1
}

export const getSuggestions = (
  artists: string[],
  books: string[],
  query: string,
  limit: number,
): Suggestion[] => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  const allValues: Suggestion[] = [
    ...artists.map(value => ({ category: 'artist' as const, value })),
    ...books.map(value => ({ category: 'book' as const, value })),
  ]

  return allValues
    .map(suggestion => ({ ...suggestion, rank: rankMatch(suggestion.value, normalizedQuery) }))
    .filter(suggestion => suggestion.rank >= 0)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
        a.value.localeCompare(b.value),
    )
    .slice(0, limit)
    .map(({ category, value }) => ({ category, value }))
}
