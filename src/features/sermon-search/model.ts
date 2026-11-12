import { action, atom } from '@reatom/framework'

export const MIN_QUERY_LENGTH = 2

export const searchQueryAtom = atom('', 'searchQueryAtom')
export const isSearchOpenAtom = atom(false, 'isSearchOpenAtom')

// External request to type text into the visible search input (the onboarding
// tour simulates typing through it). `SearchBar` mirrors every request into its
// local input state; `nonce` makes each request distinct so identical text can be
// applied twice. Kept apart from `searchQueryAtom` because the input's local
// state must not follow async query updates (controlled-input race).
export const searchInputRequestAtom = atom<{ nonce: number; text: string } | null>(
  null,
  'searchInputRequestAtom',
)

// External request to return focus to the visible search input. The search page
// raises it when a locked scope press or its info dialog would otherwise leave
// the field blurred. `nonce` makes repeated requests distinct; `SearchBar` seeds
// the current nonce so a stale request is never replayed on mount.
export const searchFocusRequestAtom = atom<{ nonce: number } | null>(null, 'searchFocusRequestAtom')

// Asks the visible `SearchBar` input to focus. Callers raise it before an
// action that steals focus and again once the action is dismissed.
export const requestSearchFocus = action(ctx => {
  const previous = ctx.get(searchFocusRequestAtom)

  searchFocusRequestAtom(ctx, { nonce: (previous?.nonce ?? 0) + 1 })
}, 'requestSearchFocus')

// Simulates a keystroke: sets the canonical query (which drives the search page)
// and asks the visible `SearchBar` input to adopt the same text, so the
// onboarding tour's typed demo query shows up in the field while the page keeps
// fetching from `searchQueryAtom`.
export const typeSearchInput = action((ctx, text: string) => {
  const previous = ctx.get(searchInputRequestAtom)

  searchQueryAtom(ctx, text)
  searchInputRequestAtom(ctx, { nonce: (previous?.nonce ?? 0) + 1, text })
}, 'typeSearchInput')
