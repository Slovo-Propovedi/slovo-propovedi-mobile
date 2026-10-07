import { type SearchResultsType } from './parseSearchResultsParams'

const TITLE_LABELS: Record<SearchResultsType, string> = {
  playlists: 'Плейлисты',
  preachers: 'Проповедники',
  sermons: 'Проповеди',
}

/**
 * Header title for the full search-results screen, e.g. `Проповеди "вера"`.
 * @param type - Result group being shown.
 * @param query - Search query the user is drilling into.
 */
export const buildSearchResultsTitle = (type: SearchResultsType, query: string): string =>
  `${TITLE_LABELS[type]} "${query}"`
