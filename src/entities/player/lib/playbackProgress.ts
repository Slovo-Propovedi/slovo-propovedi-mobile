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

/**
 * Вычисляет позицию возобновления: 0, если сохранённый прогресс относится к
 * другой проповеди; иначе позицию, ограниченную сохранённой длительностью.
 * @param parsedProgress - Разобранный прогресс из хранилища.
 * @param currentSermonId - Id восстанавливаемой проповеди.
 */
export const computeResumeMs = (
  parsedProgress: undefined | z.infer<typeof playbackProgressSchema>,
  currentSermonId: string,
): number => {
  if (!parsedProgress || parsedProgress.sermonId !== currentSermonId) return 0

  const { durationMs: duration, positionMs } = parsedProgress

  if (typeof duration === 'number' && duration > 0) return Math.min(positionMs, duration)
  return positionMs
}
