import { action, atom } from '@reatom/framework'

export const isAudioPlayerMountedAtom = atom(false, 'isAudioPlayerMountedAtom')
export const isPlayerFullscreenAtom = atom(false, 'isPlayerFullscreenAtom')

export const setIsAudioPlayerMounted = action(async (ctx, value: boolean) => {
  await ctx.schedule(() => {
    isAudioPlayerMountedAtom(ctx, value)
  })
  return value
}, 'setIsAudioPlayerMounted')

export const setPlayerFullscreen = action(async (ctx, value: boolean) => {
  await ctx.schedule(() => {
    isPlayerFullscreenAtom(ctx, value)
  })
  return value
}, 'setPlayerFullscreen')
