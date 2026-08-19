import AsyncStorage from '@react-native-async-storage/async-storage'
import { LISTENING_PROGRESS_SNAPSHOT } from 'shared/config'

export interface LiveProgressSnapshot {
  durationMs: number
  positionMs: number
  sermonId: string
}

export const writeLiveProgressSnapshot = (value: LiveProgressSnapshot): void => {
  void AsyncStorage.setItem(LISTENING_PROGRESS_SNAPSHOT, JSON.stringify(value))
}

const isValidSnapshot = (value: unknown): value is LiveProgressSnapshot => {
  if (typeof value !== 'object' || value === null) return false

  const obj = value as Record<string, unknown>
  return (
    typeof obj.sermonId === 'string' &&
    typeof obj.positionMs === 'number' &&
    obj.positionMs >= 0 &&
    typeof obj.durationMs === 'number' &&
    obj.durationMs >= 0
  )
}

export const readLiveProgressSnapshot = async (): Promise<LiveProgressSnapshot | undefined> => {
  try {
    const raw = await AsyncStorage.getItem(LISTENING_PROGRESS_SNAPSHOT)
    if (!raw) return undefined

    const parsed = JSON.parse(raw) as unknown
    return isValidSnapshot(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

export const clearLiveProgressSnapshot = (): void => {
  void AsyncStorage.removeItem(LISTENING_PROGRESS_SNAPSHOT)
}
