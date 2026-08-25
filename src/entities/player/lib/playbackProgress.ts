import AsyncStorage from '@react-native-async-storage/async-storage'
import { action } from '@reatom/framework'
import z from 'zod'
import { CURRENT_SOUND_POSITION } from 'shared/config'

export const playbackProgressSchema = z.object({
  durationMs: z.number().nonnegative().optional(),
  positionMs: z.number().nonnegative(),
  savedAtMs: z.number(),
  sermonId: z.string(),
})

export const savePlaybackProgress = action(
  async (
    _ctx,
    { durationMs, positionMs, sermonId }: Omit<z.infer<typeof playbackProgressSchema>, 'savedAtMs'>,
  ) => {
    await AsyncStorage.setItem(
      CURRENT_SOUND_POSITION,
      JSON.stringify({ durationMs, positionMs, savedAtMs: Date.now(), sermonId }),
    )
  },
  'savePlaybackProgress',
)
