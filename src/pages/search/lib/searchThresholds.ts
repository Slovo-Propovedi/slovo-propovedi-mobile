// The server returns nothing meaningful for two-character searches, so the page
// keeps its empty pose (scope row + recent searches) until the third character and
// only then switches to the results view. Fetching is unaffected: the debounce
// still starts at `MIN_QUERY_LENGTH` (2).
export const MIN_RESULTS_VIEW_LENGTH = 3
