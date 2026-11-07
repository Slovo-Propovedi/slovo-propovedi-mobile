export { collectMatchingPreachers } from './lib/composeSearchResults'
export { mergePlaylistMatches, selectLocalPlaylistMatches } from './lib/localPlaylistSearch'
export {
  fetchPlaylistTitleMatches,
  fetchSermonResults,
  persistPlaylistSearchResults,
  persistSermonSearchResults,
} from './lib/searchSources'
export { useIsSearchActive } from './lib/useIsSearchActive'
export { useIsSearchBarCollapseSuspended } from './lib/useIsSearchBarCollapseSuspended'
export { useIsSearchFieldVisible } from './lib/useIsSearchFieldVisible'
export { useOpenSearch } from './lib/useOpenSearch'
export { useSearchUrlSync } from './lib/useSearchUrlSync'
export { useSermonPlayback } from './lib/useSermonPlayback'
export {
  closeSearch,
  isSearchOpenAtom,
  searchQueryAtom,
  searchResultsAtom,
  typeSearchInput,
} from './model'
export { SearchBar } from './ui/SearchBar'
export { SearchGroupedResults } from './ui/SearchGroupedResults'
export { SearchPlaylistRow } from './ui/SearchPlaylistRow'
export { SearchPreacherRow } from './ui/SearchPreacherRow'
