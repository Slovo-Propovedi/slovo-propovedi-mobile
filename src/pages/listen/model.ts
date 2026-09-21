import { atom } from '@reatom/framework'

export const isListenScrollingAtom = atom(false, 'isListenScrollingAtom')

// По умолчанию true: свечение анимируется, пока не доказано, что оно за кадром.
export const isGlowVisibleAtom = atom(true, 'isGlowVisibleAtom')
