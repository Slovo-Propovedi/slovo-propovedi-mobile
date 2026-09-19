import { action, atom } from '@reatom/framework'

export const displayedProgressStateAtom = atom<{ progress: number; url: string } | null>(
  null,
  'displayedProgressStateAtom',
)

export const setDisplayedProgressStateAction = action(
  (ctx, state: { progress: number; url: string } | null) => {
    displayedProgressStateAtom(ctx, state)
    return state
  },
  'setDisplayedProgressState',
)
