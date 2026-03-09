import { action, atom } from '@reatom/framework'

export const isAudioPlayerMountedAtom = atom(false, 'isAudioPlayerMountedAtom')

export const setIsAudioPlayerMounted = action(
  (_ctx, value: boolean) => value,
  'setIsAudioPlayerMounted',
)
