import { action, atom } from '@reatom/framework'

export const MIN_QUERY_LENGTH = 2

export const searchQueryAtom = atom('', 'searchQueryAtom')

// Legacy bottom-pill session flag. It used to mirror "the `/search` route is the
// active route of the tabs navigator"; the search input now lives on the page,
// so the route no longer writes it. The bottom-island morph suite and its
// drivers still read it to exercise the retired pill mode (pending cleanup).
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

// Simulates a keystroke: sets the canonical query (which drives the search page)
// and asks the visible `SearchBar` input to adopt the same text, so the
// onboarding tour's typed demo query shows up in the field while the page keeps
// fetching from `searchQueryAtom`.
export const typeSearchInput = action((ctx, text: string) => {
  const previous = ctx.get(searchInputRequestAtom)

  searchQueryAtom(ctx, text)
  searchInputRequestAtom(ctx, { nonce: (previous?.nonce ?? 0) + 1, text })
}, 'typeSearchInput')
