import { action, atom } from '@reatom/framework'

export const MIN_QUERY_LENGTH = 2

export const searchQueryAtom = atom('', 'searchQueryAtom')

// Whether the `/search` route is the active route of the tabs navigator. The
// SearchTabScreen syncs this from the navigation state, so open search is
// derived state rather than a separate session flag. Written on real
// transitions only — the screen lives inside the tabs navigator, so the value
// survives pushes of the nested `/search/*` stack. Open here means "the route
// owns the navigator"; the pill may still be hidden by the collapsed bar, and a
// hidden pill never means the route is unmounted.
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
