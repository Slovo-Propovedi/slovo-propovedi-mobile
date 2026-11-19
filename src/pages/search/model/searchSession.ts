import { atom } from '@reatom/framework'

// Bumped every time the search session is reset on leaving the search route.
// SearchTabScreen uses the value as a React key, so a return to the route
// remounts SearchScreen with fresh scope/group/page state — the same state a
// first visit starts with.
export const searchSessionNonceAtom = atom(0, 'searchSessionNonceAtom')
