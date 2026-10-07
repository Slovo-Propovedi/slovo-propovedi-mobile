export interface SearchResultsParams {
  query: string
  type: SearchResultsType
}

export type SearchResultsType = 'playlists' | 'preachers' | 'sermons'

const isSearchResultsType = (value: unknown): value is SearchResultsType =>
  value === 'sermons' || value === 'playlists' || value === 'preachers'

/**
 * Parses untrusted route params for the full search-results screen. Returns
 * `undefined` for anything that is not a known type with a non-empty query.
 * @param params - Raw expo-router params (values may be arrays).
 * @param params.query - Search query param; trimmed and required.
 * @param params.type - Result group param; must be a known `SearchResultsType`.
 */
export const parseSearchResultsParams = (params: {
  query?: string | string[]
  type?: string | string[]
}): SearchResultsParams | undefined => {
  const { query, type } = params
  if (typeof type !== 'string' || !isSearchResultsType(type)) return undefined
  if (typeof query !== 'string') return undefined

  const trimmedQuery = query.trim()
  if (!trimmedQuery) return undefined

  return { query: trimmedQuery, type }
}
