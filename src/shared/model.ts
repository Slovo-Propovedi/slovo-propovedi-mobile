import { action, atom } from '@reatom/framework'

export const isAudioPlayerMountedAtom = atom(false, 'isAudioPlayerMountedAtom')

export const setIsAudioPlayerMounted = action(async (ctx, value: boolean) => {
  await ctx.schedule(() => {
    isAudioPlayerMountedAtom(ctx, value)
  })
  return value
}, 'setIsAudioPlayerMounted')
