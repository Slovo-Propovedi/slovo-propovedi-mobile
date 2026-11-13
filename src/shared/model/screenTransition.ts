import { atom } from '@reatom/framework'

/**
 * True while a push is expected to be animating the covering screen in. The
 * navigation handlers set it optimistically before `router.push`; the pushed
 * detail screen clears it on `transitionEnd`. The search overlay conceals only
 * once it is false, so it stays visible while the new screen slides over it.
 */
export const isScreenTransitioningAtom = atom(false, 'isScreenTransitioningAtom')
