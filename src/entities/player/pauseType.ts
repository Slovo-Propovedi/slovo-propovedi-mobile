import { action, atom } from '@reatom/framework'

// Pause type: 'auto' = interrupted by system (phone call), 'manual' = user paused
export const PauseType = {
  Auto: 'auto',
  Manual: 'manual',
} as const
export type PauseType = (typeof PauseType)[keyof typeof PauseType]

export const pauseTypeAtom = atom<null | PauseType>(null, 'pauseTypeAtom')

export const setPauseTypeAction = action(async (ctx, pauseType: null | PauseType) => {
  await ctx.schedule(() => {
    pauseTypeAtom(ctx, pauseType)
  })
  return pauseType
}, 'setPauseType')
