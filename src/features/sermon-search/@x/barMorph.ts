// The bottom-bar morph only needs the search-field visibility flag. Importing
// the feature barrel would pull its UI + player graph (and expo-audio) into the
// bare model tests that exercise the morph.
export { isSearchOpenAtom, searchQueryAtom } from '../model'
export {
  holdSearchFocus,
  isSearchFieldFocusedAtom,
  isSearchFieldVisibleAtom,
  isSearchFocusActiveAtom,
  isSearchFocusHeldAtom,
  isSearchQueryActive,
  releaseSearchFocusHold,
} from '../model-searchField'
