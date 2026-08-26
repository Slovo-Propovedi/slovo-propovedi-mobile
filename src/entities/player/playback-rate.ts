import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import z from 'zod'
import { CURRENT_PLAYBACK_RATE } from 'shared/config'

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const

export type PlaybackRate = (typeof PLAYBACK_RATES)[number]

export const playbackRateSchema = z.union([
  z.literal(0.75),
  z.literal(1),
  z.literal(1.25),
  z.literal(1.5),
  z.literal(2),
])

export const playbackRateAtom = atom<PlaybackRate>(1, 'playbackRateAtom')

export const setPlaybackRateAction = action(async (ctx, rate: PlaybackRate) => {
  await AsyncStorage.setItem(CURRENT_PLAYBACK_RATE, String(rate))
  await ctx.schedule(() => {
    playbackRateAtom(ctx, rate)
  })
  return rate
}, 'setPlaybackRate')
