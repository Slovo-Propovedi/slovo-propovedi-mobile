import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { LISTENING_PROGRESS_SNAPSHOT } from 'shared/config'

export const liveProgressSnapshotSchema = z.object({
  durationMs: z.number().nonnegative(),
  positionMs: z.number().nonnegative(),
  sermonId: z.string(),
})

export type LiveProgressSnapshot = z.infer<typeof liveProgressSnapshotSchema>

export const writeLiveProgressSnapshot = (value: LiveProgressSnapshot): void => {
  void AsyncStorage.setItem(LISTENING_PROGRESS_SNAPSHOT, JSON.stringify(value))
}

export const readLiveProgressSnapshot = async (): Promise<LiveProgressSnapshot | undefined> => {
  try {
    const raw = await AsyncStorage.getItem(LISTENING_PROGRESS_SNAPSHOT)
    if (!raw) return undefined

    const parsed = JSON.parse(raw) as unknown
    const result = liveProgressSnapshotSchema.safeParse(parsed)
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

export const clearLiveProgressSnapshot = (): void => {
  void AsyncStorage.removeItem(LISTENING_PROGRESS_SNAPSHOT)
}
